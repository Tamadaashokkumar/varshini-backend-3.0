// controllers/chatController.js

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

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images and videos only
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
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: fileFilter,
}).single("file");

// Upload file to Cloudinary
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
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    uploadStream.end(fileBuffer);
  });
};

// Upload chat file
// Upload chat file
export const uploadChatFile = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        // ... (Error handling same as before) ...
        return errorResponse(res, err.message, 400);
      } else if (err) {
        return errorResponse(res, err.message, 400);
      }

      if (!req.file) {
        return errorResponse(res, "No file uploaded", 400);
      }

      // 👇👇👇 UPDATED LOGIC STARTS HERE 👇👇👇

      const mimeType = req.file.mimetype;
      let cloudinaryResourceType = "video"; // Default for Audio/Video
      let frontendFileType = "video"; // Default

      if (mimeType.startsWith("image/")) {
        cloudinaryResourceType = "image";
        frontendFileType = "image";
      } else if (mimeType.startsWith("audio/")) {
        cloudinaryResourceType = "video"; // Cloudinary stores audio as 'video'
        frontendFileType = "audio"; // 🔥 Frontend needs to know it's audio
      }

      // Upload to Cloudinary using cloudinaryResourceType
      const result = await uploadToCloudinary(
        req.file.buffer,
        cloudinaryResourceType,
      );

      return successResponse(res, 201, "File uploaded successfully", {
        fileUrl: result.secure_url,
        fileType: frontendFileType, // 🔥 Send correct type ('audio') to Frontend
        fileName: req.file.originalname,
        fileSize: req.file.size,
        publicId: result.public_id,
      });

      // 👆👆👆 UPDATED LOGIC ENDS HERE 👆👆👆
    });
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(res, 500, "Failed to upload file");
  }
};

// Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.getChatHistory(
      roomId,
      parseInt(page),
      parseInt(limit),
    );

    const totalMessages = await Message.countDocuments({ roomId });
    const totalPages = Math.ceil(totalMessages / limit);

    return successResponse(res, 200, "Chat history retrieved", {
      messages: messages.reverse(), // Send in chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalMessages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    return errorResponse(res, 500, "Failed to retrieve chat history");
  }
};

// Get user's chat rooms
export const getChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role === "admin" ? "Admin" : "User";

    // Get all unique room IDs for this user
    const rooms = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $last: "$text" },
          lastMessageTime: { $last: "$createdAt" },
          lastMessageType: { $last: "$messageType" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)],
                    },
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
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    // Get other participant details for each room
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const [userId1, userId2] = room._id.split("_");
        const otherUserId = userId1 === userId ? userId2 : userId1;

        // Try to find in User first, then Admin
        let otherUser = await User.findById(otherUserId).select(
          "name email profilePicture",
        );
        if (!otherUser) {
          otherUser = await Admin.findById(otherUserId).select(
            "name email profilePicture",
          );
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

    return successResponse(res, 200, "Chat rooms retrieved", {
      rooms: roomsWithDetails,
    });
  } catch (error) {
    console.error("Get chat rooms error:", error);
    return errorResponse(res, 500, "Failed to retrieve chat rooms");
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    await Message.markRoomAsRead(roomId, userId);

    return successResponse(res, 200, "Messages marked as read");
  } catch (error) {
    console.error("Mark as read error:", error);
    return errorResponse(res, 500, "Failed to mark messages as read");
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role === "admin" ? "Admin" : "User";

    const count = await Message.getUnreadCount(userId, userModel);

    return successResponse(res, 200, "Unread count retrieved", {
      unreadCount: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    return errorResponse(res, 500, "Failed to get unread count");
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return errorResponse(res, 404, "Message not found");
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId) {
      return errorResponse(res, 403, "Unauthorized to delete this message");
    }

    await message.deleteOne();

    return successResponse(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error("Delete message error:", error);
    return errorResponse(res, 500, "Failed to delete message");
  }
};

// 🔥 NEW: Get Users who chatted with Admin (For Sidebar)
export const getChatUsersForAdmin = asyncHandler(async (req, res) => {
  const adminId = req.user._id; // Auth middleware నుండి Admin ID వస్తుంది

  // 1. అడ్మిన్ కి సంబంధించిన అన్ని మెసేజ్‌లను తెచ్చి, యూజర్ల వారీగా గ్రూప్ చేయాలి
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: adminId }, // అడ్మిన్ పంపినవి
          { receiverId: adminId }, // అడ్మిన్ రిసీవ్ చేసుకున్నవి
        ],
      },
    },
    {
      $sort: { createdAt: -1 }, // లేటెస్ట్ మెసేజ్ కోసం సార్టింగ్
    },
    {
      $group: {
        _id: {
          // ఇక్కడ అవతలి వ్యక్తి (User) ID ని తీసుకుంటున్నాం
          $cond: {
            if: { $eq: ["$senderId", adminId] },
            then: "$receiverId",
            else: "$senderId",
          },
        },
        lastMessage: { $first: "$text" }, // ఆ గ్రూప్‌లో మొదటిది (లేటెస్ట్)
        lastMessageTime: { $first: "$createdAt" },
        messageType: { $first: "$messageType" },
        // అడ్మిన్ చదవని మెసేజ్‌లను లెక్కపెట్టడం
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
    { $sort: { lastMessageTime: -1 } }, // చివరిగా మెసేజ్ పంపిన వారిని పైన చూపించడానికి
  ]);

  // 2. ఆ ID లకు సంబంధించిన User వివరాలను (Name, Photo) నింపాలి
  const populatedConversations = await User.populate(conversations, {
    path: "_id",
    select: "name email profilePicture",
  });

  // 3. డేటాని ఫ్రంటెండ్‌కి కావాల్సిన ఫార్మాట్‌లోకి మార్చడం
  const formattedData = populatedConversations
    .filter((conv) => conv._id) // డిలీట్ అయిన యూజర్లను తీసేయడానికి
    .map((conv) => ({
      _id: conv._id._id,
      name: conv._id.name,
      email: conv._id.email,
      profilePicture: conv._id.profilePicture,
      lastMessage:
        conv.messageType === "image"
          ? "📷 Image"
          : conv.messageType === "video"
            ? "🎥 Video"
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
