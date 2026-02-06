// import mongoose from 'mongoose';

// /**
//  * Cart Schema
//  * Stores user's shopping cart with items and pricing
//  */
// const cartSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       unique: true, // One active cart per user
//     },
//     items: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: 'Product',
//           required: true,
//         },
//         quantity: {
//           type: Number,
//           required: true,
//           min: [1, 'Quantity must be at least 1'],
//           default: 1,
//         },
//         price: {
//           type: Number,
//           required: true,
//         },
//         subtotal: {
//           type: Number,
//           required: true,
//         },
//       },
//     ],
//     totalItems: {
//       type: Number,
//       default: 0,
//     },
//     subtotal: {
//       type: Number,
//       default: 0,
//     },
//     tax: {
//       type: Number,
//       default: 0,
//     },
//     taxPercentage: {
//       type: Number,
//       default: 18, // 18% GST
//     },
//     shippingCharges: {
//       type: Number,
//       default: 0,
//     },
//     totalAmount: {
//       type: Number,
//       default: 0,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /**
//  * Calculate cart totals before saving
//  */
// cartSchema.pre('save', function (next) {
//   // Calculate subtotal and total items
//   this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
//   this.subtotal = this.items.reduce((total, item) => total + item.subtotal, 0);

//   // Calculate tax (GST)
//   this.tax = (this.subtotal * this.taxPercentage) / 100;

//   // Calculate shipping charges (free shipping above ₹5000)
//   this.shippingCharges = this.subtotal >= 5000 ? 0 : 100;

//   // Calculate total amount
//   this.totalAmount = this.subtotal + this.tax + this.shippingCharges;

//   next();
// });

// /**
//  * Update item subtotal when quantity or price changes
//  */
// cartSchema.pre('save', function (next) {
//   this.items.forEach((item) => {
//     item.subtotal = item.quantity * item.price;
//   });
//   next();
// });

// /**
//  * Populate product details when querying cart
//  */
// cartSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'items.product',
//     select: 'name partNumber images price discountPrice stock stockStatus',
//   });
//   next();
// });

// const Cart = mongoose.model('Cart', cartSchema);

// export default Cart;

import mongoose from "mongoose";

/**
 * Cart Schema
 * Updated for Abandoned Cart Recovery & Live Monitoring
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // 🔥 NEW: For Guest Checkout (Optional but recommended)
    // లాగిన్ అవ్వని యూజర్స్ కోసం 'guestId' స్టోర్ చేయొచ్చు
    guestId: {
      type: String,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
          default: 1,
        },
        price: {
          // Unit Price at the time of adding
          type: Number,
          required: true,
        },
        // 🔥 NEW: Item level total
        itemTotal: {
          type: Number,
          required: true,
        },
      },
    ],
    totalItems: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    taxPercentage: {
      type: Number,
      default: 18, // 18% GST
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },

    // 🔥 NEW: Coupon Code Support
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    // 🔥 NEW: Abandoned Cart Logic
    // కార్ట్ ఎప్పుడు యాక్టివ్ గా ఉందో తెలిస్తేనే, అది Abandoned ఆ కాదా అని తెలుస్తుంది.
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true, // Searching fast ga avvadaniki
    },
    // రిమైండర్ మెయిల్ పంపామా లేదా?
    isReminderSent: {
      type: Boolean,
      default: false,
    },
    // కార్ట్ స్టేటస్ (Active = యూజర్ వాడుతున్నాడు, Converted = ఆర్డర్ ప్లేస్ చేశాడు, Abandoned = వదిలేశాడు)
    status: {
      type: String,
      enum: ["Active", "Abandoned", "Converted"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

/**
 * 🔥 UPDATED: Calculation Logic
 * అన్ని కాలిక్యులేషన్స్ ఒకే దగ్గర చేయడం మంచిది.
 */
// cartSchema.pre("save", function (next) {
//   // 1. Update timestamp
//   this.lastActiveAt = new Date();

//   // 2. Calculate Item Subtotals
//   this.items.forEach((item) => {
//     item.itemTotal = item.quantity * item.price;
//   });

//   // 3. Calculate Overall Subtotal & Total Items
//   this.totalItems = this.items.reduce(
//     (total, item) => total + item.quantity,
//     0,
//   );
//   this.subtotal = this.items.reduce((total, item) => total + item.itemTotal, 0);

//   // 4. Calculate Tax (GST)
//   this.tax = (this.subtotal * this.taxPercentage) / 100;

//   // 5. Calculate Shipping (Logic: Free above ₹5000)
//   this.shippingCharges = this.subtotal >= 5000 ? 0 : 100;

//   // 6. Calculate Final Total (Subtotal + Tax + Shipping - Discount)
//   const totalBeforeDiscount = this.subtotal + this.tax + this.shippingCharges;
//   this.totalAmount = Math.max(
//     0,
//     totalBeforeDiscount - (this.discountAmount || 0),
//   );

//   next();
// });

/**
 * 🔥 UPDATED: Calculation Logic with Rounding
 * Professional E-commerce Standard (No Decimals in Final Total)
 */
cartSchema.pre("save", function (next) {
  // 1. Update timestamp
  this.lastActiveAt = new Date();

  // 2. Calculate Item Subtotals
  this.items.forEach((item) => {
    // విడిగా ఐటమ్ టోటల్స్ రౌండ్ అవసరం లేదు, కానీ సేఫ్ సైడ్ ఉంచొచ్చు
    item.itemTotal = item.quantity * item.price;
  });

  // 3. Calculate Overall Subtotal & Total Items
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  this.subtotal = this.items.reduce((total, item) => total + item.itemTotal, 0);

  // 4. Calculate Tax (GST)
  // GST లో డెసిమల్స్ ఉంచొచ్చు (Audit కోసం), లేదా రౌండ్ చేయొచ్చు.
  // ఇక్కడ మనం 2 డెసిమల్స్ ఉంచుదాం (కానీ నంబర్ లాగా స్టోర్ అవుతుంది)
  const rawTax = (this.subtotal * this.taxPercentage) / 100;
  this.tax = Number(rawTax.toFixed(2)); // e.g., 161.82

  // 5. Calculate Shipping (Logic: Free above ₹5000)
  this.shippingCharges = this.subtotal >= 5000 ? 0 : 100;

  // 6. Calculate Final Total (Subtotal + Tax + Shipping - Discount)
  const totalBeforeDiscount = this.subtotal + this.tax + this.shippingCharges;
  const finalAmount = totalBeforeDiscount - (this.discountAmount || 0);

  // 🔥 HERO LINE: Math.round() వాడితే పైసలు (.82) పోయి రూపాయికి మారుతుంది.
  this.totalAmount = Math.max(0, Math.round(finalAmount));

  next();
});
/**
 * Populate product details automatically
 */

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: "items.product",
    // ✅ FIX: 'flashSale' ని ఇక్కడ యాడ్ చేయండి
    select:
      "name partNumber images price discountPrice stock stockStatus flashSale",
  });
  next();
});
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
