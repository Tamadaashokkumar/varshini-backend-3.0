// import mongoose from "mongoose";

// /**
//  * Order Schema
//  * Designed for Scalability: Works with free features now, ready for paid APIs later.
//  */
// const orderSchema = new mongoose.Schema(
//   {
//     // --- BASIC ORDER INFO ---
//     orderNumber: {
//       type: String,
//       unique: true,
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     items: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         name: { type: String, required: true },
//         partNumber: { type: String, required: true },
//         quantity: { type: Number, required: true, min: 1 },
//         price: { type: Number, required: true },
//         subtotal: { type: Number, required: true },
//         image: { type: String },

//         // ✅ Free Feature: Item-level Return Status
//         returnStatus: {
//           type: String,
//           enum: ["None", "Requested", "Approved", "Rejected", "Returned"],
//           default: "None",
//         },
//       },
//     ],

//     // --- SHIPPING & LOCATION ---
//     shippingAddress: {
//       street: { type: String, required: true },
//       city: { type: String, required: true }, // ✅ Used for Free City Heatmap
//       state: { type: String, required: true },
//       pincode: { type: String, required: true },
//       phone: { type: String, required: true },

//       // 🔮 Future Paid Feature: Precision Maps (Google/Mapbox)
//       // ఇప్పుడే ఫీల్డ్స్ ఉంచితే, రేపు API ఇంటిగ్రేట్ చేసినప్పుడు DB మార్చక్కర్లేదు.
//       coordinates: {
//         lat: { type: Number, default: null },
//         lng: { type: Number, default: null },
//       },
//       // 🔮 Future: Address Type (Home/Work - useful for delivery logic)
//       type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
//     },

//     // --- FINANCIALS ---
//     subtotal: { type: Number, required: true },
//     tax: { type: Number, required: true },
//     taxPercentage: { type: Number, default: 18 },
//     shippingCharges: { type: Number, required: true },

//     // ✅ Free Feature: Coupon Tracking
//     couponCode: { type: String, default: null },
//     discountAmount: { type: Number, default: 0 },

//     totalAmount: { type: Number, required: true },

//     // --- PAYMENT ---
//     paymentMethod: {
//       type: String,
//       required: true,
//       enum: ["COD", "Razorpay"],
//     },
//     paymentStatus: {
//       type: String,
//       required: true,
//       enum: ["Pending", "Completed", "Failed", "Refunded"],
//       default: "Pending",
//     },
//     paymentDetails: {
//       razorpayOrderId: String,
//       razorpayPaymentId: String,
//       razorpaySignature: String,
//       paidAt: Date,
//     },

//     // --- ORDER STATUS & TRACKING ---
//     orderStatus: {
//       type: String,
//       required: true,
//       enum: [
//         "Placed",
//         "Confirmed",
//         "Packed",
//         "Shipped",
//         "Delivered",
//         "Cancelled",
//         "Returned",
//       ],
//       default: "Placed",
//     },
//     statusHistory: [
//       {
//         status: { type: String, required: true },
//         timestamp: { type: Date, default: Date.now },
//         note: String,
//         // 🔮 Future: Who updated this? (System/Admin/User)
//         updatedBy: { type: String, default: "System" },
//       },
//     ],

//     // --- LOGISTICS (Hybrid: Free Now, Paid Later) ---
//     // ✅ Free: Manual Entry
//     trackingNumber: { type: String },
//     courierPartner: { type: String },

//     // 🔮 Future Paid Feature: Automated Logistics (Shiprocket/Delhivery)
//     logistics: {
//       providerId: { type: String }, // e.g., Shiprocket Order ID
//       shipmentId: { type: String },
//       awbCode: { type: String }, // Air Waybill Number
//       labelUrl: { type: String }, // Shipping Label PDF URL
//       currentStatus: { type: String }, // Live status from API
//     },

//     estimatedDelivery: { type: Date },
//     deliveredAt: { type: Date },
//     cancelledAt: { type: Date },
//     cancellationReason: { type: String },

//     // --- RETURNS & REFUNDS ---
//     // ✅ Free Feature: Linking to ReturnRequest model
//     isReturned: { type: Boolean, default: false },
//     returnRequest: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ReturnRequest",
//     },

//     // 🔮 Future: Automated Refunds
//     refundDetails: {
//       refundId: String, // Payment Gateway Refund ID
//       amount: Number,
//       processedAt: Date,
//     },

//     invoicePath: { type: String },
//     invoiceNumber: { type: String },

//     // 🔮 Future: Customer Communication
//     // SMS/WhatsApp పంపామా లేదా అని ట్రాక్ చేయడానికి
//     notifications: {
//       smsSent: { type: Boolean, default: false },
//       emailSent: { type: Boolean, default: false },
//       whatsappSent: { type: Boolean, default: false },
//     },

//     notes: { type: String }, // Admin internal notes
//   },
//   {
//     timestamps: true,
//   },
// );

// // --- HOOKS ---

// // 1. Generate Order ID
// // orderSchema.pre('save', async function (next) {
// //   if (!this.orderNumber) {
// //     const date = new Date();
// //     const year = date.getFullYear();
// //     const month = String(date.getMonth() + 1).padStart(2, '0');
// //     const day = String(date.getDate()).padStart(2, '0');

// //     const count = await mongoose.model('Order').countDocuments({
// //       createdAt: {
// //         $gte: new Date(date.setHours(0, 0, 0, 0)),
// //         $lt: new Date(date.setHours(23, 59, 59, 999)),
// //       },
// //     });

// //     this.orderNumber = `ORD${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
// //   }
// //   next();
// // });

// // 1. Generate Order ID (Updated for High Concurrency)
// orderSchema.pre("save", async function (next) {
//   if (!this.orderNumber) {
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");

//     // 🔥 CHANGE: Instead of checking DB count (which is slow & risky),
//     // we use Timestamp + Random Number.

//     // 1. Get last 4 digits of current timestamp (Unique per millisecond)
//     const timeComponent = Date.now().toString().slice(-4);

//     // 2. Generate a random 3-digit number (100 to 999)
//     const randomComponent = Math.floor(100 + Math.random() * 900);

//     // Format: ORD-YYYYMMDD-TIME-RAND
//     // Ex: ORD20260203-4821593
//     this.orderNumber = `ORD${year}${month}${day}-${timeComponent}${randomComponent}`;
//   }
//   next();
// });

// // 2. Status History & Dates
// orderSchema.pre("save", function (next) {
//   if (this.isModified("orderStatus")) {
//     this.statusHistory.push({
//       status: this.orderStatus,
//       timestamp: new Date(),
//       note: `Status changed to ${this.orderStatus}`,
//       updatedBy: "System", // Default, can be overridden in controller
//     });

//     if (this.orderStatus === "Delivered" && !this.deliveredAt)
//       this.deliveredAt = new Date();
//     if (this.orderStatus === "Cancelled" && !this.cancelledAt)
//       this.cancelledAt = new Date();
//   }
//   next();
// });

// // --- INDEXES ---
// orderSchema.index({ user: 1, createdAt: -1 });
// orderSchema.index({ orderNumber: 1 });
// orderSchema.index({ "shippingAddress.city": 1 }); // For Heatmaps
// orderSchema.index({ "logistics.awbCode": 1 }); // Future proofing for API lookup

// orderSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "user",
//     select: "name email phone",
//   });
//   next();
// });

// const Order = mongoose.model("Order", orderSchema);
// export default Order;

import mongoose from "mongoose";

/**
 * Order Schema
 * Designed for Scalability: Works with free features now, ready for paid APIs later.
 */
const orderSchema = new mongoose.Schema(
  {
    // --- BASIC ORDER INFO ---
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 CHANGE: Renamed from 'items' to 'orderItems' to match Controller
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Links to Product Model
          required: true,
        },
        name: { type: String, required: true },
        partNumber: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        image: { type: String },

        // ✅ Free Feature: Item-level Return Status
        returnStatus: {
          type: String,
          enum: ["None", "Requested", "Approved", "Rejected", "Returned"],
          default: "None",
        },
      },
    ],

    // --- SHIPPING & LOCATION ---
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true }, // ✅ Used for Free City Heatmap
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },

      // 🔮 Future Paid Feature: Precision Maps (Google/Mapbox)
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
      type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    },

    // --- FINANCIALS ---
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    taxPercentage: { type: Number, default: 18 },
    shippingCharges: { type: Number, required: true },

    // ✅ Free Feature: Coupon Tracking
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },

    totalAmount: { type: Number, required: true },

    // --- PAYMENT ---
    paymentMethod: {
      type: String,
      required: true,
      enum: ["COD", "Razorpay"],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
    },

    // --- ORDER STATUS & TRACKING ---
    orderStatus: {
      type: String,
      required: true,
      enum: [
        "Placed",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Placed",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: String, default: "System" },
      },
    ],

    // --- LOGISTICS ---
    trackingNumber: { type: String },
    courierPartner: { type: String },

    // 🔮 Future Paid Feature: Automated Logistics
    logistics: {
      providerId: { type: String },
      shipmentId: { type: String },
      awbCode: { type: String },
      labelUrl: { type: String },
      currentStatus: { type: String },
    },

    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },

    // --- RETURNS & REFUNDS ---
    isReturned: { type: Boolean, default: false },
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReturnRequest",
    },

    refundDetails: {
      refundId: String,
      amount: Number,
      processedAt: Date,
    },

    invoicePath: { type: String },
    invoiceNumber: { type: String },

    notifications: {
      smsSent: { type: Boolean, default: false },
      emailSent: { type: Boolean, default: false },
      whatsappSent: { type: Boolean, default: false },
    },

    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

// --- HOOKS ---

// 1. Generate Order ID (Updated for High Concurrency)
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Timestamp + Random Number for Uniqueness
    const timeComponent = Date.now().toString().slice(-4);
    const randomComponent = Math.floor(100 + Math.random() * 900);

    // Format: ORD-YYYYMMDD-TIME-RAND
    this.orderNumber = `ORD${year}${month}${day}-${timeComponent}${randomComponent}`;
  }
  next();
});

// 2. Status History & Dates
orderSchema.pre("save", function (next) {
  if (this.isModified("orderStatus")) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: `Status changed to ${this.orderStatus}`,
      updatedBy: "System",
    });

    if (this.orderStatus === "Delivered" && !this.deliveredAt)
      this.deliveredAt = new Date();
    if (this.orderStatus === "Cancelled" && !this.cancelledAt)
      this.cancelledAt = new Date();
  }
  next();
});

// --- INDEXES ---
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ "shippingAddress.city": 1 });
orderSchema.index({ "logistics.awbCode": 1 });

// --- QUERY MIDDLEWARE ---
// Auto-populate user details when finding orders
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email phone",
  });
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
