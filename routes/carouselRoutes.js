import express from "express";
import {
  getCarousels,
  addCarousel,
  updateCarousel,
  deleteCarousel,
  getAllAdminCarousels,
} from "../controllers/carouselController.js";
import { protect, adminOnly } from "../middlewares/auth.js"; // మీ Auth Middleware ఇక్కడ వాడండి

const router = express.Router();

// Public Route (కస్టమర్ కోసం)
router.get("/", getCarousels);

// Admin Routes (అడ్మిన్ ప్యానెల్ కోసం)
router.get("/admin/all", protect, adminOnly, getAllAdminCarousels);
router.post("/", protect, adminOnly, addCarousel);
router.put("/:id", protect, adminOnly, updateCarousel);
router.delete("/:id", protect, adminOnly, deleteCarousel);

export default router;
