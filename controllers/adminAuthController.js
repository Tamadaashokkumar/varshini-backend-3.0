import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt.js";
import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js"; // Avatar upload ki avasaram

// 🔥 CONFIGURATION: Cookie Options (Must match Auth Controller)
const getCookieOptions = (type) => {
  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    // httpOnly: true, // Security: JS cannot read this
    // secure: isProduction, // HTTPS only in production
    // sameSite: isProduction ? "strict" : "lax", // CSRF protection
    // path: "/",

    httpOnly: true,
    path: "/",

    // 👇 Render (Backend) & Vercel (Frontend) వేరు కాబట్టి ఇది తప్పనిసరి
    secure: true,

    // 👇 Strict ఉంటే పనిచేయదు. 'none' ఉంటేనే కుకీ వెళ్తుంది.
    sameSite: "none",
  };

  if (type === "access") {
    return { ...options, maxAge: 15 * 60 * 1000 }; // 15 Minutes
  }

  if (type === "refresh") {
    return { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 Days
  }

  return options;
};

/**
 * 🔥 HELPER: Handle Token Generation & Response
 * Code duplication tagginchadaniki common function
 */
const sendTokenResponse = async (admin, statusCode, res, message) => {
  // Generate Tokens
  const { accessToken, refreshToken } = generateTokenPair({
    id: admin._id,
    email: admin.email,
    role: admin.role,
  });

  // Save Refresh Token in DB
  admin.refreshToken = refreshToken;

  // Update lastLogin only for explicit login/refresh actions
  if (
    message.toLowerCase().includes("login") ||
    message.toLowerCase().includes("refresh")
  ) {
    admin.lastLogin = new Date();
  }

  await admin.save({ validateBeforeSave: false });

  // ✅ SET COOKIES (Standard Names: access_token, refresh_token)
  res.cookie("access_token", accessToken, getCookieOptions("access"));
  res.cookie("refresh_token", refreshToken, getCookieOptions("refresh"));

  // Send Response (Tokens Body lo vaddu)
  sendSuccess(res, statusCode, message, {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      phone: admin.phone,
      bio: admin.bio,
      notifications: admin.notifications,
      isAutoReplyEnabled: admin.isAutoReplyEnabled,
    },
    isAuthenticated: true,
  });
};

/* ==========================================================================
   AUTHENTICATION CONTROLLERS
   ========================================================================== */

/**
 * @desc    Admin Login
 * @route   POST /api/admin/auth/login
 * @access  Public
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    throw new AppError("Invalid credentials", 401);
  }

  if (admin.isActive === false) {
    throw new AppError("Account is deactivated", 403);
  }

  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  // Use Helper to send cookies
  await sendTokenResponse(admin, 200, res, "Login successful");
});

/**
 * @desc    Refresh Access Token
 * @route   POST /api/admin/auth/refresh-token
 * @access  Public
 */
export const refreshAdminToken = asyncHandler(async (req, res) => {
  // ✅ Read from Cookie (refresh_token)
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const admin = await Admin.findById(decoded.id).select("+refreshToken");

    // Token Reuse / Invalid Token Check
    if (!admin || admin.refreshToken !== refreshToken) {
      // Clear cookies immediately if suspicious
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      throw new AppError("Invalid refresh token", 401);
    }

    // Generate New Tokens & Rotate
    await sendTokenResponse(admin, 200, res, "Token refreshed successfully");
  } catch (error) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    throw new AppError("Invalid or expired refresh token", 401);
  }
});

/**
 * @desc    Check Session (For Page Reloads)
 * @route   GET /api/admin/auth/check-session
 * @access  Public
 */
export const checkAdminSession = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(200).json({ success: false, isAuthenticated: false });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const admin = await Admin.findById(decoded.id).select("+refreshToken");

    if (!admin || admin.refreshToken !== refreshToken) {
      throw new Error("Invalid Token");
    }

    // Restore Session (Rotate Tokens for security)
    await sendTokenResponse(admin, 200, res, "Session restored");
  } catch (error) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return res.status(200).json({ success: false, isAuthenticated: false });
  }
});

/**
 * @desc    Admin Logout
 * @route   POST /api/admin/auth/logout
 * @access  Private
 */
export const adminLogout = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await Admin.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  // ✅ Clear Cookies (use correct names and options)
  res.clearCookie("access_token", getCookieOptions("access"));
  res.clearCookie("refresh_token", getCookieOptions("refresh"));

  sendSuccess(res, 200, "Logout successful");
});

/**
 * @desc    Logout from All Devices
 * @route   POST /api/admin/auth/logout-all
 * @access  Private
 */
export const logoutAllSessions = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await Admin.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  res.clearCookie("access_token", getCookieOptions("access"));
  res.clearCookie("refresh_token", getCookieOptions("refresh"));

  sendSuccess(res, 200, "Logged out from all devices successfully");
});

/* ==========================================================================
   PROFILE MANAGEMENT
   ========================================================================== */

/**
 * @desc    Get Admin Profile
 * @route   GET /api/admin/auth/profile
 * @access  Private
 */
export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user._id);

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  sendSuccess(res, 200, "Profile retrieved successfully", {
    data: admin,
  });
});

/**
 * @desc    Update Admin Profile
 * @route   PUT /api/admin/auth/profile
 * @access  Private
 */
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, bio, notifications } = req.body;
  const admin = await Admin.findById(req.user._id);

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (req.file) {
    admin.avatar = req.file.path;
  }

  if (name) admin.name = name;
  if (email) admin.email = email;
  if (phone) admin.phone = phone;
  if (bio) admin.bio = bio;

  if (notifications) {
    let parsedNotifications = notifications;
    if (typeof notifications === "string") {
      try {
        parsedNotifications = JSON.parse(notifications);
      } catch (error) {
        console.error("Notification parsing failed:", error);
      }
    }
    admin.notifications = {
      ...admin.notifications,
      ...parsedNotifications,
    };
  }

  await admin.save();

  sendSuccess(res, 200, "Profile updated successfully", {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      phone: admin.phone,
      bio: admin.bio,
      notifications: admin.notifications,
    },
  });
});

/**
 * @desc    Change Admin Password
 * @route   PUT /api/admin/auth/change-password
 * @access  Private
 */
export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError("Please provide current and new password", 400);
  }

  const admin = await Admin.findById(req.user._id).select("+password");
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  const isPasswordValid = await admin.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  admin.password = newPassword;
  await admin.save();

  sendSuccess(res, 200, "Password changed successfully");
});

/* ==========================================================================
   CUSTOMER & SYSTEM MANAGEMENT
   ========================================================================== */

/**
 * @desc    Get All Customers
 * @route   GET /api/admin/users
 * @access  Private
 */
export const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const query = { role: "customer" };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const customers = await User.find(query)
    .select("-password")
    .populate("addresses")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments(query);
  const totalCustomers = await User.countDocuments({ role: "customer" });
  const verifiedEmails = await User.countDocuments({
    role: "customer",
    isEmailVerified: true,
  });
  const withAddresses = await User.countDocuments({
    role: "customer",
    addresses: { $exists: true, $not: { $size: 0 } },
  });

  sendPaginatedResponse(
    res,
    200,
    "Customers retrieved successfully",
    customers,
    {
      total,
      page: Number(page),
      limit: Number(limit),
      stats: {
        total: totalCustomers,
        verified: verifiedEmails,
        withAddress: withAddresses,
      },
    },
  );
});

/**
 * @desc    Toggle AI Auto Reply
 * @route   PUT /api/admin/auth/toggle-ai
 * @access  Private
 */
export const toggleAutoReply = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const { status } = req.body;

  const updatedAdmin = await Admin.findByIdAndUpdate(
    adminId,
    { isAutoReplyEnabled: status },
    { new: true },
  ).select("-password");

  if (!updatedAdmin) {
    throw new AppError("Admin not found", 404);
  }

  sendSuccess(res, 200, `AI Reply turned ${status ? "ON" : "OFF"}`, {
    isAutoReplyEnabled: updatedAdmin.isAutoReplyEnabled,
  });
});
