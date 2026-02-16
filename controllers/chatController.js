import multer from "multer";
import { cloudinary } from "../config/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import {
  sendSuccess as successResponse,
  sendError as errorResponse,
} from "../utils/response.js";

// --- MULTER CONFIGURATION ---
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|mp3|wav|ogg|m4a/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter,
}).single("file");

// Upload helper
const uploadToCloudinary = (fileBuffer, resourceType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "chat_media",
        transformation:
          resourceType === "image"
            ? [{ quality: "auto", fetch_format: "auto" }]
            : [{ quality: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(fileBuffer);
  });
};

// --- 1. Upload Chat File ---
export const uploadChatFile = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return errorResponse(res, err.message, 400);
      if (!req.file) return errorResponse(res, "No file uploaded", 400);

      const mimeType = req.file.mimetype;
      let cloudinaryResourceType = "video";
      let frontendFileType = "video";

      if (mimeType.startsWith("image/")) {
        cloudinaryResourceType = "image";
        frontendFileType = "image";
      } else if (mimeType.startsWith("audio/")) {
        cloudinaryResourceType = "video";
        frontendFileType = "audio";
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        cloudinaryResourceType,
      );

      return successResponse(res, 201, "File uploaded successfully", {
        fileUrl: result.secure_url,
        fileType: frontendFileType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        publicId: result.public_id,
      });
    });
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(res, 500, "Failed to upload file");
  }
};

// --- 2. Get Chat History (🔥 FIXED: Direct Query & Sort) ---
export const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // 🔥 FIX: Explicit Query to get NEWEST messages first
    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 }) // లేటెస్ట్ మెసేజ్ ముందు వస్తుంది
      .skip(skip)
      .limit(limitInt)
      .populate("senderId", "name email profilePicture") // 🔥 Populate ముఖ్యం (Frontend Alignment కోసం)
      .lean(); // Performance boost

    const totalMessages = await Message.countDocuments({ roomId });
    const totalPages = Math.ceil(totalMessages / limitInt);

    // Frontend కి పంపేటప్పుడు Oldest -> Newest ఆర్డర్ లో ఉండాలి (Reverse)
    const orderedMessages = messages.reverse();

    return successResponse(res, 200, "Chat history retrieved", {
      messages: orderedMessages,
      pagination: {
        currentPage: pageInt,
        totalPages,
        totalMessages,
        hasMore: pageInt < totalPages,
      },
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    return errorResponse(res, 500, "Failed to retrieve chat history");
  }
};

export const getChatRooms = async (req, res) => {
  try {
    // Current Login Admin ID
    const currentUserId = req.user.id.toString();

    // 1. AGGREGATION PIPELINE
    const rooms = await Message.aggregate([
      {
        $match: {
          $or: [
            // Check as ObjectId
            { senderId: new mongoose.Types.ObjectId(currentUserId) },
            { receiverId: new mongoose.Types.ObjectId(currentUserId) },
            // Check as String (Safety for your DB data)
            { senderId: currentUserId },
            { receiverId: currentUserId },
          ],
        },
      },
      // Sort Latest First
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          lastMessageType: { $first: "$messageType" },
          // Keep raw IDs to help debugging
          lastSenderId: { $first: "$senderId" },
          lastReceiverId: { $first: "$receiverId" },
          // Unread Count Logic
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    // Check if receiver is ME (Convert both to string for safety)
                    { $eq: [{ $toString: "$receiverId" }, currentUserId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    // 2. FETCH USER DETAILS
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        // 🔥 LOGIC: Extract "Other User ID" from Room ID
        // Room ID format: "AdminID_UserID" or "UserID_AdminID"
        const parts = room._id.split("_");

        // Find the ID that is NOT the current Admin ID
        let otherUserId = parts.find((id) => id !== currentUserId);

        // Fallback: If both IDs are same (self-msg) or split failed
        if (!otherUserId) {
          otherUserId =
            room.lastSenderId.toString() === currentUserId
              ? room.lastReceiverId.toString()
              : room.lastSenderId.toString();
        }

        let otherUser = null;

        // A. Check if Guest
        if (otherUserId.startsWith("guest_")) {
          otherUser = {
            _id: otherUserId,
            name: "Guest User",
            email: "guest@visit.or",
            profilePicture: null,
            isOnline: true,
          };
        } else {
          // B. Try fetching from User Collection
          try {
            otherUser = await User.findById(otherUserId).select(
              "name email profilePicture isOnline",
            );
          } catch (e) {} // Ignore invalid ID format errors

          // C. If not User, try Admin Collection
          if (!otherUser) {
            try {
              otherUser = await Admin.findById(otherUserId).select(
                "name email profilePicture isOnline",
              );
            } catch (e) {}
          }
        }

        // 🔥 CRITICAL FALLBACK:
        // User DB lo dorakkapoyina, List lo chupinchali.
        // ID ni Name ga chupistam temporary ga.
        if (!otherUser) {
          otherUser = {
            _id: otherUserId,
            name: "New Customer", // Or show ID: otherUserId.substring(0, 5)
            email: "details@missing.com",
            profilePicture: null,
            isOnline: false,
          };
        }

        return {
          roomId: room._id,
          otherUser,
          lastMessage: room.lastMessage,
          lastMessageTime: room.lastMessageTime,
          lastMessageType: room.lastMessageType,
          unreadCount: room.unreadCount,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Chat rooms retrieved",
      data: {
        rooms: roomsWithDetails,
      },
    });
  } catch (error) {
    console.error("Get chat rooms error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chat rooms",
    });
  }
};

// --- 4. Mark As Read ---
export const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Update many instead of custom method for safety
    await Message.updateMany(
      { roomId, receiverId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    return successResponse(res, 200, "Messages marked as read");
  } catch (error) {
    console.error("Mark as read error:", error);
    return errorResponse(res, 500, "Failed to mark messages as read");
  }
};

// --- 5. Get Unread Count ---
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });
    return successResponse(res, 200, "Unread count retrieved", {
      unreadCount: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    return errorResponse(res, 500, "Failed to get unread count");
  }
};

// --- 6. Delete Message ---
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const message = await Message.findById(messageId);

    if (!message) return errorResponse(res, 404, "Message not found");

    if (message.senderId.toString() !== userId.toString()) {
      return errorResponse(res, 403, "Unauthorized to delete this message");
    }

    await message.deleteOne();
    return successResponse(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error("Delete message error:", error);
    return errorResponse(res, 500, "Failed to delete message");
  }
};

// --- 7. Get Users for Admin Sidebar ---
export const getChatUsersForAdmin = asyncHandler(async (req, res) => {
  const adminId = req.user._id;

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: adminId }, { receiverId: adminId }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$senderId", adminId] },
            then: "$receiverId",
            else: "$senderId",
          },
        },
        lastMessage: { $first: "$text" },
        lastMessageTime: { $first: "$createdAt" },
        messageType: { $first: "$messageType" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$isRead", false] },
                  { $eq: ["$receiverId", adminId] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { lastMessageTime: -1 } },
  ]);

  const guestConversations = [];
  const realUserConversations = [];

  conversations.forEach((conv) => {
    if (conv._id && conv._id.toString().startsWith("guest_")) {
      guestConversations.push(conv);
    } else {
      realUserConversations.push(conv);
    }
  });

  const populatedRealUsers = await User.populate(realUserConversations, {
    path: "_id",
    select: "name email profilePicture",
  });

  const formattedGuests = guestConversations.map((conv) => ({
    ...conv,
    _id: {
      _id: conv._id,
      name: "Guest User",
      email: "N/A",
      profilePicture: null,
    },
  }));

  const allConversations = [...populatedRealUsers, ...formattedGuests];

  allConversations.sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
  );

  const formattedData = allConversations
    .filter((conv) => conv._id)
    .map((conv) => ({
      _id: conv._id._id,
      name: conv._id.name || "Unknown User",
      email: conv._id.email || "",
      profilePicture: conv._id.profilePicture,
      lastMessage:
        conv.messageType === "image"
          ? "📷 Image"
          : conv.messageType === "video"
            ? "🎥 Video"
            : conv.messageType === "audio"
              ? "🎤 Audio"
              : conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount,
    }));

  res.status(200).json({
    success: true,
    count: formattedData.length,
    data: formattedData,
  });
});
