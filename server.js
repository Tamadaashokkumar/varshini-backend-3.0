import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";
import { initializeSocket } from "./sockets/socketHandler.js";
import Admin from "./models/Admin.js";
import startCronJobs from "./utils/cronJobs.js";

// Load environment variables
dotenv.config();

/**
 * Environment Variables Validation
 */
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error(
    "\nPlease check your .env file and ensure all required variables are set.",
  );
  process.exit(1);
}

// Get port from environment or use default
const PORT = process.env.PORT || 5000;

/**
 * Create HTTP Server
 */
const server = http.createServer(app);

/**
 * Initialize Socket.io
 */
initializeSocket(server);

startCronJobs();

/**
 * Create Default Admin (First Time Setup)
 * Creates an admin account if none exists
 */
const createDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();

    if (adminCount === 0) {
      const defaultAdmin = await Admin.create({
        name: "Admin",
        email: process.env.ADMIN_EMAIL || "admin@hyundaispares.com",
        password: process.env.ADMIN_PASSWORD || "Admin@12345",
        role: "superadmin",
      });

      console.log("✅ Default admin account created:");
      console.log(`   Email: ${defaultAdmin.email}`);
      console.log(
        `   Password: ${process.env.ADMIN_PASSWORD || "Admin@12345"}`,
      );
      console.log("   ⚠️  Please change the password after first login!");
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
  }
};

/**
 * Start Server
 * Connect to database and start listening
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create default admin if needed
    await createDefaultAdmin();

    // Start server
    server.listen(PORT, () => {
      console.log("");
      console.log("═══════════════════════════════════════════════════════");
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`,
      );
      console.log(`📡 Server listening on port ${PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`💓 Health Check: http://localhost:${PORT}/health`);
      console.log("═══════════════════════════════════════════════════════");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

/**
 * Graceful Shutdown
 * Handle process termination signals
 */
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`);

  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error(error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ UNHANDLED REJECTION! Shutting down...");
  console.error(error);
  server.close(() => {
    process.exit(1);
  });
});

// Start the server
startServer();
