import mongoose from "mongoose";
import Product from "./models/Product.js"; // మీ మోడల్ పాత్
import dummyProducts from "./data/products.js";
import dotenv from "dotenv";

dotenv.config();

export const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    for (const product of dummyProducts) {
      // 1. ఈ Part Number తో ఇప్పటికే ప్రొడక్ట్ ఉందేమో చెక్ చేస్తున్నాం
      const exists = await Product.findOne({ partNumber: product.partNumber });

      if (exists) {
        console.log(`⚠️ Skipping: ${product.partNumber} (Already exists)`);
      } else {
        const newProduct = new Product(product);
        await newProduct.save();
        console.log(`✅ Added: ${product.partNumber}`);
      }
    }

    console.log("🎉 Process Completed!");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};
