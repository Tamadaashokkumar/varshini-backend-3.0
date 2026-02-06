import express from 'express';
import {
  toggleWishlistItem,
  getWishlist,
  checkWishlistItem,
  clearWishlist,
} from '../controllers/wishlistController.js'; // .js extension important
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

// Toggle product in wishlist (add/remove)
router.post('/toggle', toggleWishlistItem);

// Get user's wishlist
router.get('/', getWishlist);

// Check if specific product is in wishlist
router.get('/check/:productId', checkWishlistItem);

// Clear entire wishlist
router.delete('/clear', clearWishlist);

export default router;