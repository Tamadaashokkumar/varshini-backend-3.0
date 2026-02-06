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

import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

/**
 * Protect Routes - Verify JWT Token
 * Middleware to authenticate users using JWT (Header primarily)
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header (Primary Method for React/Next.js)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. Check for token in Cookies (Optional: Future-proofing for SSR)
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // 3. If token is missing
  if (!token) {
    return next(
      new AppError(
        "Not authorized. Please login to access this resource.",
        401,
      ),
    );
  }

  // 4. Verify Token
  let decoded;
  try {
    // మనం utils/jwt.js లో రాసిన ఫంక్షన్ వాడుతున్నాం
    decoded = verifyAccessToken(token);
  } catch (error) {
    // Token Expire అయినా లేదా Invalid అయినా 401 ఎర్రర్ ఇస్తుంది
    return next(new AppError("Session expired or invalid token.", 401));
  }

  // 5. Check User Type and Fetch form Database
  // టోకెన్ పేలోడ్ లో 'role' ఉంది కాబట్టి, అది అడ్మిన్ ఆ లేదా యూజర్ ఆ అని చెక్ చేస్తున్నాం
  if (decoded.role === "admin" || decoded.role === "superadmin") {
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return next(new AppError("Admin profile not found.", 401));
    }

    if (!admin.isActive) {
      return next(new AppError("Admin account is deactivated.", 403));
    }

    req.user = admin;
    req.userType = "admin";
  } else {
    // Customer/User Logic
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

/**
 * Admin Only Middleware
 * ఇది protect తర్వాతే వాడాలి
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.userType === "admin") {
    next();
  } else {
    return next(new AppError("Access denied. Admin privileges required.", 403));
  }
};

/**
 * Customer Only Middleware
 * ఇది protect తర్వాతే వాడాలి
 */
export const customerOnly = (req, res, next) => {
  if (req.user && req.userType === "customer") {
    next();
  } else {
    return next(new AppError("Access denied. Customer account required.", 403));
  }
};

/**
 * Optional Authentication
 * లాగిన్ అయితే యూజర్ డేటా వస్తుంది, లేకపోతే గెస్ట్ లాగా వదిలేస్తుంది (Error రాదు)
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // Token ఉంటేనే వెరిఫై చేస్తాం, లేకపోతే next() కి వెళ్తాం
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
      // Token expired or invalid? Just ignore and treat as guest
      // Do nothing
    }
  }

  next();
});
