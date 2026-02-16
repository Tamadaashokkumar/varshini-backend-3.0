// import express from "express";
// import { body } from "express-validator";
// import { validate } from "../middlewares/validate.js";
// import { protect, customerOnly } from "../middlewares/auth.js";
// import {
//   registerUser,
//   loginUser,
//   getUserProfile,
//   updateUserProfile,
//   changeUserPassword,
//   addAddress,
//   updateAddress,
//   deleteAddress,
//   refreshUserToken,
//   logoutUser,
//   forgotPassword,
//   resetPassword,
//   googleLogin,
// } from "../controllers/authController.js";

// const router = express.Router();

// /**
//  * @route   POST /api/auth/register
//  * @desc    Register new user
//  * @access  Public
//  */
// router.post(
//   "/register",
//   [
//     body("name").trim().notEmpty().withMessage("Name is required"),
//     body("email").isEmail().withMessage("Valid email is required"),
//     body("password")
//       .isLength({ min: 6 })
//       .withMessage("Password must be at least 6 characters"),
//     body("phone")
//       .matches(/^[0-9]{10}$/)
//       .withMessage("Valid 10-digit phone number is required"),
//   ],
//   validate,
//   registerUser,
// );

// /**
//  * @route   POST /api/auth/login
//  * @desc    User login
//  * @access  Public
//  */
// router.post(
//   "/login",
//   [
//     body("email").isEmail().withMessage("Valid email is required"),
//     body("password").notEmpty().withMessage("Password is required"),
//   ],
//   validate,
//   loginUser,
// );

// /**
//  * @route   POST /api/auth/refresh-token
//  * @desc    Refresh access token
//  * @access  Public
//  */
// router.post(
//   "/refresh-token",
//   [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
//   validate,
//   refreshUserToken,
// );

// /**
//  * @route   GET /api/auth/profile
//  * @desc    Get user profile
//  * @access  Private (Customer)
//  */
// router.get("/profile", protect, customerOnly, getUserProfile);

// /**
//  * @route   PUT /api/auth/profile
//  * @desc    Update user profile
//  * @access  Private (Customer)
//  */
// router.put(
//   "/profile",
//   protect,
//   customerOnly,
//   [
//     body("name")
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage("Name cannot be empty"),
//     body("phone")
//       .optional()
//       .matches(/^[0-9]{10}$/)
//       .withMessage("Valid 10-digit phone number is required"),
//   ],
//   validate,
//   updateUserProfile,
// );

// /**
//  * @route   PUT /api/auth/change-password
//  * @desc    Change user password
//  * @access  Private (Customer)
//  */
// router.put(
//   "/change-password",
//   protect,
//   customerOnly,
//   [
//     body("currentPassword")
//       .notEmpty()
//       .withMessage("Current password is required"),
//     body("newPassword")
//       .isLength({ min: 6 })
//       .withMessage("New password must be at least 6 characters"),
//   ],
//   validate,
//   changeUserPassword,
// );

// /**
//  * @route   POST /api/auth/address
//  * @desc    Add new address
//  * @access  Private (Customer)
//  */
// router.post(
//   "/address",
//   protect,
//   customerOnly,
//   [
//     body("street").trim().notEmpty().withMessage("Street is required"),
//     body("city").trim().notEmpty().withMessage("City is required"),
//     body("state").trim().notEmpty().withMessage("State is required"),
//     body("pincode")
//       .matches(/^[0-9]{6}$/)
//       .withMessage("Valid 6-digit pincode is required"),
//   ],
//   validate,
//   addAddress,
// );

// /**
//  * @route   PUT /api/auth/address/:addressId
//  * @desc    Update address
//  * @access  Private (Customer)
//  */
// router.put(
//   "/address/:addressId",
//   protect,
//   customerOnly,
//   [
//     body("street")
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage("Street cannot be empty"),
//     body("city")
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage("City cannot be empty"),
//     body("state")
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage("State cannot be empty"),
//     body("pincode")
//       .optional()
//       .matches(/^[0-9]{6}$/)
//       .withMessage("Valid 6-digit pincode is required"),
//   ],
//   validate,
//   updateAddress,
// );

// /**
//  * @route   DELETE /api/auth/address/:addressId
//  * @desc    Delete address
//  * @access  Private (Customer)
//  */
// router.delete("/address/:addressId", protect, customerOnly, deleteAddress);

// /**
//  * @route   POST /api/auth/logout
//  * @desc    Logout user
//  * @access  Private (Customer)
//  */
// router.post("/logout", protect, customerOnly, logoutUser);

// router.post("/forgot-password", forgotPassword);
// router.patch("/reset-password/:token", resetPassword);
// router.post("/google-login", googleLogin);

// export default router;

import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validate.js"; // మీ దగ్గర ఈ ఫైల్ ఉందని అనుకుంటున్నాను
// 🔥 Updated Import Path based on previous steps
import { protect, customerOnly } from "../middlewares/auth.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  addAddress,
  updateAddress,
  deleteAddress,
  refreshUserToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  googleLogin,
  getGarage,
  addVehicleToGarage,
  removeVehicleFromGarage,
  syncGarage,
  checkSession,
} from "../controllers/authController.js";
import { decodeVinHandler } from "../controllers/vinController.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Valid 10-digit phone number is required"),
  ],
  validate,
  registerUser,
);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  loginUser,
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
// 🔥 CHANGE: Removed validation for body("refreshToken")
// ఎందుకంటే ఇప్పుడు టోకెన్ బాడీలో రాదు, కుక్కీలో వస్తుంది.
router.post("/refresh-token", refreshUserToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private (Customer)
 */
router.get("/profile", protect, customerOnly, getUserProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private (Customer)
 */
router.put(
  "/profile",
  protect,
  customerOnly,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("phone")
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage("Valid 10-digit phone number is required"),
  ],
  validate,
  updateUserProfile,
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private (Customer)
 */
router.put(
  "/change-password",
  protect,
  customerOnly,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  validate,
  changeUserPassword,
);

/**
 * @route   POST /api/auth/address
 * @desc    Add new address
 * @access  Private (Customer)
 */
router.post(
  "/address",
  protect,
  customerOnly,
  [
    body("street").trim().notEmpty().withMessage("Street is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    body("pincode")
      .matches(/^[0-9]{6}$/)
      .withMessage("Valid 6-digit pincode is required"),
  ],
  validate,
  addAddress,
);

/**
 * @route   PUT /api/auth/address/:addressId
 * @desc    Update address
 * @access  Private (Customer)
 */
router.put(
  "/address/:addressId",
  protect,
  customerOnly,
  [
    body("street")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Street cannot be empty"),
    body("city")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("City cannot be empty"),
    body("state")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("State cannot be empty"),
    body("pincode")
      .optional()
      .matches(/^[0-9]{6}$/)
      .withMessage("Valid 6-digit pincode is required"),
  ],
  validate,
  updateAddress,
);

/**
 * @route   DELETE /api/auth/address/:addressId
 * @desc    Delete address
 * @access  Private (Customer)
 */
router.delete("/address/:addressId", protect, customerOnly, deleteAddress);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (Customer)
 */
router.post("/logout", protect, customerOnly, logoutUser);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

// Google Auth Route
router.post("/google-login", googleLogin);

// --- GARAGE ROUTES ---
// 1. Get Garage & Add Vehicle
router
  .route("/garage")
  .get(protect, getGarage)
  .post(protect, addVehicleToGarage);

// 2. Remove Vehicle
router.route("/garage/:vehicleId").delete(protect, removeVehicleFromGarage);

// 3. Sync Local Garage (Call this immediately after Login on Frontend)
router.post("/garage/sync", protect, syncGarage);
router.post("/garage/decode-vin", decodeVinHandler);
router.get("/check-session", protect, checkSession);

export default router;
