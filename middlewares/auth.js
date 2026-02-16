import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // ---------------------------------------------------------
  // STEP 1: Get Token from Cookies (Recommended for Web)
  // Both Admin & Customer panels now use 'access_token' cookie
  // ---------------------------------------------------------
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // ---------------------------------------------------------
  // STEP 2: Fallback to Header (For Mobile Apps / Postman)
  // ---------------------------------------------------------
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // ---------------------------------------------------------
  // STEP 3: Validate Token Existence
  // ---------------------------------------------------------
  if (!token) {
    return next(
      new AppError(
        "Not authorized. Please login to access this resource.",
        401,
      ),
    );
  }

  // ---------------------------------------------------------
  // STEP 4: Verify Token Signature
  // ---------------------------------------------------------
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    // Token Expired or Invalid
    return next(new AppError("Session expired or invalid token.", 401));
  }

  // ---------------------------------------------------------
  // STEP 5: Fetch User based on Role (Dynamic Model Selection)
  // ---------------------------------------------------------

  // A) Check if it's an Admin
  if (decoded.role === "admin" || decoded.role === "superadmin") {
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return next(new AppError("Admin profile not found.", 401));
    }

    // Check if admin is active (Optional security)
    if (admin.isActive === false) {
      return next(new AppError("Admin account deactivated.", 403));
    }

    req.user = admin;
    req.userType = "admin";
  }
  // B) Check if it's a Customer
  else {
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new AppError("User profile not found.", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated.", 403));
    }

    req.user = user;
    req.userType = "customer";
  }

  next();
});

// ---------------------------------------------------------
// Role-Based Access Middlewares (No Changes Needed)
// ---------------------------------------------------------

export const adminOnly = (req, res, next) => {
  if (req.user && req.userType === "admin") {
    next();
  } else {
    return next(new AppError("Access denied. Admin privileges required.", 403));
  }
};

export const customerOnly = (req, res, next) => {
  if (req.user && req.userType === "customer") {
    next();
  } else {
    return next(new AppError("Access denied. Customer account required.", 403));
  }
};

// ---------------------------------------------------------
// Optional Auth (Updated to check cookie first)
// ---------------------------------------------------------
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Cookie
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // 2. Check Header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token, just proceed as Guest (req.user will be undefined)
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.role === "admin" || decoded.role === "superadmin") {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (admin && admin.isActive !== false) {
        req.user = admin;
        req.userType = "admin";
      }
    } else {
      const user = await User.findById(decoded.id).select("-password");
      if (user && user.isActive) {
        req.user = user;
        req.userType = "customer";
      }
    }
  } catch (error) {
    // Ignore invalid tokens in optional auth
  }

  next();
});
