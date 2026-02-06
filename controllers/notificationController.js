import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { emitToUser, emitToAdmins } from '../sockets/socketHandler.js'; // Mee socket handler import

/**
 * 🔔 INTERNAL HELPER: Send Notification
 * Use this function in other controllers (Order, Product etc.)
 */
export const notify = async ({ recipient, recipientModel, type, title, message, data = {}, priority = 'medium' }) => {
  try {
    // 1. Save to Database
    const notification = await Notification.create({
      recipient,
      recipientModel, // 'User' or 'Admin'
      type,
      title,
      message,
      data,
      priority
    });

    // 2. Emit Real-time Socket Event
    const socketEvent = 'new_notification';
    
    if (recipientModel === 'Admin') {
      // Send to all admins
      emitToAdmins(socketEvent, notification);
    } else {
      // Send to specific user
      emitToUser(recipient.toString(), socketEvent, notification);
    }

    return notification;
  } catch (error) {
    console.error("Notification Error:", error);
    // Don't throw error to prevent stopping the main flow (e.g. order creation)
  }
};

/**
 * @desc    Get My Notifications (User/Admin)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Determine recipient model based on user role
  const recipientModel = req.user.role === 'admin' ? 'Admin' : 'User';

  // Fetch Notifications
  const notifications = await Notification.find({ 
    recipient: req.user._id,
    recipientModel 
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  // Count unread
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    recipientModel,
    isRead: false
  });

  const total = await Notification.countDocuments({
    recipient: req.user._id,
    recipientModel
  });

  sendSuccess(res, 200, "Notifications fetched", { 
    notifications, 
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Mark Notification as Read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  await notification.markAsRead(); // Schema lo unna method call chestunnam

  sendSuccess(res, 200, "Marked as read");
});

/**
 * @desc    Mark All as Read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const recipientModel = req.user.role === 'admin' ? 'Admin' : 'User';

  await Notification.updateMany(
    { recipient: req.user._id, recipientModel, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  sendSuccess(res, 200, "All notifications marked as read");
});