// import Review from "../models/Review.js";
// import Product from "../models/Product.js";
// import { asyncHandler, AppError } from "../utils/errorHandler.js";
// import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
// import Order from "../models/Order.js";

// /**
//  * @desc    Create a Review
//  * @route   POST /api/products/:productId/reviews
//  * @access  Private (User)
//  */
// export const createReview = asyncHandler(async (req, res) => {
//   const { product: productIdBody, rating, review } = req.body;
//   const productId = req.params.productId || productIdBody;
//   const userId = req.user.id;

//   // 1. Check if product exists
//   const product = await Product.findById(productId);
//   if (!product) {
//     throw new AppError("Product not found", 404);
//   }

//   // 🔥 FIX IS HERE: Changed 'orderItems' to 'items'
//   // మీ Schema లో items అని ఉంది కాబట్టి ఇక్కడ కూడా items వాడాలి
//   const hasPurchased = await Order.findOne({
//     user: userId,
//     "items.product": productId, // ✅ Correct Field Name
//     orderStatus: "Delivered",
//   });

//   if (!hasPurchased) {
//     // Debugging కోసం: ఒకవేళ యూజర్ కొని ఉండి, స్టేటస్ వేరేలా ఉందేమో చెక్ చేయండి
//     // console.log("Purchase Check Failed for:", userId, productId);
//     throw new AppError(
//       "You can only review products that you have purchased and received (Delivered status).",
//       403,
//     );
//   }

//   // 2. Check duplicate review
//   const alreadyReviewed = await Review.findOne({
//     product: productId,
//     user: userId,
//   });
//   if (alreadyReviewed) {
//     throw new AppError("You have already reviewed this product", 400);
//   }

//   // 3. Handle Images
//   let images = [];
//   if (req.files && req.files.length > 0) {
//     images = req.files.map((file) => ({
//       url: file.path,
//       publicId: file.filename,
//     }));
//   }

//   // 4. Create Review
//   const newReview = await Review.create({
//     product: productId,
//     user: userId,
//     rating,
//     review,
//     images,
//   });

//   sendSuccess(res, 201, "Review added successfully", { review: newReview });
// });

// /**
//  * @desc    Get All Reviews for a Product
//  * @route   GET /api/products/:productId/reviews
//  * @access  Public
//  */
// export const getProductReviews = asyncHandler(async (req, res) => {
//   const { productId } = req.params;
//   const { page = 1, limit = 10 } = req.query;
//   const skip = (Number(page) - 1) * Number(limit);

//   const reviews = await Review.find({ product: productId })
//     .populate({
//       path: "user",
//       select: "name avatar", // యూజర్ పేరు, ఫోటో మాత్రమే చూపించు
//     })
//     .sort({ createdAt: -1 }) // కొత్తవి పైన
//     .skip(skip)
//     .limit(Number(limit));

//   const total = await Review.countDocuments({ product: productId });

//   sendPaginatedResponse(res, 200, "Reviews retrieved", reviews, {
//     total,
//     page: Number(page),
//     limit: Number(limit),
//   });
// });

// /**
//  * @desc    Delete Review
//  * @route   DELETE /api/reviews/:id
//  * @access  Private (User/Admin)
//  */
// export const deleteReview = asyncHandler(async (req, res) => {
//   const review = await Review.findById(req.params.id);

//   if (!review) {
//     throw new AppError("Review not found", 404);
//   }

//   // రివ్యూ రాసిన వాడు లేదా అడ్మిన్ మాత్రమే డిలీట్ చేయాలి
//   if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
//     throw new AppError("Not authorized to delete this review", 401);
//   }

//   // findByIdAndDelete వాడితేనే మన post hook పనిచేస్తుంది
//   await Review.findByIdAndDelete(req.params.id);

//   sendSuccess(res, 200, "Review deleted successfully");
// });

import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";

/**
 * 🔥 HELPER: Calculate & Update Average Rating
 * రివ్యూ యాడ్ అయినా, డిలీట్ అయినా ఇది రన్ అయ్యి ప్రొడక్ట్ రేటింగ్‌ని అప్‌డేట్ చేస్తుంది.
 */
const updateProductStats = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        numReviews: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // అప్‌డేట్ ప్రొడక్ట్
  await Product.findByIdAndUpdate(productId, {
    totalReviews: stats[0]?.numReviews || 0,
    averageRating: Math.round((stats[0]?.avgRating || 0) * 10) / 10, // 4.3333 -> 4.3
  });
};

/**
 * @desc    Create a Review
 * @route   POST /api/products/:productId/reviews
 * @access  Private (User)
 */
export const createReview = asyncHandler(async (req, res) => {
  const { product: productIdBody, rating, review } = req.body;
  const productId = req.params.productId || productIdBody;
  const userId = req.user.id;

  // 1. Basic Validation
  if (!rating || !review) {
    throw new AppError("Please provide rating and review text", 400);
  }

  // 2. Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // 3. 🔥 Verified Purchase Check
  const hasPurchased = await Order.findOne({
    user: userId,
    "items.product": productId,
    orderStatus: "Delivered",
  });

  if (!hasPurchased) {
    throw new AppError(
      "You can only review products that you have purchased and received.",
      403,
    );
  }

  // 4. Check duplicate review
  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (alreadyReviewed) {
    throw new AppError("You have already reviewed this product", 400);
  }

  // 5. Handle Images
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
  }

  // 6. Create Review
  const newReview = await Review.create({
    product: productId,
    user: userId,
    rating: Number(rating),
    review,
    images,
  });

  // 7. 🔥 UPDATE PRODUCT STATS (Average Rating Update)
  await updateProductStats(productId);

  sendSuccess(res, 201, "Review added successfully", { review: newReview });
});

/**
 * @desc    Get All Reviews for a Product
 * @route   GET /api/products/:productId/reviews
 * @access  Public
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const reviews = await Review.find({ product: productId })
    .populate({
      path: "user",
      select: "name avatar",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Review.countDocuments({ product: productId });

  sendPaginatedResponse(res, 200, "Reviews retrieved", reviews, {
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

/**
 * @desc    Delete Review
 * @route   DELETE /api/reviews/:id
 * @access  Private (User/Admin)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  // Authorization Check
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    throw new AppError("Not authorized to delete this review", 401);
  }

  const productId = review.product; // Save product ID before delete

  await Review.findByIdAndDelete(req.params.id);

  // 🔥 UPDATE PRODUCT STATS AFTER DELETE
  // రివ్యూ డిలీట్ అయ్యాక కూడా రేటింగ్ తగ్గాలి కదా!
  await updateProductStats(productId);

  sendSuccess(res, 200, "Review deleted successfully");
});

/**
 * @desc    Check Review Eligibility (Frontend Helper)
 * @route   GET /api/products/:productId/can-review
 * @access  Private
 */
export const checkReviewEligibility = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  // 1. Check if purchased
  const hasPurchased = await Order.findOne({
    user: userId,
    "items.product": productId,
    orderStatus: "Delivered",
  });

  // 2. Check if already reviewed
  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: userId,
  });

  res.status(200).json({
    success: true,
    canReview: !!hasPurchased && !alreadyReviewed, // రెండు కండిషన్లు ఓకే అయితేనే true
  });
});
