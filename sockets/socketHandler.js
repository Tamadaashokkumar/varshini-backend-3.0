import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import ActivityLog from "../models/ActivityLog.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let io;

// ================== STORES ==================
const userSockets = new Map();
const adminSockets = new Set();
const onlineUsers = new Map();

// ================== INIT ==================
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.FRONTEND_URL,
        process.env.ADMIN_DASHBOARD_URL,
      ].filter(Boolean),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // --- AI LOGIC (Varshini - Hyundai Spares Support) ---
  const generateAIReply = async (userMessage) => {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `
You are 'Varshini', a professional and helpful customer support agent for 'Hyundai Spares'. 
Your goal is to assist customers with inquiries about Hyundai car spare parts, pricing, availability, and order status.

***GUIDELINES***:
1. **Tone**: Polite, professional, yet warm and approachable.
2. **Language**: Reply in the same language the user uses (Telugu or English). Mix them naturally if needed (Tanglish).
3. **Context**: You are an expert on Hyundai vehicles (i10, i20, Creta, Verna, etc.).
4. **Brevity**: Keep answers concise and to the point. Do not write long paragraphs.
5. **Unknowns**: If you don't know a specific price, ask them to upload a photo of the part or check the website catalog.

***EXAMPLE SCENARIOS***:
- User: "i20 bumper price entha?"
  Varshini: "Hyundai i20 model batti price marutundi sir. Approx ga ₹2500 - ₹4000 undochu. Exact price kosam website check cheyandi."
- User: "Where is my order?"
  Varshini: "Please share your Order ID so I can track it for you."
- User: "Hi"
  Varshini: "Namaste! Welcome to Hyundai Spares. Nenu miku ela help cheyagalanu?"

Now reply to the user based on these guidelines.
          `,
          },
          { role: "user", content: userMessage },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5, // Slightly lower for more consistent/professional answers
        max_tokens: 200,
      });

      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error("AI Generation Error:", error.message);
      return "Technical issue valla respond avvalekapotunnanu. Please wait a moment.";
    }
  };

  // ================== AUTH MIDDLEWARE ==================
  io.use(async (socket, next) => {
    try {
      let token = null;

      // 1. Cookies
      if (socket.request.headers.cookie) {
        const cookieStr = socket.request.headers.cookie;
        const cookies = {};
        cookieStr.split(";").forEach((cookie) => {
          const parts = cookie.split("=");
          cookies[parts.shift().trim()] = decodeURI(parts.join("="));
        });
        token = cookies.access_token;
      }

      // 2. Auth Headers/Handshake
      if (!token) {
        if (socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
        } else if (
          socket.handshake.headers?.authorization?.startsWith("Bearer ")
        ) {
          token = socket.handshake.headers.authorization.split(" ")[1];
        }
      }

      if (!token)
        return next(new Error("Authentication error: Token missing."));

      // 3. Verification
      const decoded = verifyAccessToken(token);
      if (!decoded)
        return next(new Error("Authentication error: Invalid token."));

      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      // Guest Handling
      if (socket.userId.toString().startsWith("guest_")) {
        socket.user = { _id: socket.userId, name: "Guest", role: "guest" };
        socket.userType = "customer";
        return next();
      }

      // DB Verification
      if (decoded.role === "admin" || decoded.role === "superadmin") {
        const admin = await Admin.findById(decoded.id).select("-password");
        if (!admin) return next(new Error("Admin not found"));
        socket.user = admin;
        socket.userType = "admin";
      } else {
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return next(new Error("User not found"));
        if (!user.isActive) return next(new Error("Account deactivated"));
        socket.user = user;
        socket.userType = "customer";
      }

      next();
    } catch (err) {
      // console.error("Socket Auth Error:", err.message); // Optional: Uncomment for debug
      return next(new Error("Authentication error"));
    }
  });

  // ================== CONNECTION HANDLER ==================
  io.on("connection", (socket) => {
    // 1. Setup Rooms & Status
    socket.join(`user:${socket.userId}`);

    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, {
        sockets: new Set(),
        role: socket.userRole,
        userType: socket.userType,
      });
    }
    onlineUsers.get(socket.userId).sockets.add(socket.id);

    // Broadcast Online (Only on first connection)
    if (onlineUsers.get(socket.userId).sockets.size === 1) {
      io.emit("user_status_update", {
        userId: socket.userId,
        isOnline: true,
        userType: socket.userType,
        timestamp: new Date(),
      });
    }

    // Role Specific
    if (socket.userType === "admin") {
      adminSockets.add(socket.id);
      socket.join("admins");
      socket.join("admin_room");
    } else if (socket.userType === "customer") {
      userSockets.set(socket.userId, socket.id);
    }

    // ================== EVENTS ==================

    socket.on("check_online_status", ({ userId }) => {
      const isOnline =
        onlineUsers.has(userId) && onlineUsers.get(userId).sockets.size > 0;
      socket.emit("is_user_online_response", { userId, isOnline });
    });

    socket.on("get_online_users", () => {
      if (socket.userType === "admin") {
        socket.emit("online_users_list", Array.from(onlineUsers.keys()));
      }
    });

    socket.on("join_room", async (roomId) => {
      const roomToJoin = typeof roomId === "object" ? roomId.roomId : roomId;
      socket.join(roomToJoin);

      // Mark delivered when entering chat
      if (roomToJoin.includes("_")) {
        try {
          await Message.updateMany(
            {
              roomId: roomToJoin,
              receiverId: socket.userId,
              isDelivered: false,
            },
            { $set: { isDelivered: true } },
          );
        } catch (e) {
          /* Silent fail */
        }
      }
    });

    socket.on("send_message", async (data) => {
      try {
        if (!socket.userId) return;

        const receiverEntry = onlineUsers.get(data.receiverId);
        const isReceiverOnline =
          receiverEntry && receiverEntry.sockets.size > 0;

        const message = new Message({
          senderId: socket.userId,
          senderModel: socket.userType === "admin" ? "Admin" : "User",
          receiverId: data.receiverId,
          receiverModel: data.receiverModel,
          text: data.text || "",
          messageType: data.messageType || "text",
          fileUrl: data.fileUrl || null,
          roomId: data.roomId,
          isDelivered: !!isReceiverOnline,
        });

        await message.save();
        await message.populate("senderId", "name email profilePicture");

        // Broadcast to Room
        io.to(data.roomId).emit("receive_message", message);

        // Acknowledge Sender
        socket.emit("message_sent", {
          tempId: data.tempId,
          messageId: message._id,
        });

        // --- AI AUTO REPLY LOGIC ---
        if (data.receiverModel === "Admin" && data.messageType === "text") {
          const admin = await Admin.findById(data.receiverId);

          if (admin?.isAutoReplyEnabled) {
            const aiText = await generateAIReply(data.text);

            const aiMsg = await Message.create({
              senderId: data.receiverId,
              senderModel: "Admin",
              receiverId: socket.userId,
              receiverModel: "User",
              text: aiText,
              roomId: data.roomId,
              isDelivered: true,
            });

            await aiMsg.populate("senderId", "name email profilePicture");

            // Small delay to simulate typing
            setTimeout(() => {
              io.to(data.roomId).emit("receive_message", aiMsg);
            }, 1000);
          }
        }
      } catch (err) {
        console.error("Msg Send Error:", err.message);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // Typing Events
    // --- TYPING EVENTS FIX ---

    socket.on("typing", (data) => {
      // Log confirms data is { roomId: '...' }
      console.log("Typing received:", data);

      // 🔥 FIX: Data Object aithe 'roomId' teesuko, String aithe direct ga vadu
      const room = data.roomId ? data.roomId : data;

      // Ippudu 'room' pakka String ye untundi. Broadcast chestunnam...
      socket.to(room).emit("display_typing", {
        userId: socket.userId, // Evaru type chestunnaru?
        roomId: room,
      });
    });

    socket.on("stop_typing", (data) => {
      console.log("Stop Typing received:", data);

      // 🔥 FIX: Same logic here
      const room = data.roomId ? data.roomId : data;

      socket.to(room).emit("hide_typing", {
        userId: socket.userId,
        roomId: room,
      });
    });

    socket.on("mark_read", async ({ messageId, roomId }) => {
      // Optional: Implement specific message read logic if needed
    });

    // ================== DISCONNECT ==================
    socket.on("disconnect", () => {
      const userEntry = onlineUsers.get(socket.userId);
      if (userEntry) {
        userEntry.sockets.delete(socket.id);

        if (userEntry.sockets.size === 0) {
          onlineUsers.delete(socket.userId);
          io.emit("user_status_update", {
            userId: socket.userId,
            isOnline: false,
            userType: socket.userType,
            timestamp: new Date(),
          });
        }
      }

      if (socket.userType === "admin") adminSockets.delete(socket.id);
      if (socket.userType === "customer") userSockets.delete(socket.userId);
    });
  });

  console.log("🚀 Socket.io Service Initialized (Production Mode)");
  return io;
};

// ================== EXPORTS ==================
export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

export const emitToUser = (userId, event, data) =>
  io?.to(`user:${userId}`).emit(event, data);
export const emitToAdmins = (event, data) => io?.to("admins").emit(event, data);
export const isUserOnline = (userId) =>
  onlineUsers.has(userId) && onlineUsers.get(userId).sockets.size > 0;
