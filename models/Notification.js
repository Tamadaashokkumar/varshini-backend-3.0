import mongoose from 'mongoose';

/**
 * Notification Schema
 * Stores system notifications for users and admins
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientModel',
      required: true,
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['User', 'Admin'],
    },
    type: {
      type: String,
      required: true,
      enum: [
        'order_placed',
        'order_confirmed',
        'order_packed',
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'payment_success',
        'payment_failed',
        'low_stock',
        'out_of_stock',
        'general',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

/**
 * Indexes for faster queries
 */
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

/**
 * Auto-delete old read notifications after 30 days
 */
notificationSchema.index(
  { readAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { isRead: true },
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
