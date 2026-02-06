import express from "express";
import {
  createReview,
  getProductReviews,
  deleteReview,
  checkReviewEligibility,
} from "../controllers/reviewController.js";
import { protect, customerOnly } from "../middlewares/auth.js";
import { upload } from "../config/cloudinary.js";

// 🔥 mergeParams: true ఉండటం వల్ల, productRoutes లోని :productId ఇక్కడికి వస్తుంది.
const router = express.Router({ mergeParams: true });
router.get("/:productId/can-review", protect, checkReviewEligibility);
router
  .route("/")
  .get(getProductReviews)
  .post(protect, customerOnly, upload.array("images", 3), createReview); // 🔥 createReview ఇక్కడ ఉంది

router.route("/:id").delete(protect, deleteReview);

export default router;
