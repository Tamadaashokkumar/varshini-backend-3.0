import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      // type: mongoose.Schema.Types.ObjectId,
      type: String,
      required: true,
      refPath: "senderModel", // Dynamic reference (User or Admin)
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    receiverId: {
      // type: mongoose.Schema.Types.ObjectId,
      type: String,
      required: true,
      refPath: "receiverModel", // Dynamic reference
    },

    receiverModel: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    text: {
      type: String,
      default: "",
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio"],
      default: "text",
      required: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number, // In bytes
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    isEdited: { type: Boolean, default: false },
    readAt: {
      type: Date,
      default: null,
    },
    // 🔥 IMPORTANT: roomId must be String to handle "AdminID_UserID" format
    roomId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
messageSchema.index({ roomId: 1, createdAt: -1 }); // Chat history fetch కోసం
messageSchema.index({ senderId: 1, receiverId: 1 }); // Relationship check కోసం

// Virtual for formatting timestamp
messageSchema.virtual("formattedTime").get(function () {
  return this.createdAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Static method to get chat history with Pagination
messageSchema.statics.getChatHistory = async function (
  roomId,
  page = 1,
  limit = 50,
) {
  const skip = (page - 1) * limit;

  return await this.find({ roomId })
    .sort({ createdAt: 1 }) // Oldest first (WhatsApp style loading)
    .skip(skip)
    .limit(limit)
    .populate("senderId", "name email profilePicture")
    .populate("receiverId", "name email profilePicture");
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function (userId, userModel) {
  return await this.countDocuments({
    receiverId: userId,
    receiverModel: userModel,
    isRead: false,
  });
};

// Static method to mark all messages as read in a room
messageSchema.statics.markRoomAsRead = async function (roomId, userId) {
  return await this.updateMany(
    {
      roomId,
      receiverId: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );
};

// Ensure virtuals are included in JSON response
messageSchema.set("toJSON", { virtuals: true });
messageSchema.set("toObject", { virtuals: true });

// ✅ FIX: Check if model exists before compiling to prevent OverwriteModelError
const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
