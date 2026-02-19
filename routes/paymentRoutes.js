import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validate.js";
import { protect, adminOnly } from "../middlewares/auth.js"; // customerOnly తీసేశాను
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handlePaymentFailure,
  getPaymentDetails,
  getUserPaymentHistory,
  getAllPayments,
} from "../controllers/paymentController.js";

const router = express.Router();

/**
 * @route   POST /api/payments/create-razorpay-order
 * @desc    Create Razorpay order
 * @access  Private (Any logged-in user)
 */
router.post(
  "/create-razorpay-order",
  protect,
  [body("orderId").notEmpty().withMessage("Order ID is required")],
  validate,
  createRazorpayOrder,
);

/**
 * @route   POST /api/payments/verify-razorpay-payment
 * @desc    Verify Razorpay payment
 * @access  Private (Any logged-in user)
 */
router.post(
  "/verify-razorpay-payment",
  protect,
  [
    body("razorpayOrderId")
      .notEmpty()
      .withMessage("Razorpay order ID is required"),
    body("razorpayPaymentId")
      .notEmpty()
      .withMessage("Razorpay payment ID is required"),
    body("razorpaySignature")
      .notEmpty()
      .withMessage("Razorpay signature is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
  ],
  validate,
  verifyRazorpayPayment,
);

/**
 * @route   POST /api/payments/payment-failed
 * @desc    Handle payment failure
 * @access  Private (Any logged-in user)
 */
router.post(
  "/payment-failed",
  protect,
  [body("orderId").notEmpty().withMessage("Order ID is required")],
  validate,
  handlePaymentFailure,
);

/**
 * @route   GET /api/payments/:orderId
 * @desc    Get payment details
 * @access  Private (Customer/Admin)
 */
router.get("/:orderId", protect, getPaymentDetails);

/**
 * @route   GET /api/payments/user/history
 * @desc    Get user payment history
 * @access  Private (Any logged-in user)
 */
router.get("/user/history", protect, getUserPaymentHistory);

/**
 * @route   GET /api/payments/admin/all
 * @desc    Get all payments (Admin)
 * @access  Private (Admin)
 */
router.get("/admin/all", protect, adminOnly, getAllPayments);

export default router;
