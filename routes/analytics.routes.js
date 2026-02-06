import express from 'express';
import { 
  updateInventoryAnalytics, 
  getHeatmapData, 
  getInventoryForecast 
} from '../controllers/analytics.controller.js';
import { protect, adminOnly } from "../middlewares/auth.js";

const router = express.Router();

// 1. Trigger AI Calculation (Manually or via Cron)
router.post('/calculate-inventory', protect, adminOnly, updateInventoryAnalytics);

// 2. Get Data for Heatmap
router.get('/heatmap', protect, adminOnly, getHeatmapData);

// 3. Get Inventory Forecast Data
router.get('/inventory-forecast', protect, adminOnly, getInventoryForecast);

export default router;