// import mongoose from 'mongoose';

// /**
//  * Product Schema
//  * Stores Hyundai spare parts information with images, pricing, and stock
//  */
// const productSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'Product name is required'],
//       trim: true,
//     },
//     // Display Part Number (e.g., "86511-C9000")
//     partNumber: {
//       type: String,
//       required: [true, 'Part number is required'],
//       unique: true,
//       trim: true,
//       uppercase: true,
//     },
//     // HIDDEN FIELD: Searchable Part Number (e.g., "86511c9000")
//     // Helps when users search without dashes or spaces
//     sanitizedPartNumber: {
//       type: String,
//       trim: true,
//       lowercase: true,
//       index: true 
//     },
//     description: {
//       type: String,
//       required: [true, 'Product description is required'],
//     },
//     category: {
//       type: String,
//       required: [true, 'Category is required'],
//       // Categories are stable, so Enums are fine here
//       enum: ['Engine', 'Brake', 'Electrical', 'Body', 'Accessories', 'Suspension', 'Transmission', 'Interior', 'Exterior', 'Service Parts'],
//     },
//     subcategory: {
//       type: String,
//       trim: true,
//     },
//     // MAJOR UPDATE: Improved Compatibility Logic
//     // Instead of just a string, we now store Model + Year Range
//     compatibleModels: [
//       {
//         modelName: { 
//           type: String, 
//           required: true,
//           trim: true 
//           // Note: Enum removed to allow new car launches (e.g., Exter, Ioniq 5)
//         },
//         yearFrom: { type: Number, required: true }, // e.g., 2015
//         yearTo: { type: Number }, // e.g., 2020 (If null/undefined, it means "Till Date")
//         variant: { type: String, trim: true } // Optional: e.g., "Petrol", "Diesel", "Sportz"
//       }
//     ],
//     price: {
//       type: Number,
//       required: [true, 'Price is required'],
//       min: [0, 'Price cannot be negative'],
//     },
//     discountPrice: {
//       type: Number,
//       min: [0, 'Discount price cannot be negative'],
//       validate: {
//         validator: function (value) {
//           // If discountPrice is present, it must be less than price
//           return !value || value < this.price;
//         },
//         message: 'Discount price must be less than original price',
//       },
//     },
//     stock: {
//       type: Number,
//       required: [true, 'Stock quantity is required'],
//       min: [0, 'Stock cannot be negative'],
//       default: 0,
//     },
//     stockStatus: {
//       type: String,
//       enum: ['In Stock', 'Low Stock', 'Out of Stock'],
//       default: 'Out of Stock', // Safe default
//     },
//     lowStockThreshold: {
//       type: Number,
//       default: 5,
//     },
//     images: [
//       {
//         url: {
//           type: String,
//           required: true,
//         },
//         publicId: {
//           type: String,
//           required: true,
//         },
//       },
//     ],
//     specifications: {
//       type: Map,
//       of: String, // Dynamic key-value pairs (e.g., Material: Plastic, Color: Black)
//     },
//     warrantyPeriod: {
//       type: String, 
//       default: 'No Warranty',
//     },
//     manufacturer: {
//       type: String,
//       default: 'Hyundai Mobis', // Hyundai Genuine Parts usually come from Mobis
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//     tags: [String],
//     weight: {
//       type: Number, // in kg
//     },
//     dimensions: {
//       length: Number,
//       width: Number,
//       height: Number,
//       unit: {
//         type: String,
//         default: 'cm',
//       },
//     },
//     averageRating: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5,
//     },
//     totalReviews: {
//       type: Number,
//       default: 0,
//     },
//     totalSales: {
//       type: Number,
//       default: 0,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /**
//  * PRE-SAVE HOOK
//  * 1. Generate sanitizedPartNumber for better search
//  * 2. Update stockStatus based on quantity
//  */
// productSchema.pre('save', function (next) {
//   // Logic 1: Sanitize Part Number (Remove special chars)
//   if (this.isModified('partNumber')) {
//     this.sanitizedPartNumber = this.partNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
//   }

//   // Logic 2: Update Stock Status
//   if (this.isModified('stock')) {
//     if (this.stock === 0) {
//       this.stockStatus = 'Out of Stock';
//     } else if (this.stock <= this.lowStockThreshold) {
//       this.stockStatus = 'Low Stock';
//     } else {
//       this.stockStatus = 'In Stock';
//     }
//   }
//   next();
// });

// /**
//  * INDEXES
//  * Crucial for fast search performance in E-commerce
//  */
// productSchema.index({ name: 'text', description: 'text', sanitizedPartNumber: 'text' });
// productSchema.index({ category: 1, isActive: 1, isDeleted: 1 });
// // Index inside the array of objects for filtering
// productSchema.index({ "compatibleModels.modelName": 1, "compatibleModels.yearFrom": 1 });

// /**
//  * VIRTUALS
//  */
// productSchema.virtual('finalPrice').get(function () {
//   return this.discountPrice || this.price;
// });

// // Allow virtuals to show up in JSON response
// productSchema.set('toJSON', { virtuals: true });
// productSchema.set('toObject', { virtuals: true });

// /**
//  * QUERY MIDDLEWARE
//  * Exclude soft-deleted products automatically
//  */
// productSchema.pre(/^find/, function (next) {
//   this.where({ isDeleted: false });
//   next();
// });

// const Product = mongoose.model('Product', productSchema);

// export default Product;




import mongoose from 'mongoose';

/**
 * Product Schema
 * Stores Hyundai spare parts information with images, pricing, stock, AND Advanced Analytics
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    partNumber: {
      type: String,
      required: [true, 'Part number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    sanitizedPartNumber: {
      type: String,
      trim: true,
      lowercase: true,
      index: true 
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Engine', 'Brake', 'Electrical', 'Body', 'Accessories', 'Suspension', 'Transmission', 'Interior', 'Exterior', 'Service Parts'],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    compatibleModels: [
      {
        modelName: { type: String, required: true, trim: true },
        yearFrom: { type: Number, required: true },
        yearTo: { type: Number }, 
        variant: { type: String, trim: true }
      }
    ],
    
    // --- PRICING SECTION ---
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
    },

    // 🔥 NEW ADDITION: Dynamic Pricing & Flash Sales
    // ఇది "Flash Sale" ఫీచర్ కోసం ఉపయోగపడుతుంది.
    flashSale: {
      isActive: { type: Boolean, default: false },
      salePrice: { type: Number }, // ఆఫర్ ధర
      startTime: { type: Date },   // సేల్ ఎప్పుడు మొదలవ్వాలి?
      endTime: { type: Date }      // కౌంట్‌డౌన్ టైమర్ కోసం (Expire time)
    },

    // --- STOCK & INVENTORY ---
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    stockStatus: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'Out of Stock',
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    // 🔥 NEW ADDITION: AI Forecasting Data
    // AI లాజిక్ పని చేయడానికి ఈ డేటా అవసరం.
    inventoryAnalytics: {
      averageMonthlySales: { type: Number, default: 0 }, // AI దీనిని అప్‌డేట్ చేస్తుంది
      reorderLevel: { type: Number, default: 10 },       // ఇది దాటగానే సప్లయర్‌కి మెయిల్ వెళ్లాలి
      leadTimeDays: { type: Number, default: 7 },        // ఆర్డర్ పెడితే స్టాక్ రావడానికి ఎన్ని రోజులు పడుతుంది?
      supplierEmail: { type: String, trim: true }        // "Smart Restock" మెయిల్ ఎవరికీ వెళ్లాలి?
    },

    // --- MEDIA ---
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    // --- DETAILS ---
    specifications: {
      type: Map,
      of: String,
    },
    warrantyPeriod: {
      type: String, 
      default: 'No Warranty',
    },
    manufacturer: {
      type: String,
      default: 'Hyundai Mobis',
    },

    // 🔥 NEW ADDITION: Returns & Policies
    // RMA System కోసం ఈ ఫీల్డ్స్ అవసరం.
    returnPolicy: {
      isReturnable: { type: Boolean, default: true }, // ఉదా: Electrical parts return చేయలేము
      returnWindowDays: { type: Number, default: 7 }, // ఎన్ని రోజుల్లో రిటర్న్ చేయొచ్చు?
      restockingFee: { type: Number, default: 0 }     // రిటర్న్ చేస్తే ఏమైనా చార్జ్ ఉందా?
    },

    // --- SYSTEM FIELDS ---
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    
    // 🔥 NEW ADDITION: For Logistics Calculation
    shippingInfo: {
      weight: { type: Number, default: 0 }, // kg (Shiprocket కి అవసరం)
      length: { type: Number, default: 0 }, // cm
      width: { type: Number, default: 0 },  // cm
      height: { type: Number, default: 0 }  // cm
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// --- PRE-SAVE HOOKS ---

productSchema.pre('save', function (next) {
  // 1. Sanitize Part Number
  if (this.isModified('partNumber')) {
    this.sanitizedPartNumber = this.partNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  }

  // 2. Update Stock Status
  if (this.isModified('stock')) {
    if (this.stock === 0) {
      this.stockStatus = 'Out of Stock';
    } else if (this.stock <= this.lowStockThreshold) {
      this.stockStatus = 'Low Stock';
    } else {
      this.stockStatus = 'In Stock';
    }
  }

  // 🔥 NEW LOGIC: Flash Sale Validation
  // ఫ్లాష్ సేల్ ధర అసలు ధర కంటే తక్కువ ఉందా లేదా అని చెక్ చేస్తుంది
  if (this.flashSale && this.flashSale.isActive && this.flashSale.salePrice >= this.price) {
     // ఒకవేళ సేల్ ప్రైస్ ఎక్కువ ఉంటే, సేల్ ని ఆపేస్తాం (Safety Check)
     this.flashSale.isActive = false; 
  }

  next();
});

// --- INDEXES ---
productSchema.index({ name: 'text', description: 'text', sanitizedPartNumber: 'text' });
productSchema.index({ category: 1, isActive: 1, isDeleted: 1 });
productSchema.index({ "compatibleModels.modelName": 1, "compatibleModels.yearFrom": 1 });
// 🔥 NEW INDEX: For fast fetching of Flash Sales & Restock Alerts
productSchema.index({ "flashSale.isActive": 1, "flashSale.endTime": 1 });
productSchema.index({ "inventoryAnalytics.reorderLevel": 1 });

// --- VIRTUALS ---
productSchema.virtual('finalPrice').get(function () {
  // Logic: ఫ్లాష్ సేల్ యాక్టివ్‌గా ఉంటే మరియు టైమ్ అయిపోకపోతే 'salePrice' తీసుకో
  if (this.flashSale?.isActive && this.flashSale?.salePrice) {
    const now = new Date();
    if (now >= this.flashSale.startTime && now <= this.flashSale.endTime) {
      return this.flashSale.salePrice;
    }
  }
  // లేదంటే సాధారణ డిస్కౌంట్ లేదా అసలు ధర
  return this.discountPrice || this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// --- QUERY MIDDLEWARE ---
productSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;