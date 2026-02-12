import express from "express";
import {
  getCarousels,
  addCarousel,
  updateCarousel,
  deleteCarousel,
  getAllAdminCarousels,
} from "../controllers/carouselController.js";
import { protect, adminOnly } from "../middlewares/auth.js";

// 🔥 మీ Cloudinary Config నుండి upload ని ఇంపోర్ట్ చేయండి
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", getCarousels);
router.get("/admin/all", protect, adminOnly, getAllAdminCarousels);

// 🔥 upload.single("image") అని పెట్టండి. Frontend లో FormData key "image" ఉండాలి.
router.post("/", protect, adminOnly, upload.single("image"), addCarousel);
router.put("/:id", protect, adminOnly, upload.single("image"), updateCarousel);
router.delete("/:id", protect, adminOnly, deleteCarousel);

export default router;
