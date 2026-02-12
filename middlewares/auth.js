// import { asyncHandler, AppError } from "../utils/errorHandler.js";
// import { verifyAccessToken } from "../utils/jwt.js";
// import User from "../models/User.js";
// import Admin from "../models/Admin.js";

// /**
//  * Protect Routes - Verify JWT Token
//  * Middleware to authenticate users using JWT
//  */
// export const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   // 1. Check for token in Authorization header
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }
//   // 2. Check for token in Cookies (ADDED THIS)
//   else if (req.cookies && req.cookies.accessToken) {
//     token = req.cookies.accessToken;
//   }

//   // 3. Check if token exists
//   if (!token) {
//     return next(
//       new AppError(
//         "Not authorized. Please login to access this resource.",
//         401,
//       ),
//     );
//   }

//   // 4. Verify Token (Isolated Try-Catch)
//   let decoded;
//   try {
//     decoded = verifyAccessToken(token);
//   } catch (error) {
//     return next(new AppError("Not authorized. Invalid token.", 401));
//   }

//   // 5. Check User Type and Database
//   if (decoded.role === "admin" || decoded.role === "superadmin") {
//     const admin = await Admin.findById(decoded.id).select("-password");

//     if (!admin) {
//       return next(new AppError("Admin not found", 401));
//     }

//     if (!admin.isActive) {
//       return next(new AppError("Admin account is deactivated", 401));
//     }

//     req.user = admin;
//     req.userType = "admin";
//   } else {
//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return next(new AppError("User not found", 401));
//     }

//     if (!user.isActive) {
//       return next(new AppError("User account is deactivated", 401));
//     }

//     req.user = user;
//     req.userType = "customer";
//   }

//   next();
// });

// /**
//  * Admin Only Middleware
//  */
// export const adminOnly = asyncHandler(async (req, res, next) => {
//   if (!req.user || req.userType !== "admin") {
//     return next(new AppError("Access denied. Admin privileges required.", 403));
//   }

//   next();
// });

// /**
//  * Customer Only Middleware
//  */
// export const customerOnly = asyncHandler(async (req, res, next) => {
//   if (!req.user || req.userType !== "customer") {
//     return next(new AppError("Access denied. Customer account required.", 403));
//   }

//   next();
// });

// /**
//  * Optional Authentication
//  */
// export const optionalAuth = asyncHandler(async (req, res, next) => {
//   let token;

//   // Check Header
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }
//   // Check Cookie (ADDED THIS)
//   else if (req.cookies && req.cookies.accessToken) {
//     token = req.cookies.accessToken;
//   }

//   if (token) {
//     try {
//       const decoded = verifyAccessToken(token);

//       if (decoded.role === "admin" || decoded.role === "superadmin") {
//         const admin = await Admin.findById(decoded.id).select("-password");
//         if (admin && admin.isActive) {
//           req.user = admin;
//           req.userType = "admin";
//         }
//       } else {
//         const user = await User.findById(decoded.id).select("-password");
//         if (user && user.isActive) {
//           req.user = user;
//           req.userType = "customer";
//         }
//       }
//     } catch (error) {
//       // Token invalid aithe parvaledu, Guest ga continue avtaru
//     }
//   }

//   next();
// });

// import { asyncHandler, AppError } from "../utils/errorHandler.js";
// import { verifyAccessToken } from "../utils/jwt.js";
// import User from "../models/User.js";
// import Admin from "../models/Admin.js";

/**
 * Protect Routes - Verify JWT Token
 * Middleware to authenticate users using JWT (Header primarily)
 */
// export const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   // 1. Check for token in Authorization header (Primary Method for React/Next.js)
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }
//   // 2. Check for token in Cookies (Optional: Future-proofing for SSR)
//   else if (req.cookies && req.cookies.accessToken) {
//     token = req.cookies.accessToken;
//   }

//   // 3. If token is missing
//   if (!token) {
//     return next(
//       new AppError(
//         "Not authorized. Please login to access this resource.",
//         401,
//       ),
//     );
//   }

//   // 4. Verify Token
//   let decoded;
//   try {
//     // మనం utils/jwt.js లో రాసిన ఫంక్షన్ వాడుతున్నాం
//     decoded = verifyAccessToken(token);
//   } catch (error) {
//     // Token Expire అయినా లేదా Invalid అయినా 401 ఎర్రర్ ఇస్తుంది
//     return next(new AppError("Session expired or invalid token.", 401));
//   }

//   // 5. Check User Type and Fetch form Database
//   // టోకెన్ పేలోడ్ లో 'role' ఉంది కాబట్టి, అది అడ్మిన్ ఆ లేదా యూజర్ ఆ అని చెక్ చేస్తున్నాం
//   if (decoded.role === "admin" || decoded.role === "superadmin") {
//     const admin = await Admin.findById(decoded.id).select("-password");

//     if (!admin) {
//       return next(new AppError("Admin profile not found.", 401));
//     }

//     if (!admin.isActive) {
//       return next(new AppError("Admin account is deactivated.", 403));
//     }

//     req.user = admin;
//     req.userType = "admin";
//   } else {
//     // Customer/User Logic
//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return next(new AppError("User profile not found.", 401));
//     }

//     if (!user.isActive) {
//       return next(new AppError("Your account has been deactivated.", 403));
//     }

//     req.user = user;
//     req.userType = "customer";
//   }

//   next();
// });

// export const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   // 1. First Priority: Check Cookies (Best for Web Browsers & Security)
//   if (req.cookies && req.cookies.accessToken) {
//     token = req.cookies.accessToken;
//     console.log("✅ Token found in COOKIES (jwt)");
//   }
//   // 2. Second Priority: Check Authorization Header (Best for Postman / Mobile Apps)
//   else if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//     console.log("✅ Token found in HEADER");
//   }
//   console.log("Final Token used:", token);
//   // 3. If token is missing
//   if (!token) {
//     return next(
//       new AppError(
//         "Not authorized. Please login to access this resource.",
//         401,
//       ),
//     );
//   }

//   // 4. Verify Token
//   let decoded;
//   try {
//     decoded = verifyAccessToken(token);
//   } catch (error) {
//     return next(new AppError("Session expired or invalid token.", 401));
//   }

//   // 5. Check User Type and Fetch from Database
//   // Note: Ikkada logic correct ga undi. Role ni batti DB query chestunnam.
//   if (decoded.role === "admin" || decoded.role === "superadmin") {
//     const admin = await Admin.findById(decoded.id).select("-password");

//     if (!admin) {
//       return next(new AppError("Admin profile not found.", 401));
//     }

//     // Optional: Refresh Token rotation logic kosam check cheyochu
//     // if (admin.refreshToken !== req.cookies.refreshToken) { ... }

//     req.user = admin;
//     req.userType = "admin";
//   } else {
//     // Customer Logic
//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return next(new AppError("User profile not found.", 401));
//     }

//     if (!user.isActive) {
//       return next(new AppError("Your account has been deactivated.", 403));
//     }

//     req.user = user;
//     req.userType = "customer";
//   }

//   next();
// });

import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  let decoded;

  // ---------------------------------------------------------
  // STEP 1: Check Cookies (Priority: Admin Panel)
  // Admin Panel uses 'accessToken' cookie.
  // ---------------------------------------------------------
  if (req.cookies && req.cookies.accessToken) {
    try {
      const cookieToken = req.cookies.accessToken;

      // Clean token if it has 'Bearer ' prefix (Safety check)
      const rawToken = cookieToken.startsWith("Bearer ")
        ? cookieToken.split(" ")[1]
        : cookieToken;

      decoded = verifyAccessToken(rawToken);
      token = rawToken; // Token is valid
    } catch (error) {
      // If Cookie token is invalid/expired, we ignore it.
      // We allow the code to proceed to check the Header.
      token = null;
    }
  }

  // ---------------------------------------------------------
  // STEP 2: Check Authorization Header (Priority: Customer Panel)
  // Customer Panel sends token in Headers.
  // ---------------------------------------------------------
  if (
    !token && // Only run this if Cookie check failed or was empty
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const headerToken = req.headers.authorization.split(" ")[1];
      decoded = verifyAccessToken(headerToken);
      token = headerToken; // Token is valid
    } catch (error) {
      // If a Header token is provided but invalid, we stop here.
      return next(new AppError("Session expired or invalid token.", 401));
    }
  }

  // ---------------------------------------------------------
  // STEP 3: Final Validation
  // ---------------------------------------------------------
  if (!token || !decoded) {
    return next(
      new AppError(
        "Not authorized. Please login to access this resource.",
        401,
      ),
    );
  }

  // ---------------------------------------------------------
  // STEP 4: Fetch User based on Role
  // ---------------------------------------------------------
  if (decoded.role === "admin" || decoded.role === "superadmin") {
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return next(new AppError("Admin profile not found.", 401));
    }

    req.user = admin;
    req.userType = "admin";
  } else {
    // Customer Logic
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

// Admin Only Middleware (No changes needed)
export const adminOnly = (req, res, next) => {
  if (req.user && req.userType === "admin") {
    next();
  } else {
    return next(new AppError("Access denied. Admin privileges required.", 403));
  }
};

// Customer Only Middleware (No changes needed)
export const customerOnly = (req, res, next) => {
  if (req.user && req.userType === "customer") {
    next();
  } else {
    return next(new AppError("Access denied. Customer account required.", 403));
  }
};

// Optional Auth (Supports both methods)
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Admin Cookie
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // 2. Check Header (Overrides cookie if present)
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);

      if (decoded.role === "admin" || decoded.role === "superadmin") {
        const admin = await Admin.findById(decoded.id).select("-password");
        if (admin && admin.isActive) {
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
      // Ignore errors for optional auth
    }
  }

  next();
});
