import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * 🤖 AI Logic: Calculate Inventory Health & Forecast
 * రన్ ఫ్రీక్వెన్సీ: రోజుకు ఒకసారి (Cron Job ద్వారా) లేదా అడ్మిన్ "Refresh" కొట్టినప్పుడు.
 */
export const updateInventoryAnalytics = async (req, res) => {
  try {
    console.log("🔄 Starting AI Inventory Analysis...");

    // 1. Get all active products
    const products = await Product.find({ isDeleted: false });

    // 2. Define Time Range (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let updatesCount = 0;

    // 3. Loop through each product to calculate metrics
    for (const product of products) {
      
      // A. Calculate Total Quantity Sold in Last 30 Days
      // MongoDB Aggregation Pipeline
      const salesData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }, // గత 30 రోజులు
            orderStatus: { $nin: ['Cancelled', 'Returned'] }, // రద్దు అయినవి వద్దు
            "items.product": product._id // ఈ ప్రొడక్ట్ మాత్రమే
          }
        },
        { $unwind: "$items" },
        { $match: { "items.product": product._id } },
        {
          $group: {
            _id: null,
            totalSold: { $sum: "$items.quantity" }
          }
        }
      ]);

      const totalSoldLast30Days = salesData.length > 0 ? salesData[0].totalSold : 0;
      const averageDailySales = totalSoldLast30Days / 30;

      // B. AI Prediction: Days of Inventory Remaining
      // మన దగ్గర ఉన్న స్టాక్, ఈ స్పీడ్ లో అమ్మితే ఎన్ని రోజులు వస్తుంది?
      // నివారణ (Divide by zero check): డైలీ సేల్స్ 0 ఉంటే, 999 రోజులు అని వేద్దాం.
      const daysRemaining = averageDailySales > 0 
        ? Math.round(product.stock / averageDailySales) 
        : 999; 

      // C. Update Product with Analytics Data
      product.inventoryAnalytics = {
        averageMonthlySales: totalSoldLast30Days,
        reorderLevel: product.inventoryAnalytics.reorderLevel, // పాతది అలాగే ఉంచుతాం
        leadTimeDays: product.inventoryAnalytics.leadTimeDays,
        daysRemaining: daysRemaining, // 🔥 NEW Metric for Dashboard
        supplierEmail: product.inventoryAnalytics.supplierEmail
      };

      // D. Intelligent Stock Status Update
      // స్టాక్ 0 అయితే -> Out of Stock
      // స్టాక్ Reorder Level కంటే తక్కువ ఉంటే -> Low Stock
      // లేదంటే -> In Stock
      if (product.stock === 0) {
        product.stockStatus = 'Out of Stock';
      } else if (product.stock <= product.inventoryAnalytics.reorderLevel) {
        product.stockStatus = 'Low Stock';
      } else {
        product.stockStatus = 'In Stock';
      }

      await product.save();
      updatesCount++;
    }

    console.log(`✅ AI Analysis Complete. Updated ${updatesCount} products.`);
    
    if(res) {
        res.status(200).json({ success: true, message: `Inventory analytics updated for ${updatesCount} products` });
    }

  } catch (error) {
    console.error("❌ AI Inventory Error:", error);
    if(res) {
        res.status(500).json({ success: false, message: error.message });
    }
  }
};



/**
 * 🗺️ Heatmap Data API
 * ఫ్రంట్‌ఎండ్ మ్యాప్ కోసం సిటీల వారీగా ఆర్డర్ కౌంట్ ఇస్తుంది.
 */
export const getHeatmapData = async (req, res) => {
  try {
    const heatmapData = await Order.aggregate([
      {
        $match: { 
            orderStatus: { $ne: 'Cancelled' } // కాన్సిల్ అయినవి వద్దు
        }
      },
      {
        $group: {
          _id: "$shippingAddress.city", // సిటీ పేరుతో గ్రూప్ చేయి
          orderCount: { $sum: 1 },      // ఆర్డర్స్ లెక్కించు
          totalRevenue: { $sum: "$totalAmount" } // ఆ సిటీ నుండి వచ్చిన రెవెన్యూ
        }
      },
      {
        $project: {
          city: "$_id",
          count: "$orderCount",
          revenue: "$totalRevenue",
          _id: 0
        }
      },
      { $sort: { count: -1 } } // ఎక్కువ ఆర్డర్స్ ఉన్న సిటీ పైన రావాలి
    ]);

    // ఫ్యూచర్ లో ఇక్కడ Lat/Lng మ్యాపింగ్ కూడా చేయొచ్చు
    res.status(200).json({ success: true, data: heatmapData });

  } catch (error) {
    console.error("Heatmap Data Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch heatmap data" });
  }
};


/**
 * 📊 Get Inventory Forecast (For Dashboard Widget)
 * AI లెక్కించిన డేటా (Days Remaining) ఉన్న ప్రొడక్ట్స్ ని పంపుతుంది.
 */
export const getInventoryForecast = async (req, res) => {
  try {
    // తక్కువ రోజుల్లో స్టాక్ అయిపోయే ప్రొడక్ట్స్ ని ముందు చూపించు
    const products = await Product.find({ 
      isDeleted: false, 
      "inventoryAnalytics.daysRemaining": { $lt: 30 } // 30 రోజుల కంటే తక్కువ స్టాక్ ఉన్నవి
    })
    .select('name partNumber stock inventoryAnalytics images')
    .sort({ "inventoryAnalytics.daysRemaining": 1 }) // తక్కువ రోజులు ఉన్నవి పైన
    .limit(10);

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Forecast Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch forecast" });
  }
};