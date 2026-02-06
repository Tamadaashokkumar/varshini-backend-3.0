import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validate.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { upload } from "../config/cloudinary.js"; // <--- 1. Import Cloudinary Middleware

import {
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  refreshAdminToken,
  adminLogout,
  logoutAllSessions,
  getAllCustomers,
  toggleAutoReply,
} from "../controllers/adminAuthController.js";

import { getChatUsersForAdmin } from "../controllers/chatController.js";

const router = express.Router();

/**
 * @route   POST /api/admin/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  adminLogin,
);

/**
 * @route   POST /api/admin/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  "/refresh-token",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validate,
  refreshAdminToken,
);

/**
 * @route   GET /api/admin/auth/profile
 * @desc    Get admin profile
 * @access  Private (Admin)
 */
router.get("/profile", protect, adminOnly, getAdminProfile);

/**
 * @route   PUT /api/admin/auth/profile
 * @desc    Update admin profile (Supports Image Upload)
 * @access  Private (Admin)
 */
router.put(
  "/profile",
  protect,
  adminOnly,
  upload.single("avatar"), // <--- 2. Add Middleware here (Before Validation)
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
  ],
  validate,
  updateAdminProfile,
);

/**
 * @route   PUT /api/admin/auth/change-password
 * @desc    Change admin password
 * @access  Private (Admin)
 */
router.put(
  "/change-password",
  protect,
  adminOnly,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  validate,
  changeAdminPassword,
);

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Admin logout (Current Session)
 * @access  Private (Admin)
 */
router.post("/logout", protect, adminOnly, adminLogout);

/**
 * @route   POST /api/admin/auth/logout-all
 * @desc    Logout from all devices (Security Feature)
 * @access  Private (Admin)
 */
router.post("/logout-all", protect, adminOnly, logoutAllSessions);

router.get("/users", protect, adminOnly, getAllCustomers);

router.get("/chat-users", protect, adminOnly, getChatUsersForAdmin);

router.put("/toggle-ai", protect, toggleAutoReply);
export default router;
