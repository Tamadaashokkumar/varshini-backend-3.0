import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';
import { protect, customerOnly,adminOnly } from '../middlewares/auth.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
  markAbandonedCarts, 
  getAbandonedCarts, 
  sendRecoveryEmail
} from '../controllers/cartController.js';

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get user cart
 * @access  Private (Customer)
 */
router.get('/', protect, customerOnly, getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private (Customer)
 */
router.post(
  '/add',
  protect,
  customerOnly,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
  ],
  validate,
  addToCart
);

/**
 * @route   PUT /api/cart/update/:itemId
 * @desc    Update cart item quantity
 * @access  Private (Customer)
 */
router.put(
  '/update/:itemId',
  protect,
  customerOnly,
  [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')],
  validate,
  updateCartItem
);

/**
 * @route   DELETE /api/cart/remove/:itemId
 * @desc    Remove item from cart
 * @access  Private (Customer)
 */
router.delete('/remove/:itemId', protect, customerOnly, removeFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear cart
 * @access  Private (Customer)
 */
router.delete('/clear', protect, customerOnly, clearCart);

/**
 * @route   POST /api/cart/sync
 * @desc    Sync cart (update prices and availability)
 * @access  Private (Customer)
 */
router.post('/sync', protect, customerOnly, syncCart);

// 1. Manual Trigger to check/mark carts (Testing purpose)
router.post('/admin/check-abandoned', protect, adminOnly, markAbandonedCarts);

// 2. Get list of all abandoned carts (For Dashboard Table)
router.get('/admin/abandoned', protect, adminOnly, getAbandonedCarts);

// 3. Send email when admin clicks button
router.post('/admin/send-recovery/:id', protect, adminOnly, sendRecoveryEmail);

export default router;
