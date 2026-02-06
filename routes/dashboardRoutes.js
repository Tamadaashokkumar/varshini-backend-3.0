import express from "express";
import { protect, adminOnly } from "../middlewares/auth.js";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getDailyRevenue,
  getRecentOrders,
  getLowStockProducts,
  getTopSellingProducts,
  getSalesByCategory,
  getCustomerGrowth,
  getPaymentMethodStats,
  getAdvancedAnalytics,
  getInventoryHealth,
  getExportData,
} from "../controllers/dashboardController.js";

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get("/stats", protect, adminOnly, getDashboardStats);

/**
 * @route   GET /api/dashboard/revenue/monthly
 * @desc    Get monthly revenue
 * @access  Private (Admin)
 */
router.get("/revenue/monthly", protect, adminOnly, getMonthlyRevenue);

/**
 * @route   GET /api/dashboard/revenue/daily
 * @desc    Get daily revenue (Last 30 days)
 * @access  Private (Admin)
 */
router.get("/revenue/daily", protect, adminOnly, getDailyRevenue);

/**
 * @route   GET /api/dashboard/orders/recent
 * @desc    Get recent orders
 * @access  Private (Admin)
 */
router.get("/orders/recent", protect, adminOnly, getRecentOrders);

/**
 * @route   GET /api/dashboard/products/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin)
 */
router.get("/products/low-stock", protect, adminOnly, getLowStockProducts);

/**
 * @route   GET /api/dashboard/products/top-selling
 * @desc    Get top selling products
 * @access  Private (Admin)
 */
router.get("/products/top-selling", protect, adminOnly, getTopSellingProducts);

/**
 * @route   GET /api/dashboard/sales/by-category
 * @desc    Get sales by category
 * @access  Private (Admin)
 */
router.get("/sales/by-category", protect, adminOnly, getSalesByCategory);

/**
 * @route   GET /api/dashboard/customers/growth
 * @desc    Get customer growth
 * @access  Private (Admin)
 */
router.get("/customers/growth", protect, adminOnly, getCustomerGrowth);

/**
 * @route   GET /api/dashboard/payments/methods
 * @desc    Get payment method statistics
 * @access  Private (Admin)
 */
router.get("/payments/methods", protect, adminOnly, getPaymentMethodStats);

// New Routes
router.get("/advanced-analytics", protect, adminOnly, getAdvancedAnalytics);
router.get("/inventory-health", protect, adminOnly, getInventoryHealth);
router.get("/export-data", protect, adminOnly, getExportData);

export default router;
