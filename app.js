import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser"; // <--- 1. IMPORT THIS
import { errorHandler, notFound } from "./utils/errorHandler.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
//import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from "./routes/dashboardRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js"; // <--- 3. IMPORT THIS
import notificationRoutes from "./routes/notificationRoutes.js";
import { seedProducts } from "./bulkdataadd.js";
import chatRoutes from "./routes/chatRoutes.js";
import carouselRoutes from "./routes/carouselRoutes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
//import { fixStockStatus } from "./seedProducts.js";
/**
 * Initialize Express Application
 * Configure middlewares and routes
 */
const app = express();

// ============================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ============================================

/**
 * CORS Configuration
 * Allow requests from frontend
 */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_DASHBOARD_URL,
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow mobile apps, Postman, Razorpay webhooks (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true, // This allows cookies to be sent/received
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Added OPTIONS
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "x-skip-refresh",
    ],
    exposedHeaders: ["Content-Disposition"],
  }),
);

/**
 * Security Headers with Helmet
 */
app.use(helmet());

/**
 * Body Parser
 * Parse JSON and URL-encoded data
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Cookie Parser
 * Parse Cookie header and populate req.cookies
 */
app.use(cookieParser()); // <--- 2. ADD THIS HERE (After body parser is fine)

/**
 * Compression
 * Compress response bodies
 */
app.use(compression());

/**
 * MongoDB Sanitization
 * Prevent NoSQL injection attacks
 */
app.use(mongoSanitize());

/**
 * Rate Limiting
 * Limit requests from same IP
 */

app.set("trust proxy", 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use("/api/", limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many authentication attempts, please try again later.",
});

// ============================================
// ROUTES
// ============================================

/**
 * Health Check Route
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/admin/auth", authLimiter, adminAuthRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
//app.use('/api/payments', paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/carousel", carouselRoutes);
app.use("/api/analytics", analyticsRoutes);
/**
 * API Documentation Route
 */
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hyundai Spares E-Commerce API",
    version: "1.0.0",
    // ... rest of your docs code
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFound);
app.use(errorHandler);
//fixStockStatus();

export default app;
