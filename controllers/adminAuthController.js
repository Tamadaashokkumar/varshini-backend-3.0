// import { asyncHandler, AppError } from "../utils/errorHandler.js";
// import { generateTokenPair, verifyRefreshToken } from "../utils/jwt.js";
// import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
// import Admin from "../models/Admin.js";
// import User from "../models/User.js";
// // Cloudinary config file unte import chesukondi, lekapothe comment lo unna logic chudandi
// import { cloudinary } from "../config/cloudinary.js";

// /**
//  * @desc    Admin Login
//  * @route   POST /api/admin/auth/login
//  * @access  Public
//  */
// export const adminLogin = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     throw new AppError("Please provide email and password", 400);
//   }

//   const admin = await Admin.findOne({ email }).select("+password");

//   if (!admin) {
//     throw new AppError("Invalid credentials", 401);
//   }

//   if (!admin.isActive) {
//     throw new AppError("Account is deactivated", 401);
//   }

//   const isPasswordValid = await admin.comparePassword(password);

//   if (!isPasswordValid) {
//     throw new AppError("Invalid credentials", 401);
//   }

//   const { accessToken, refreshToken } = generateTokenPair({
//     id: admin._id,
//     email: admin.email,
//     role: admin.role,
//   });

//   admin.refreshToken = refreshToken;
//   admin.lastLogin = new Date();
//   await admin.save();

//   sendSuccess(res, 200, "Login successful", {
//     admin: {
//       id: admin._id,
//       name: admin.name,
//       email: admin.email,
//       role: admin.role,
//       avatar: admin.avatar,
//       phone: admin.phone,
//       bio: admin.bio,
//       notifications: admin.notifications,
//     },
//     accessToken,
//     refreshToken,
//   });
// });

// /**
//  * @desc    Get Admin Profile
//  * @route   GET /api/admin/auth/profile
//  * @access  Private (Admin)
//  */
// export const getAdminProfile = asyncHandler(async (req, res) => {
//   const admin = await Admin.findById(req.user._id);

//   if (!admin) {
//     throw new AppError("Admin not found", 404);
//   }

//   sendSuccess(res, 200, "Profile retrieved successfully", {
//     data: admin, // Note: standardized to 'data' key or match your frontend expectation
//   });
// });

// /**
//  * @desc    Update Admin Profile (Cloudinary Integrated)
//  * @route   PUT /api/admin/auth/profile
//  * @access  Private (Admin)
//  */
// export const updateAdminProfile = asyncHandler(async (req, res) => {
//   // 1. Text Fields Extract Cheyandi
//   const { name, email, phone, bio, notifications } = req.body;

//   const admin = await Admin.findById(req.user._id);

//   if (!admin) {
//     throw new AppError("Admin not found", 404);
//   }

//   // 2. Image Upload Handling (Cloudinary)
//   // `upload.single` middleware already upload chesesindi.
//   // URL `req.file.path` lo untundi.
//   if (req.file) {
//     admin.avatar = req.file.path; // Direct Cloudinary URL saves to DB
//   }

//   // 3. Update Text Fields
//   if (name) admin.name = name;
//   if (email) admin.email = email;
//   if (phone) admin.phone = phone;
//   if (bio) admin.bio = bio;

//   // 4. Handle Notifications (Parsing JSON string from FormData)
//   if (notifications) {
//     let parsedNotifications = notifications;
//     // FormData nundi object string laga vasthe parse cheyali
//     if (typeof notifications === "string") {
//       try {
//         parsedNotifications = JSON.parse(notifications);
//       } catch (error) {
//         // Parsing fail aithe existing notifications ni em cheyoddu or default pettandi
//         console.error("Notification parsing failed:", error);
//       }
//     }

//     // Merge existing with new
//     admin.notifications = {
//       ...admin.notifications,
//       ...parsedNotifications,
//     };
//   }

//   // 5. Save and Return
//   await admin.save();

//   // Return updated data
//   sendSuccess(res, 200, "Profile updated successfully", {
//     admin: {
//       id: admin._id,
//       name: admin.name,
//       email: admin.email,
//       role: admin.role,
//       avatar: admin.avatar, // Updated URL
//       phone: admin.phone,
//       bio: admin.bio,
//       notifications: admin.notifications,
//     },
//   });
// });

// /**
//  * @desc    Change Admin Password
//  * @route   PUT /api/admin/auth/change-password
//  * @access  Private (Admin)
//  */
// export const changeAdminPassword = asyncHandler(async (req, res) => {
//   const { currentPassword, newPassword } = req.body;

//   if (!currentPassword || !newPassword) {
//     throw new AppError("Please provide current and new password", 400);
//   }

//   const admin = await Admin.findById(req.user._id).select("+password");

//   if (!admin) {
//     throw new AppError("Admin not found", 404);
//   }

//   const isPasswordValid = await admin.comparePassword(currentPassword);

//   if (!isPasswordValid) {
//     throw new AppError("Current password is incorrect", 401);
//   }

//   admin.password = newPassword;

//   // Optional: Force logout on other devices by changing refresh token logic
//   // admin.refreshToken = null;

//   await admin.save();

//   sendSuccess(res, 200, "Password changed successfully");
// });

// /**
//  * @desc    Refresh Access Token
//  * @route   POST /api/admin/auth/refresh-token
//  * @access  Public
//  */
// export const refreshAdminToken = asyncHandler(async (req, res) => {
//   const { refreshToken } = req.body;

//   if (!refreshToken) {
//     throw new AppError("Refresh token is required", 400);
//   }

//   try {
//     const decoded = verifyRefreshToken(refreshToken);

//     const admin = await Admin.findById(decoded.id).select("+refreshToken");

//     if (!admin || admin.refreshToken !== refreshToken) {
//       throw new AppError("Invalid refresh token", 401);
//     }

//     const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
//       id: admin._id,
//       email: admin.email,
//       role: admin.role,
//     });

//     admin.refreshToken = newRefreshToken;
//     await admin.save();

//     sendSuccess(res, 200, "Token refreshed successfully", {
//       accessToken,
//       refreshToken: newRefreshToken,
//     });
//   } catch (error) {
//     throw new AppError("Invalid or expired refresh token", 401);
//   }
// });

// /**
//  * @desc    Admin Logout (Current Session)
//  * @route   POST /api/admin/auth/logout
//  * @access  Private (Admin)
//  */
// export const adminLogout = asyncHandler(async (req, res) => {
//   const admin = await Admin.findById(req.user._id);

//   if (admin) {
//     // మనం ప్రస్తుతం సింగిల్ టోకెన్ సిస్టమ్ వాడుతున్నాం కాబట్టి,
//     // ఇది లాగౌట్ చేస్తే అన్ని చోట్లా లాగౌట్ అవుతుంది.
//     // మల్టీ-డివైస్ కావాలంటే DB Schema లో Array వాడాలి.
//     admin.refreshToken = null;
//     await admin.save();
//   }

//   // ✅ UPDATE: Cookies క్లియర్ చేయడం ముఖ్యం (మీరు కుకీస్ వాడినా వాడకపోయినా ఇది సేఫ్)
//   const options = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production", // https లో మాత్రమే పనిచేస్తుంది
//     sameSite: "strict", // CSRF protection
//   };

//   res.clearCookie("accessToken", options);
//   res.clearCookie("refreshToken", options);

//   sendSuccess(res, 200, "Logout successful");
// });

// /**
//  * @desc    Logout from All Devices
//  * @route   POST /api/admin/auth/logout-all
//  * @access  Private (Admin)
//  */
// export const logoutAllSessions = asyncHandler(async (req, res) => {
//   const admin = await Admin.findById(req.user._id);

//   if (admin) {
//     // ఉన్న రిఫ్రెష్ టోకెన్‌ని తీసేస్తే, ఎవరూ కొత్తగా యాక్సెస్ టోకెన్ పొందలేరు
//     admin.refreshToken = null;
//     await admin.save();
//   }

//   // క్లయింట్ సైడ్ కుకీస్ క్లియర్ చేయడం
//   const options = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "strict",
//   };

//   res.clearCookie("accessToken", options);
//   res.clearCookie("refreshToken", options);

//   sendSuccess(res, 200, "Logged out from all devices successfully");
// });

// /**
//  * @desc    Get All Customers (Admin)
//  * @route   GET /api/admin/users
//  * @access  Private (Admin)
//  */
// export const getAllCustomers = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, search } = req.query;

//   const query = { role: "customer" }; // Only fetch customers, not admins

//   // Search logic (Name, Email, Phone)
//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { email: { $regex: search, $options: "i" } },
//       { phone: { $regex: search, $options: "i" } },
//     ];
//   }

//   const skip = (Number(page) - 1) * Number(limit);

//   // Fetch users with their addresses to show location
//   const customers = await User.find(query)
//     .select("-password") // Don't send password
//     .populate("addresses") // To get location (City, State)
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(Number(limit));

//   const total = await User.countDocuments(query);

//   // Calculate stats for the cards (Total, Verified, With Address)
//   const totalCustomers = await User.countDocuments({ role: "customer" });
//   const verifiedEmails = await User.countDocuments({
//     role: "customer",
//     isEmailVerified: true,
//   });
//   // Note: This address count query assumes 'addresses' is an array in User model
//   const withAddresses = await User.countDocuments({
//     role: "customer",
//     addresses: { $exists: true, $not: { $size: 0 } },
//   });

//   sendPaginatedResponse(
//     res,
//     200,
//     "Customers retrieved successfully",
//     customers,
//     {
//       total,
//       page: Number(page),
//       limit: Number(limit),
//       stats: {
//         total: totalCustomers,
//         verified: verifiedEmails,
//         withAddress: withAddresses,
//       },
//     },
//   );
// });

// // Toggle AI Auto Reply (ON/OFF)
// export const toggleAutoReply = async (req, res) => {
//   try {
//     const adminId = req.user.id; // Auth Middleware nundi vastundi
//     const { status } = req.body; // Frontend nundi true/false vastundi

//     // Update Admin Profile
//     const updatedAdmin = await Admin.findByIdAndUpdate(
//       adminId,
//       { isAutoReplyEnabled: status },
//       { new: true },
//     ).select("-password");

//     res.status(200).json({
//       success: true,
//       message: `AI Reply turned ${status ? "ON" : "OFF"}`,
//       data: {
//         isAutoReplyEnabled: updatedAdmin.isAutoReplyEnabled,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to update AI status" });
//   }
// };

import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt.js";
import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";

// --- COOKIE OPTIONS (Reusable) ---
// Production lo 'secure: true' (https) undali, Local lo 'false'
const cookieOptions = {
  httpOnly: true, // JavaScript cannot access this (Security)
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
};

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

  if (!admin.isActive) {
    throw new AppError("Account is deactivated", 401);
  }

  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  // Generate Tokens
  const { accessToken, refreshToken } = generateTokenPair({
    id: admin._id,
    email: admin.email,
    role: admin.role,
  });

  // Save Refresh Token in DB
  admin.refreshToken = refreshToken;
  admin.lastLogin = new Date();
  await admin.save();

  // ✅ UPDATE: Set Cookies (Secure Method)
  // Access Token (Short lived - e.g., 15 mins)
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 Minutes
  });

  // Refresh Token (Long lived - e.g., 7 days)
  res.cookie("refreshToken", refreshToken, cookieOptions);

  sendSuccess(res, 200, "Login successful", {
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
    // Frontend ki token body lo pampalsina avasaram ledu,
    // endukante adi cookie lo automatic ga set aipoyindi.
  });
});

/**
 * @desc    Get Admin Profile
 * @route   GET /api/admin/auth/profile
 * @access  Private (Admin)
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
 * @access  Private (Admin)
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
 * @access  Private (Admin)
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

/**
 * @desc    Refresh Access Token (Using Cookies)
 * @route   POST /api/admin/auth/refresh-token
 * @access  Public
 */
export const refreshAdminToken = asyncHandler(async (req, res) => {
  // ✅ UPDATE: Read from Cookies instead of Body
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const admin = await Admin.findById(decoded.id).select("+refreshToken");

    if (!admin || admin.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
      id: admin._id,
      email: admin.email,
      role: admin.role,
    });

    admin.refreshToken = newRefreshToken;
    await admin.save();

    // ✅ UPDATE: Set New Cookies
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    sendSuccess(res, 200, "Token refreshed successfully");
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
});

/**
 * @desc    Admin Logout
 * @route   POST /api/admin/auth/logout
 * @access  Private (Admin)
 */
export const adminLogout = asyncHandler(async (req, res) => {
  // DB Cleanup (Optional based on strategy)
  if (req.user?._id) {
    await Admin.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  // ✅ UPDATE: Clear Cookies properly
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  sendSuccess(res, 200, "Logout successful");
});

/**
 * @desc    Logout from All Devices
 * @route   POST /api/admin/auth/logout-all
 * @access  Private (Admin)
 */
export const logoutAllSessions = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(req.user._id, { refreshToken: null });

  // Clear Cookies
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  sendSuccess(res, 200, "Logged out from all devices successfully");
});

/**
 * @desc    Get All Customers
 * @route   GET /api/admin/users
 * @access  Private (Admin)
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
 * @access  Private (Admin)
 */
// ✅ UPDATE: Wrapped in asyncHandler for consistency
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
