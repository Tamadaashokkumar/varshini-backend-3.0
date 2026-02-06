// routes/chatRoutes.js
import express from "express";
const router = express.Router();
import { protect as authenticate } from "../middlewares/auth.js";

import {
  uploadChatFile,
  getChatHistory,
  getChatRooms,
  markAsRead,
  getUnreadCount,
  deleteMessage,
} from "../controllers/chatController.js";
// All routes require authentication
router.use(authenticate);

// Upload file (image/video)
router.post("/upload", uploadChatFile);

// Get chat history for a specific room
router.get("/history/:roomId", getChatHistory);

// Get all chat rooms for current user
router.get("/rooms", getChatRooms);

// Mark messages as read in a room
router.put("/read/:roomId", markAsRead);

// Get unread message count
router.get("/unread-count", getUnreadCount);

// Delete a message
router.delete("/message/:messageId", deleteMessage);

export default router;
