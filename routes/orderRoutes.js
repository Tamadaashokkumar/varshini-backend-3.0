import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validate.js";
import { protect, adminOnly, customerOnly } from "../middlewares/auth.js";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  downloadInvoice,
  reorderItems,
  requestReturn,
} from "../controllers/orderController.js";

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create order
 * @access  Private (Customer)
 */
router.post(
  "/",
  protect,
  customerOnly,
  [
    body("paymentMethod")
      .isIn(["COD", "Razorpay"])
      .withMessage("Payment method must be COD or Razorpay"),
  ],
  validate,
  createOrder,
);

/**
 * @route   GET /api/orders
 * @desc    Get user orders
 * @access  Private (Customer)
 */
router.get("/", protect, customerOnly, getUserOrders);

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (Admin)
 * @access  Private (Admin)
 */
router.get("/admin/all", protect, adminOnly, getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (Customer/Admin)
 */
router.get("/:id", protect, getOrderById);

/**
 * @route   GET /api/orders/:id/invoice
 * @desc    Download order invoice
 * @access  Private (Customer/Admin)
 */
router.get("/:id/invoice", protect, downloadInvoice);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private (Customer)
 */
router.put(
  "/:id/cancel",
  protect,
  customerOnly,
  [
    body("cancellationReason")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Cancellation reason cannot be empty"),
  ],
  validate,
  cancelOrder,
);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (Admin)
 * @access  Private (Admin)
 */
router.put(
  "/:id/status",
  protect,
  adminOnly,
  [
    body("orderStatus")
      .isIn([
        "Placed",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ])
      .withMessage("Invalid order status"),
  ],
  validate,
  updateOrderStatus,
);

// ✨ NEW: Re-order previous items (Buy Again)
router.post("/:id/reorder", protect, reorderItems);

// ✨ NEW: Request Return for a specific item
router.put("/:id/return/:itemId", protect, requestReturn);

export default router;
