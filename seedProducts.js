import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

const fixStockStatus = async () => {
  try {
    console.log("⏳ Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database Connected!");

    const products = await Product.find({});
    console.log(`🔍 Found ${products.length} products to check.`);

    let fixedCount = 0;

    for (const p of products) {
      // --- LOGIC START ---
      // Manam hook kosam wait cheyakunda, ikkade force ga status marcheddam
      const currentStock = Number(p.stock);
      const threshold = Number(p.lowStockThreshold) || 5;

      if (currentStock === 0) {
        p.stockStatus = "Out of Stock";
      } else if (currentStock <= threshold) {
        p.stockStatus = "Low Stock";
      } else {
        p.stockStatus = "In Stock";
      }
      // --- LOGIC END ---

      // 'markModified' vadatam valla Mongoose ki manam cheptunnam "Change ayyindi save cheyu" ani
      p.markModified("stockStatus");

      await p.save();
      fixedCount++;
      process.stdout.write(
        `\r🛠 Fixing Product: ${p.name.substring(0, 15)}... -> ${p.stockStatus}`,
      );
    }

    console.log("\n\n🎉 SUCCESS: All products have been refreshed!");
    console.log("👉 Now check your Admin Dashboard.");

    mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
};

fixStockStatus();
