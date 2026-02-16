// import Wishlist from "../models/Wishlist.js";
// import Product from "../models/Product.js";
// import asyncHandler from "express-async-handler";

// // @desc    Toggle product in wishlist (add or remove)
// // @route   POST /api/wishlist/toggle
// // @access  Private
// export const toggleWishlistItem = asyncHandler(async (req, res) => {
//   console.log("👉 Wishlist Controller Hit!"); // <--- IDI ADD CHEYANDI
//   console.log("Body:", req.body);
//   const { productId } = req.body;
//   const userId = req.user._id;

//   // Validate product exists
//   const product = await Product.findById(productId);
//   if (!product) {
//     res.status(404);
//     throw new Error("Product not found");
//   }

//   // Find or create wishlist for user
//   let wishlist = await Wishlist.findOne({ user: userId });

//   if (!wishlist) {
//     // Create new wishlist with the product
//     wishlist = await Wishlist.create({
//       user: userId,
//       products: [{ product: productId }],
//     });

//     res.status(201).json({
//       success: true,
//       message: "Product added to wishlist",
//       action: "added",
//       wishlist: await wishlist.populate("products.product"),
//     });
//     return;
//   }

//   // Check if product already exists in wishlist
//   const productIndex = wishlist.products.findIndex(
//     (item) => item.product.toString() === productId,
//   );

//   if (productIndex > -1) {
//     // Remove product from wishlist
//     wishlist.products.splice(productIndex, 1);
//     await wishlist.save();

//     res.json({
//       success: true,
//       message: "Product removed from wishlist",
//       action: "removed",
//       wishlist: await wishlist.populate("products.product"),
//     });
//   } else {
//     // Add product to wishlist
//     wishlist.products.push({ product: productId });
//     await wishlist.save();

//     res.json({
//       success: true,
//       message: "Product added to wishlist",
//       action: "added",
//       wishlist: await wishlist.populate("products.product"),
//     });
//   }
// });

// // @desc    Get user's wishlist
// // @route   GET /api/wishlist
// // @access  Private
// export const getWishlist = asyncHandler(async (req, res) => {
//   const userId = req.user._id;

//   const wishlist = await Wishlist.findOne({ user: userId }).populate({
//     path: "products.product",
//     // 🔥 CRITICAL UPDATE HERE:
//     // Added 'discountPrice' and 'flashSale' so 'finalPrice' virtual works correctly
//     select: "name price discountPrice flashSale images stock category rating",
//   });

//   if (!wishlist) {
//     res.json({
//       success: true,
//       products: [],
//       count: 0,
//     });
//     return;
//   }

//   // Filter out any products that might have been deleted from DB but exist in wishlist
//   const validProducts = wishlist.products.filter(
//     (item) => item.product !== null,
//   );

//   res.json({
//     success: true,
//     products: validProducts,
//     count: validProducts.length,
//   });
// });

// // @desc    Check if product is in wishlist
// // @route   GET /api/wishlist/check/:productId
// // @access  Private
// export const checkWishlistItem = asyncHandler(async (req, res) => {
//   const { productId } = req.params;
//   const userId = req.user._id;

//   const wishlist = await Wishlist.findOne({ user: userId });

//   if (!wishlist) {
//     res.json({ inWishlist: false });
//     return;
//   }

//   const inWishlist = wishlist.products.some(
//     (item) => item.product.toString() === productId,
//   );

//   res.json({ inWishlist });
// });

// // @desc    Clear entire wishlist
// // @route   DELETE /api/wishlist/clear
// // @access  Private
// export const clearWishlist = asyncHandler(async (req, res) => {
//   const userId = req.user._id;

//   const wishlist = await Wishlist.findOne({ user: userId });

//   if (!wishlist) {
//     res.status(404);
//     throw new Error("Wishlist not found");
//   }

//   wishlist.products = [];
//   await wishlist.save();

//   res.json({
//     success: true,
//     message: "Wishlist cleared successfully",
//   });
// });

import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";

// @desc    Toggle product in wishlist (add or remove)
// @route   POST /api/wishlist/toggle
// @access  Private
export const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Find or create wishlist for user
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    // Create new wishlist with the product
    wishlist = await Wishlist.create({
      user: userId,
      products: [{ product: productId }],
    });

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      action: "added",
      wishlist: await wishlist.populate("products.product"),
    });
    return;
  }

  // Check if product already exists in wishlist
  const productIndex = wishlist.products.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (productIndex > -1) {
    // Remove product from wishlist
    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    res.json({
      success: true,
      message: "Product removed from wishlist",
      action: "removed",
      wishlist: await wishlist.populate("products.product"),
    });
  } else {
    // Add product to wishlist
    wishlist.products.push({ product: productId });
    await wishlist.save();

    res.json({
      success: true,
      message: "Product added to wishlist",
      action: "added",
      wishlist: await wishlist.populate("products.product"),
    });
  }
});

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "products.product",
    select: "name price discountPrice flashSale images stock category rating",
  });

  if (!wishlist) {
    res.json({
      success: true,
      products: [],
      count: 0,
    });
    return;
  }

  // Filter out any products that might have been deleted from DB but exist in wishlist
  const validProducts = wishlist.products.filter(
    (item) => item.product !== null,
  );

  res.json({
    success: true,
    products: validProducts,
    count: validProducts.length,
  });
});

// @desc    Check if product is in wishlist (Single - Legacy Support)
// @route   GET /api/wishlist/check/:productId
// @access  Private
export const checkWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    res.json({ inWishlist: false });
    return;
  }

  const inWishlist = wishlist.products.some(
    (item) => item.product.toString() === productId,
  );

  res.json({ inWishlist });
});

// 🔥 NEW: Check status for multiple products at once (Batch Optimization)
// @desc    Check wishlist status for a list of product IDs
// @route   POST /api/wishlist/check-status-batch
// @access  Private
export const checkBatchStatus = asyncHandler(async (req, res) => {
  const { productIds } = req.body; // Expects array of strings ["id1", "id2"]
  const userId = req.user._id;

  if (!productIds || !Array.isArray(productIds)) {
    res.status(400);
    throw new Error("Invalid product IDs provided");
  }

  const wishlist = await Wishlist.findOne({ user: userId });

  // If no wishlist exists, all are false
  if (!wishlist || !wishlist.products) {
    const emptyStatus = {};
    productIds.forEach((id) => {
      emptyStatus[id] = false;
    });

    res.json({
      success: true,
      statusMap: emptyStatus,
    });
    return;
  }

  // Create a Set of product IDs currently in the wishlist for O(1) lookup
  const wishlistProductIds = new Set(
    wishlist.products.map((item) => item.product.toString()),
  );

  // Build the response map { "prodId1": true, "prodId2": false }
  const statusMap = {};
  productIds.forEach((id) => {
    statusMap[id] = wishlistProductIds.has(id);
  });

  res.json({
    success: true,
    statusMap,
  });
});

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
export const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    res.status(404);
    throw new Error("Wishlist not found");
  }

  wishlist.products = [];
  await wishlist.save();

  res.json({
    success: true,
    message: "Wishlist cleared successfully",
  });
});
