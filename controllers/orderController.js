// import mongoose from "mongoose"; // Added for Transactions
// import { asyncHandler, AppError } from "../utils/errorHandler.js";
// import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
// import { generateInvoice } from "../utils/invoiceGenerator.js";
// import Order from "../models/Order.js";
// import Cart from "../models/Cart.js";
// import Product from "../models/Product.js";
// import Payment from "../models/Payment.js";
// import { emitToUser, emitToAdmins } from "../sockets/socketHandler.js";
// import { notify } from "./notificationController.js"; // 👈 Import Helper

// /**
//  * @desc    Create Order (With Atomic Transaction)
//  * @route   POST /api/orders
//  * @access  Private (Customer)
//  */
// export const createOrder = asyncHandler(async (req, res) => {
//   const { shippingAddressId, paymentMethod, notes } = req.body;

//   // 1. Basic Validation
//   if (!paymentMethod || !["COD", "Razorpay"].includes(paymentMethod)) {
//     throw new AppError("Invalid payment method", 400);
//   }

//   const user = await req.user.populate("addresses");
//   let shippingAddress;

//   if (shippingAddressId) {
//     shippingAddress = user.addresses.id(shippingAddressId);
//   } else {
//     shippingAddress = user.addresses.find((addr) => addr.isDefault);
//   }

//   if (!shippingAddress) {
//     throw new AppError("Please provide a shipping address", 400);
//   }

//   // ============================================================
//   // START ATOMIC TRANSACTION
//   // ============================================================
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 2. Get Cart inside session
//     const cart = await Cart.findOne({ user: req.user._id })
//       .populate("items.product")
//       .session(session);

//     if (!cart || cart.items.length === 0) {
//       throw new AppError("Cart is empty", 400);
//     }

//     const orderItems = [];

//     // 3. Process Items & Deduct Stock ATOMICALLY
//     for (const item of cart.items) {
//       // Lock the product document to prevent others from editing it
//       const product = await Product.findById(item.product._id).session(session);

//       if (!product || !product.isActive) {
//         throw new AppError(
//           `Product ${item.product.name} is no longer available`,
//           400,
//         );
//       }

//       // Check Stock
//       if (product.stock < item.quantity) {
//         throw new AppError(
//           `Insufficient stock for ${product.name}. Only ${product.stock} available`,
//           400,
//         );
//       }

//       // Deduct Stock immediately inside the transaction
//       product.stock -= item.quantity;
//       product.totalSales += item.quantity;

//       // Save Product with Session
//       await product.save({ session });

//       orderItems.push({
//         product: product._id,
//         name: product.name,
//         partNumber: product.partNumber,
//         quantity: item.quantity,
//         price: item.price,
//         subtotal: item.subtotal,
//         image: product.images[0]?.url,
//       });
//     }

//     // 4. Create Order
//     // Note: When using transactions, create returns an array
//     const order = await Order.create(
//       [
//         {
//           user: req.user._id,
//           items: orderItems,
//           shippingAddress: {
//             street: shippingAddress.street,
//             city: shippingAddress.city,
//             state: shippingAddress.state,
//             pincode: shippingAddress.pincode,
//             phone: req.user.phone,
//           },
//           subtotal: cart.subtotal,
//           tax: cart.tax,
//           taxPercentage: cart.taxPercentage,
//           shippingCharges: cart.shippingCharges,
//           totalAmount: cart.totalAmount,
//           paymentMethod,
//           paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
//           orderStatus: "Placed",
//           notes,
//         },
//       ],
//       { session },
//     );

//     // 5. Create Payment Record
//     await Payment.create(
//       [
//         {
//           order: order[0]._id, // Accessing the first element of the array
//           user: req.user._id,
//           amount: order[0].totalAmount,
//           paymentMethod,
//           paymentStatus: "Pending",
//         },
//       ],
//       { session },
//     );

//     // 6. Clear Cart
//     cart.items = [];
//     cart.subtotal = 0;
//     cart.totalAmount = 0;
//     await cart.save({ session });

//     // COMMIT TRANSACTION (Save everything permanently)
//     await session.commitTransaction();
//     session.endSession();

//     // ============================================================
//     // POST-TRANSACTION ACTIONS (Notifications)
//     // ============================================================

//     // Fetch the full order to populate fields for response/socket
//     const finalOrder = await Order.findById(order[0]._id).populate(
//       "user",
//       "name email phone",
//     );

//     // Emit Real-time Events
//     emitToUser(req.user._id.toString(), "order_placed", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       totalAmount: finalOrder.totalAmount,
//     });

//     emitToAdmins("new_order", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       customerName: req.user.name,
//       totalAmount: finalOrder.totalAmount,
//     });

//     sendSuccess(res, 201, "Order placed successfully", { order: finalOrder });
//   } catch (error) {
//     // ABORT TRANSACTION (Undo everything if anything fails)
//     await session.abortTransaction();
//     session.endSession();
//     throw error; // Pass error to global handler
//   }
// });

// /**
//  * @desc    Get User Orders
//  * @route   GET /api/orders
//  * @access  Private (Customer)
//  */
// export const getUserOrders = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, status } = req.query;

//   const query = { user: req.user._id };

//   if (status) {
//     query.orderStatus = status;
//   }

//   const skip = (Number(page) - 1) * Number(limit);

//   const orders = await Order.find(query)
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(Number(limit));

//   const total = await Order.countDocuments(query);

//   sendPaginatedResponse(res, 200, "Orders retrieved successfully", orders, {
//     total,
//     page: Number(page),
//     limit: Number(limit),
//   });
// });

// /**
//  * @desc    Get Order By ID
//  * @route   GET /api/orders/:id
//  * @access  Private (Customer/Admin)
//  */
// export const getOrderById = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id).populate(
//     "user",
//     "name email phone",
//   );

//   if (!order) {
//     throw new AppError("Order not found", 404);
//   }

//   // Check authorization
//   if (
//     req.userType === "customer" &&
//     order.user._id.toString() !== req.user._id.toString()
//   ) {
//     throw new AppError("Not authorized to access this order", 403);
//   }

//   sendSuccess(res, 200, "Order retrieved successfully", { order });
// });

// /**
//  * @desc    Cancel Order
//  * @route   PUT /api/orders/:id/cancel
//  * @access  Private (Customer)
//  */
// export const cancelOrder = asyncHandler(async (req, res) => {
//   const { cancellationReason } = req.body;

//   const order = await Order.findById(req.params.id);

//   if (!order) {
//     throw new AppError("Order not found", 404);
//   }

//   // Check authorization
//   if (order.user._id.toString() !== req.user._id.toString()) {
//     throw new AppError("Not authorized to cancel this order", 403);
//   }

//   // Check if order can be cancelled
//   if (["Delivered", "Cancelled"].includes(order.orderStatus)) {
//     throw new AppError(
//       `Cannot cancel order with status: ${order.orderStatus}`,
//       400,
//     );
//   }

//   // Update order status
//   order.orderStatus = "Cancelled";
//   order.cancellationReason = cancellationReason;
//   order.cancelledAt = new Date();

//   await order.save();

//   // Restore product stock
//   for (const item of order.items) {
//     const product = await Product.findById(item.product);
//     if (product) {
//       product.stock += item.quantity;
//       product.totalSales -= item.quantity;
//       await product.save();
//     }
//   }

//   // Emit notification to user
//   emitToUser(req.user._id.toString(), "order_cancelled", {
//     orderId: order._id,
//     orderNumber: order.orderNumber,
//   });

//   // Emit notification to admins
//   emitToAdmins("order_cancelled", {
//     orderId: order._id,
//     orderNumber: order.orderNumber,
//     customerName: req.user.name,
//   });

//   sendSuccess(res, 200, "Order cancelled successfully", { order });
// });

// /**
//  * @desc    Get All Orders (Admin)
//  * @route   GET /api/orders/admin/all
//  * @access  Private (Admin)
//  */
// export const getAllOrders = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 20,
//     status,
//     paymentStatus,
//     search,
//     startDate,
//     endDate,
//   } = req.query;

//   const query = {};

//   if (status) {
//     query.orderStatus = status;
//   }

//   if (paymentStatus) {
//     query.paymentStatus = paymentStatus;
//   }

//   if (search) {
//     query.$or = [
//       { orderNumber: { $regex: search, $options: "i" } },
//       { "shippingAddress.phone": { $regex: search, $options: "i" } },
//     ];
//   }

//   if (startDate || endDate) {
//     query.createdAt = {};
//     if (startDate) query.createdAt.$gte = new Date(startDate);
//     if (endDate) query.createdAt.$lte = new Date(endDate);
//   }

//   const skip = (Number(page) - 1) * Number(limit);

//   const orders = await Order.find(query)
//     .populate("user", "name email phone")
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(Number(limit));

//   const total = await Order.countDocuments(query);

//   sendPaginatedResponse(res, 200, "Orders retrieved successfully", orders, {
//     total,
//     page: Number(page),
//     limit: Number(limit),
//   });
// });

// // /**
// //  * @desc    Update Order Status (Admin)
// //  * @route   PUT /api/orders/:id/status
// //  * @access  Private (Admin)
// //  */
// // export const updateOrderStatus = asyncHandler(async (req, res) => {
// //   const { orderStatus, trackingNumber, courierPartner, estimatedDelivery, note } = req.body;

// //   if (!orderStatus) {
// //     throw new AppError('Order status is required', 400);
// //   }

// //   const order = await Order.findById(req.params.id).populate('user', 'name email');

// //   if (!order) {
// //     throw new AppError('Order not found', 404);
// //   }

// //   // Validate status transition
// //   const validStatuses = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
// //   if (!validStatuses.includes(orderStatus)) {
// //     throw new AppError('Invalid order status', 400);
// //   }

// //   // Update order
// //   order.orderStatus = orderStatus;

// //   if (trackingNumber) order.trackingNumber = trackingNumber;
// //   if (courierPartner) order.courierPartner = courierPartner;
// //   if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

// //   if (note) {
// //     // Ensure statusHistory exists before pushing
// //     if (!order.statusHistory) order.statusHistory = [];

// //     // Add note to the latest status change logic could be improved,
// //     // but assuming model handles history push on status change:
// //     // This part depends on your Order Model logic.
// //     // If you have a pre-save hook pushing to history, just saving is enough.
// //   }

// //   await order.save();

// //   // Generate invoice for delivered orders
// //   if (orderStatus === 'Delivered' && !order.invoicePath) {
// //     try {
// //       const invoicePath = await generateInvoice(order);
// //       order.invoicePath = invoicePath;
// //       order.invoiceNumber = `INV-${order.orderNumber}`;
// //       await order.save();
// //     } catch (error) {
// //       console.error('Error generating invoice:', error);
// //     }
// //   }

// //   // Emit real-time notification to user
// //   emitToUser(order.user._id.toString(), 'order_status_updated', {
// //     orderId: order._id,
// //     orderNumber: order.orderNumber,
// //     orderStatus: order.orderStatus,
// //   });

// //   sendSuccess(res, 200, 'Order status updated successfully', { order });
// // });

// /**
//  * @desc    Update Order Status (Admin)
//  * @route   PUT /api/orders/:id/status
//  * @access  Private (Admin)
//  */
// export const updateOrderStatus = asyncHandler(async (req, res) => {
//   const {
//     orderStatus,
//     trackingNumber,
//     courierPartner,
//     estimatedDelivery,
//     note,
//   } = req.body;

//   if (!orderStatus) {
//     throw new AppError("Order status is required", 400);
//   }

//   const order = await Order.findById(req.params.id).populate(
//     "user",
//     "name email",
//   );

//   if (!order) {
//     throw new AppError("Order not found", 404);
//   }

//   // Validate status transition
//   const validStatuses = [
//     "Placed",
//     "Confirmed",
//     "Packed",
//     "Shipped",
//     "Delivered",
//     "Cancelled",
//   ];
//   if (!validStatuses.includes(orderStatus)) {
//     throw new AppError("Invalid order status", 400);
//   }

//   // Update order status
//   order.orderStatus = orderStatus;

//   // ============================================================
//   // ✅ NEW LOGIC: COD Payment Auto-Complete on Delivery
//   // ============================================================
//   if (orderStatus === "Delivered") {
//     order.deliveredAt = new Date(); // డెలివరీ టైమ్ సెట్ చేస్తున్నాం

//     // ఒకవేళ పేమెంట్ మెథడ్ COD అయ్యి ఉంటేనే పేమెంట్ స్టేటస్ మారుస్తాం
//     if (order.paymentMethod === "COD") {
//       order.paymentStatus = "Completed";

//       // ⚠️ CRITICAL: Analytics కోసం Payment Collection ని కూడా అప్‌డేట్ చేయాలి
//       await Payment.findOneAndUpdate(
//         { order: order._id },
//         {
//           paymentStatus: "Completed",
//           paidAt: new Date(),
//         },
//       );
//     }
//   }
//   // ============================================================

//   if (trackingNumber) order.trackingNumber = trackingNumber;
//   if (courierPartner) order.courierPartner = courierPartner;
//   if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

//   // Handle Note (Optional based on your schema)
//   if (note && order.statusHistory) {
//     // Logic to push note to history if your schema supports it
//   }

//   await order.save();

//   // Generate invoice for delivered orders
//   if (orderStatus === "Delivered" && !order.invoicePath) {
//     try {
//       const invoicePath = await generateInvoice(order);
//       order.invoicePath = invoicePath;
//       order.invoiceNumber = `INV-${order.orderNumber}`;
//       await order.save();
//     } catch (error) {
//       console.error("Error generating invoice:", error);
//     }
//   }

//   // Emit real-time notification to user
//   if (order.user) {
//     emitToUser(order.user._id.toString(), "order_status_updated", {
//       orderId: order._id,
//       orderNumber: order.orderNumber,
//       orderStatus: order.orderStatus,
//     });
//   }

//   sendSuccess(res, 200, "Order status updated successfully", { order });
// });

// /**
//  * @desc    Download Invoice
//  * @route   GET /api/orders/:id/invoice
//  * @access  Private (Customer/Admin)
//  */
// export const downloadInvoice = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id).populate(
//     "user",
//     "name email phone",
//   );

//   if (!order) {
//     throw new AppError("Order not found", 404);
//   }

//   // Check authorization
//   if (
//     req.userType === "customer" &&
//     order.user._id.toString() !== req.user._id.toString()
//   ) {
//     throw new AppError("Not authorized to access this invoice", 403);
//   }

//   // Generate invoice if not exists
//   if (!order.invoicePath) {
//     const invoicePath = await generateInvoice(order);
//     order.invoicePath = invoicePath;
//     order.invoiceNumber = `INV-${order.orderNumber}`;
//     await order.save();
//   }

//   // Send file
//   res.download(order.invoicePath, `${order.invoiceNumber}.pdf`, (err) => {
//     if (err) {
//       throw new AppError("Error downloading invoice", 500);
//     }
//   });
// });

// import mongoose from "mongoose";
// import crypto from "crypto"; // Required for Razorpay verification
// import { asyncHandler, AppError } from "../utils/errorHandler.js";
// import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
// import { generateInvoice } from "../utils/invoiceGenerator.js";
// import Order from "../models/Order.js";
// import Cart from "../models/Cart.js";
// import Product from "../models/Product.js";
// import Payment from "../models/Payment.js";
// import { emitToUser, emitToAdmins } from "../sockets/socketHandler.js";

// /**
//  * @desc    Create Order (Atomic Transaction)
//  * @route   POST /api/orders
//  * @access  Private (Customer)
//  */
// export const createOrder = asyncHandler(async (req, res) => {
//   const { shippingAddressId, paymentMethod, notes } = req.body;

//   // 1. Basic Validation
//   if (!paymentMethod || !["COD", "Razorpay"].includes(paymentMethod)) {
//     throw new AppError("Invalid payment method", 400);
//   }

//   const user = await req.user.populate("addresses");
//   let shippingAddress;

//   if (shippingAddressId) {
//     shippingAddress = user.addresses.id(shippingAddressId);
//   } else {
//     shippingAddress = user.addresses.find((addr) => addr.isDefault);
//   }

//   if (!shippingAddress) {
//     throw new AppError("Please provide a shipping address", 400);
//   }

//   // START TRANSACTION
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 2. Get Cart
//     const cart = await Cart.findOne({ user: req.user._id })
//       .populate("items.product")
//       .session(session);

//     if (!cart || cart.items.length === 0) {
//       throw new AppError("Cart is empty", 400);
//     }

//     const orderItems = [];

//     // 3. Process Items & Deduct Stock
//     for (const item of cart.items) {
//       const product = await Product.findById(item.product._id).session(session);

//       if (!product || !product.isActive) {
//         throw new AppError(`Product ${item.product.name} is unavailable`, 400);
//       }

//       if (product.stock < item.quantity) {
//         throw new AppError(`Insufficient stock for ${product.name}`, 400);
//       }

//       // Deduct Stock
//       product.stock -= item.quantity;
//       product.totalSales += item.quantity;
//       await product.save({ session });

//       orderItems.push({
//         product: product._id,
//         name: product.name,
//         partNumber: product.partNumber,
//         quantity: item.quantity,
//         price: item.price,
//         subtotal: item.subtotal,
//         image: product.images[0]?.url,
//         returnStatus: 'None' // Default status
//       });
//     }

//     // 4. Create Order
//     // ✅ FIX: Added Coupon Data Mapping from Cart to Order
//     const order = await Order.create(
//       [{
//         user: req.user._id,
//         items: orderItems,
//         shippingAddress: {
//           street: shippingAddress.street,
//           city: shippingAddress.city,
//           state: shippingAddress.state,
//           pincode: shippingAddress.pincode,
//           phone: req.user.phone,
//         },
//         subtotal: cart.subtotal,
//         tax: cart.tax,
//         taxPercentage: cart.taxPercentage,
//         shippingCharges: cart.shippingCharges,
//         couponCode: cart.couponCode || null,       // Copied from Cart
//         discountAmount: cart.discountAmount || 0,  // Copied from Cart
//         totalAmount: cart.totalAmount,
//         paymentMethod,
//         paymentStatus: "Pending", // Always Pending initially
//         orderStatus: "Placed",
//         notes,
//       }],
//       { session }
//     );

//     // 5. Create Payment Record
//     await Payment.create(
//       [{
//         order: order[0]._id,
//         user: req.user._id,
//         amount: order[0].totalAmount,
//         paymentMethod,
//         paymentStatus: "Pending",
//       }],
//       { session }
//     );

//     // 6. Clear Cart
//     cart.items = [];
//     cart.subtotal = 0;
//     cart.totalAmount = 0;
//     cart.couponCode = null;
//     cart.discountAmount = 0;
//     await cart.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // --- Notifications ---
//     const finalOrder = await Order.findById(order[0]._id).populate("user", "name email phone");

//     emitToUser(req.user._id.toString(), "order_placed", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       totalAmount: finalOrder.totalAmount,
//     });

//     emitToAdmins("new_order", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       customerName: req.user.name,
//       totalAmount: finalOrder.totalAmount,
//     });

//     sendSuccess(res, 201, "Order placed successfully", { order: finalOrder });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// });

// /**
//  * @desc    Verify Razorpay Payment (✨ NEW FEATURE)
//  * @route   POST /api/orders/verify-payment
//  * @access  Private
//  */
// export const verifyPayment = asyncHandler(async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

//   const generated_signature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(razorpay_order_id + "|" + razorpay_payment_id)
//     .digest("hex");

//   if (generated_signature !== razorpay_signature) {
//     throw new AppError("Payment verification failed", 400);
//   }

//   // Update Order and Payment
//   const order = await Order.findById(orderId);
//   if (!order) throw new AppError("Order not found", 404);

//   order.paymentStatus = "Completed";
//   order.paymentDetails = {
//     razorpayOrderId: razorpay_order_id,
//     razorpayPaymentId: razorpay_payment_id,
//     razorpaySignature: razorpay_signature,
//     paidAt: new Date(),
//   };
//   await order.save();

//   // Update Payment Record
//   await Payment.findOneAndUpdate(
//     { order: order._id },
//     {
//       paymentStatus: "Completed",
//       transactionId: razorpay_payment_id,
//       paidAt: new Date()
//     }
//   );

//   sendSuccess(res, 200, "Payment verified successfully");
// });

// /**
//  * @desc    Request Return for Item (✨ NEW FEATURE)
//  * @route   PUT /api/orders/:id/return/:itemId
//  * @access  Private (Customer)
//  */
// export const requestReturn = asyncHandler(async (req, res) => {
//   const { id, itemId } = req.params;
//   const { reason } = req.body;

//   const order = await Order.findOne({ _id: id, user: req.user._id });
//   if (!order) throw new AppError("Order not found", 404);

//   if (order.orderStatus !== "Delivered") {
//     throw new AppError("Cannot return items from undelivered orders", 400);
//   }

//   // Find item
//   const item = order.items.id(itemId);
//   if (!item) throw new AppError("Item not found in order", 404);

//   if (item.returnStatus !== "None") {
//     throw new AppError("Return already requested or processed for this item", 400);
//   }

//   // Update Item Status
//   item.returnStatus = "Requested";

//   // Push to history
//   order.statusHistory.push({
//     status: order.orderStatus, // Order status remains Delivered, but internal item status changes
//     timestamp: new Date(),
//     note: `Return requested for ${item.name}. Reason: ${reason}`,
//     updatedBy: "Customer"
//   });

//   await order.save();

//   emitToAdmins("return_requested", {
//     orderNumber: order.orderNumber,
//     itemName: item.name,
//     reason
//   });

//   sendSuccess(res, 200, "Return request submitted successfully");
// });

// /**
//  * @desc    Update Order Status (Admin)
//  * @route   PUT /api/orders/:id/status
//  * @access  Private (Admin)
//  */
// export const updateOrderStatus = asyncHandler(async (req, res) => {
//   const {
//     orderStatus,
//     trackingNumber,
//     courierPartner,
//     estimatedDelivery,
//     note,
//   } = req.body;

//   if (!orderStatus) {
//     throw new AppError("Order status is required", 400);
//   }

//   const order = await Order.findById(req.params.id).populate("user", "name email");
//   if (!order) throw new AppError("Order not found", 404);

//   const validStatuses = ["Placed", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];
//   if (!validStatuses.includes(orderStatus)) {
//     throw new AppError("Invalid order status", 400);
//   }

//   // Auto-complete payment for COD on Delivery
//   if (orderStatus === "Delivered") {
//     order.deliveredAt = new Date();
//     if (order.paymentMethod === "COD") {
//       order.paymentStatus = "Completed";
//       await Payment.findOneAndUpdate(
//         { order: order._id },
//         { paymentStatus: "Completed", paidAt: new Date() }
//       );
//     }
//   }

//   // Logistics Update
//   if (trackingNumber) order.trackingNumber = trackingNumber;
//   if (courierPartner) order.courierPartner = courierPartner;
//   if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

//   // Change Status
//   order.orderStatus = orderStatus;

//   // ✅ FIX: Explicitly handle Admin Notes in Status History
//   // The pre-save hook adds a generic message. Here we append the specific admin note.
//   if (note) {
//     order.statusHistory.push({
//       status: orderStatus,
//       timestamp: new Date(),
//       note: note, // Custom Admin Note
//       updatedBy: "Admin"
//     });
//   }

//   await order.save(); // Pre-save hook runs here

//   // Invoice Generation
//   if (orderStatus === "Delivered" && !order.invoicePath) {
//     try {
//       const invoicePath = await generateInvoice(order);
//       order.invoicePath = invoicePath;
//       order.invoiceNumber = `INV-${order.orderNumber}`;
//       await order.save();
//     } catch (error) {
//       console.error("Error generating invoice:", error);
//     }
//   }

//   // Notify User
//   if (order.user) {
//     emitToUser(order.user._id.toString(), "order_status_updated", {
//       orderId: order._id,
//       orderNumber: order.orderNumber,
//       orderStatus: order.orderStatus,
//     });
//   }

//   sendSuccess(res, 200, "Order status updated successfully", { order });
// });

// /**
//  * @desc    Get User Orders
//  * @route   GET /api/orders
//  * @access  Private (Customer)
//  */
// export const getUserOrders = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, status } = req.query;
//   const query = { user: req.user._id };

//   if (status) query.orderStatus = status;

//   const skip = (Number(page) - 1) * Number(limit);

//   const orders = await Order.find(query)
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(Number(limit));

//   const total = await Order.countDocuments(query);

//   sendPaginatedResponse(res, 200, "Orders retrieved", orders, {
//     total, page: Number(page), limit: Number(limit)
//   });
// });

// /**
//  * @desc    Get Order By ID
//  * @route   GET /api/orders/:id
//  * @access  Private
//  */
// export const getOrderById = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id).populate("user", "name email phone");
//   if (!order) throw new AppError("Order not found", 404);

//   // Authorization Check
//   if (req.userType === "customer" && order.user._id.toString() !== req.user._id.toString()) {
//     throw new AppError("Not authorized", 403);
//   }

//   sendSuccess(res, 200, "Order details", { order });
// });

// /**
//  * @desc    Cancel Order
//  * @route   PUT /api/orders/:id/cancel
//  * @access  Private (Customer)
//  */
// export const cancelOrder = asyncHandler(async (req, res) => {
//   const { cancellationReason } = req.body;
//   const order = await Order.findById(req.params.id);

//   if (!order) throw new AppError("Order not found", 404);
//   if (order.user._id.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

//   if (["Delivered", "Cancelled", "Shipped"].includes(order.orderStatus)) {
//     throw new AppError(`Cannot cancel order at this stage (${order.orderStatus})`, 400);
//   }

//   order.orderStatus = "Cancelled";
//   order.cancellationReason = cancellationReason;
//   order.cancelledAt = new Date();
//   await order.save();

//   // Restore Stock
//   for (const item of order.items) {
//     await Product.findByIdAndUpdate(item.product, {
//       $inc: { stock: item.quantity, totalSales: -item.quantity }
//     });
//   }

//   // TODO: Initiate Refund if Payment was Online (Razorpay)
//   if (order.paymentMethod === 'Razorpay' && order.paymentStatus === 'Completed') {
//      // Trigger refund logic here or mark as "Refund Pending"
//      // order.paymentStatus = 'Refund Pending';
//      // await order.save();
//   }

//   emitToAdmins("order_cancelled", {
//     orderNumber: order.orderNumber,
//     reason: cancellationReason
//   });

//   sendSuccess(res, 200, "Order cancelled successfully", { order });
// });

// /**
//  * @desc    Get All Orders (Admin)
//  * @route   GET /api/orders/admin/all
//  * @access  Private (Admin)
//  */
// export const getAllOrders = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 20, status, paymentStatus, search, startDate, endDate } = req.query;
//   const query = {};

//   if (status) query.orderStatus = status;
//   if (paymentStatus) query.paymentStatus = paymentStatus;

//   if (search) {
//     query.$or = [
//       { orderNumber: { $regex: search, $options: "i" } },
//       { "shippingAddress.phone": { $regex: search, $options: "i" } },
//     ];
//   }

//   if (startDate || endDate) {
//     query.createdAt = {};
//     if (startDate) query.createdAt.$gte = new Date(startDate);
//     if (endDate) query.createdAt.$lte = new Date(endDate);
//   }

//   const skip = (Number(page) - 1) * Number(limit);
//   const orders = await Order.find(query)
//     .populate("user", "name email phone")
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(Number(limit));

//   const total = await Order.countDocuments(query);

//   sendPaginatedResponse(res, 200, "Orders retrieved", orders, {
//     total, page: Number(page), limit: Number(limit)
//   });
// });

// /**
//  * @desc    Download Invoice
//  * @route   GET /api/orders/:id/invoice
//  * @access  Private
//  */
// export const downloadInvoice = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id);
//   if (!order) throw new AppError("Order not found", 404);

//   if (req.userType === "customer" && order.user.toString() !== req.user._id.toString()) {
//     throw new AppError("Not authorized", 403);
//   }

//   if (!order.invoicePath) {
//     const invoicePath = await generateInvoice(order);
//     order.invoicePath = invoicePath;
//     order.invoiceNumber = `INV-${order.orderNumber}`;
//     await order.save();
//   }

//   res.download(order.invoicePath, `${order.invoiceNumber}.pdf`);
// });

import mongoose from "mongoose";
import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
import { generateInvoice } from "../utils/invoiceGenerator.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Payment from "../models/Payment.js";
import { emitToUser, emitToAdmins } from "../sockets/socketHandler.js";
import fs from "fs";

// /**
//  * @desc    Create Order (Atomic Transaction)
//  * @route   POST /api/orders
//  * @access  Private (Customer)
//  */
// export const createOrder = asyncHandler(async (req, res) => {
//   const { shippingAddressId, paymentMethod, notes } = req.body;

//   // 1. Basic Validation
//   if (!paymentMethod || !["COD", "Razorpay"].includes(paymentMethod)) {
//     throw new AppError("Invalid payment method", 400);
//   }

//   const user = await req.user.populate("addresses");
//   let shippingAddress;

//   if (shippingAddressId) {
//     shippingAddress = user.addresses.id(shippingAddressId);
//   } else {
//     shippingAddress = user.addresses.find((addr) => addr.isDefault);
//   }

//   if (!shippingAddress) {
//     throw new AppError("Please provide a shipping address", 400);
//   }

//   // START TRANSACTION
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 2. Get Cart
//     const cart = await Cart.findOne({ user: req.user._id })
//       .populate("items.product")
//       .session(session);

//     if (!cart || cart.items.length === 0) {
//       throw new AppError("Cart is empty", 400);
//     }

//     const orderItems = [];

//     // 3. Process Items & Deduct Stock
//     for (const item of cart.items) {

//     // 🛑 CRITICAL FIX START: Handle Deleted Products (Ghost Items) 🛑
//       // ఒకవేళ ప్రొడక్ట్ డిలీట్ అయ్యి ఉంటే item.product 'null' అవుతుంది.
//       // అప్పుడు మనం యూజర్ కి ఎర్రర్ చూపించి, కార్ట్ క్లియర్ చేసుకోమని చెప్పాలి.
//       if (!item.product) {
//         // Abort Transaction
//         await session.abortTransaction();
//         session.endSession();

//         // Remove the invalid item from cart immediately (Optional but good UX)
//         await Cart.updateOne(
//           { user: req.user._id },
//           { $pull: { items: { _id: item._id } } }
//         );

//         throw new AppError(
//           "One or more items in your cart are no longer available (Product Removed). Please refresh your cart.",
//           400
//         );
//       }
//       // 🛑 CRITICAL FIX END 🛑

//       const product = await Product.findById(item.product._id).session(session);

//       if (!product || !product.isActive) {
//         throw new AppError(`Product ${item.product.name} is unavailable`, 400);
//       }

//       if (product.stock < item.quantity) {
//         throw new AppError(`Insufficient stock for ${product.name}`, 400);
//       }

//       // Deduct Stock
//       product.stock -= item.quantity;
//       product.totalSales += item.quantity;
//       await product.save({ session });

//       const calculatedSubtotal = item.quantity * item.price;

//       orderItems.push({
//         product: product._id,
//         name: product.name,
//         partNumber: product.partNumber,
//         quantity: item.quantity,
//         price: item.price,
//         subtotal: calculatedSubtotal,
//         image: product.images[0]?.url,
//         returnStatus: 'None'
//       });
//     }

//     // 4. Create Order
//     const order = await Order.create(
//       [{
//         user: req.user._id,
//         items: orderItems,
//         shippingAddress: {
//           street: shippingAddress.street,
//           city: shippingAddress.city,
//           state: shippingAddress.state,
//           pincode: shippingAddress.pincode,
//           phone: req.user.phone,
//         },
//         subtotal: cart.subtotal,
//         tax: cart.tax,
//         taxPercentage: cart.taxPercentage,
//         shippingCharges: cart.shippingCharges,
//         couponCode: cart.couponCode || null,
//         discountAmount: cart.discountAmount || 0,
//         totalAmount: cart.totalAmount,
//         paymentMethod,
//         paymentStatus: "Pending",
//         orderStatus: "Placed",
//         notes,
//       }],
//       { session }
//     );

//     // 5. Create Payment Record
//     await Payment.create(
//       [{
//         order: order[0]._id,
//         user: req.user._id,
//         amount: order[0].totalAmount,
//         paymentMethod,
//         paymentStatus: "Pending",
//       }],
//       { session }
//     );

//     // 6. Clear Cart
//     cart.items = [];
//     cart.subtotal = 0;
//     cart.totalAmount = 0;
//     cart.couponCode = null;
//     cart.discountAmount = 0;
//     await cart.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // --- Notifications ---
//     const finalOrder = await Order.findById(order[0]._id).populate("user", "name email phone");

//     emitToUser(req.user._id.toString(), "order_placed", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       totalAmount: finalOrder.totalAmount,
//     });

//     emitToAdmins("new_order", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       customerName: req.user.name,
//       totalAmount: finalOrder.totalAmount,
//     });

//     sendSuccess(res, 201, "Order placed successfully", { order: finalOrder });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// });

// /**
//  * @desc    Re-order previous items (Fixed & Crash Proof)
//  * @route   POST /api/orders/:id/reorder
//  * @access  Private (Customer)
//  */
// export const reorderItems = asyncHandler(async (req, res) => {
//   const oldOrder = await Order.findById(req.params.id);

//   if (!oldOrder) {
//     throw new AppError("Order not found", 404);
//   }

//   // Authorization Check
//   if (oldOrder.user.toString() !== req.user._id.toString()) {
//     throw new AppError("Not authorized to reorder this", 403);
//   }

//   // Get or Create Cart
//   let cart = await Cart.findOne({ user: req.user._id });
//   if (!cart) {
//     cart = await Cart.create({ user: req.user._id, items: [] });
//   }

//   // 🧹 CLEANUP: Filter out invalid items from CURRENT cart first
//   // ఒకవేళ కార్ట్ లో పాత చెత్త డేటా (Ghost Items) ఉంటే క్లీన్ చేస్తుంది
//   if (cart.items && cart.items.length > 0) {
//     cart.items = cart.items.filter(item => item.product);
//   }

//   let itemsAdded = 0;

//   // Loop through old items
//   for (const item of oldOrder.items) {

//     // 🛡️ SAFETY CHECK 1: Skip if old item holds no product ID
//     if (!item.product) continue;

//     const product = await Product.findById(item.product);

//     // 🛡️ SAFETY CHECK 2: Skip if product is deleted, inactive, or out of stock
//     if (!product || !product.isActive || product.stock <= 0) {
//       continue;
//     }

//     // --- Add to Cart Logic ---

//     // Calculate safe quantity to add (don't exceed stock)
//     let quantityToAdd = item.quantity;
//     if (quantityToAdd > product.stock) {
//       quantityToAdd = product.stock;
//     }

//     // Check if item already exists in cart
//     const existingItemIndex = cart.items.findIndex(
//       (ci) => ci.product.toString() === product._id.toString() // ✅ Safe comparison
//     );

//     if (existingItemIndex > -1) {
//       // Update existing item
//       const currentQty = cart.items[existingItemIndex].quantity;
//       const newQty = currentQty + quantityToAdd;

//       if (newQty <= product.stock) {
//         cart.items[existingItemIndex].quantity = newQty;
//         cart.items[existingItemIndex].subtotal = newQty * product.price;
//         itemsAdded++;
//       } else {
//         // Cap at max stock
//         cart.items[existingItemIndex].quantity = product.stock;
//         cart.items[existingItemIndex].subtotal = product.stock * product.price;
//       }
//     } else {
//       // Add new item
//       cart.items.push({
//         product: product._id,
//         quantity: quantityToAdd,
//         price: product.price, // Always use CURRENT price
//         subtotal: quantityToAdd * product.price, // ✅ Explicitly set subtotal
//         image: product.images[0]?.url
//       });
//       itemsAdded++;
//     }
//   }

//   if (itemsAdded === 0) {
//     throw new AppError("None of the items from this order are currently available.", 400);
//   }

//   // Final Calculations (Total Amount)
//   // Simple sum logic (You can rely on pre-save hook if you have one)
//   cart.totalAmount = cart.items.reduce((acc, item) => acc + (item.subtotal || 0), 0);

//   await cart.save();

//   sendSuccess(res, 200, "Items added to cart successfully");
// });

/**
 * @desc    Create Order (Atomic Transaction) - FIXED & CRASH PROOF
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
// export const createOrder = asyncHandler(async (req, res) => {
//   const { shippingAddressId, paymentMethod, notes } = req.body;

//   if (!paymentMethod || !["COD", "Razorpay"].includes(paymentMethod)) {
//     throw new AppError("Invalid payment method", 400);
//   }

//   const user = await req.user.populate("addresses");
//   let shippingAddress;

//   if (shippingAddressId) {
//     shippingAddress = user.addresses.id(shippingAddressId);
//   } else {
//     shippingAddress = user.addresses.find((addr) => addr.isDefault);
//   }

//   if (!shippingAddress) {
//     throw new AppError("Please provide a shipping address", 400);
//   }

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const cart = await Cart.findOne({ user: req.user._id })
//       .populate("items.product")
//       .session(session);

//     if (!cart || cart.items.length === 0) {
//       throw new AppError("Cart is empty", 400);
//     }

//     const orderItems = [];

//     // 🛑 SAFETY LOOP START 🛑
//     for (const item of cart.items) {
//       // 1. Check if product exists (Handling Deleted Products)
//       if (!item.product) {
//         await session.abortTransaction();
//         session.endSession();
//         // Automatically remove invalid items from cart to fix the issue for the user
//         await Cart.updateOne(
//           { user: req.user._id },
//           { $pull: { items: { _id: item._id } } },
//         );
//         throw new AppError(
//           "Some items in your cart are no longer available. We have updated your cart, please try again.",
//           400,
//         );
//       }

//       // 2. Safe ID Access
//       const product = await Product.findById(item.product._id).session(session);

//       if (!product || !product.isActive) {
//         throw new AppError(
//           `Product '${item.product.name}' is unavailable`,
//           400,
//         );
//       }

//       if (product.stock < item.quantity) {
//         throw new AppError(`Insufficient stock for '${product.name}'`, 400);
//       }

//       // Deduct Stock
//       product.stock -= item.quantity;
//       product.totalSales += item.quantity;
//       await product.save({ session });

//       // Calculate Subtotal Safely
//       const calculatedSubtotal = item.quantity * item.price;

//       orderItems.push({
//         product: product._id,
//         name: product.name,
//         partNumber: product.partNumber,
//         quantity: item.quantity,
//         price: item.price,
//         subtotal: calculatedSubtotal,
//         image: product.images[0]?.url,
//         returnStatus: "None",
//       });
//     }
//     // 🛑 SAFETY LOOP END 🛑

//     const order = await Order.create(
//       [
//         {
//           user: req.user._id,
//           items: orderItems,
//           shippingAddress: {
//             street: shippingAddress.street,
//             city: shippingAddress.city,
//             state: shippingAddress.state,
//             pincode: shippingAddress.pincode,
//             phone: req.user.phone,
//           },
//           subtotal: cart.subtotal,
//           tax: cart.tax,
//           taxPercentage: cart.taxPercentage,
//           shippingCharges: cart.shippingCharges,
//           couponCode: cart.couponCode || null,
//           discountAmount: cart.discountAmount || 0,
//           totalAmount: cart.totalAmount,
//           paymentMethod,
//           paymentStatus: "Pending",
//           orderStatus: "Placed",
//           notes,
//         },
//       ],
//       { session },
//     );

//     await Payment.create(
//       [
//         {
//           order: order[0]._id,
//           user: req.user._id,
//           amount: order[0].totalAmount,
//           paymentMethod,
//           paymentStatus: "Pending",
//         },
//       ],
//       { session },
//     );

//     cart.items = [];
//     cart.subtotal = 0;
//     cart.totalAmount = 0;
//     cart.couponCode = null;
//     cart.discountAmount = 0;
//     await cart.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     const finalOrder = await Order.findById(order[0]._id).populate(
//       "user",
//       "name email phone",
//     );

//     emitToUser(req.user._id.toString(), "order_placed", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       totalAmount: finalOrder.totalAmount,
//     });

//     emitToAdmins("new_order", {
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       customerName: req.user.name,
//       totalAmount: finalOrder.totalAmount,
//     });

//     sendSuccess(res, 201, "Order placed successfully", { order: finalOrder });
//   } catch (error) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     session.endSession();
//     throw error;
//   }
// });
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddressId, paymentMethod, notes } = req.body;

  // 1. Basic Validation
  if (!paymentMethod || !["COD", "Razorpay"].includes(paymentMethod)) {
    throw new AppError("Invalid payment method", 400);
  }

  const user = await req.user.populate("addresses");
  let shippingAddress;

  if (shippingAddressId) {
    shippingAddress = user.addresses.id(shippingAddressId);
  } else {
    shippingAddress = user.addresses.find((addr) => addr.isDefault);
  }

  if (!shippingAddress) {
    throw new AppError("Please provide a shipping address", 400);
  }

  // START TRANSACTION
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Get Cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const orderItems = [];
    let calculatedTotalAmount = 0; // To re-verify total

    // 3. Process Items & Deduct Stock
    for (const item of cart.items) {
      // 🛑 Handle Deleted Products (Ghost Items)
      if (!item.product) {
        await session.abortTransaction();
        session.endSession();

        // Remove invalid item
        await Cart.updateOne(
          { user: req.user._id },
          { $pull: { items: { _id: item._id } } },
        );

        throw new AppError(
          "Some items in your cart are no longer available. Please try again.",
          400,
        );
      }

      // Fetch Live Product Data
      const product = await Product.findById(item.product._id).session(session);

      if (!product || !product.isActive) {
        throw new AppError(
          `Product '${item.product.name}' is unavailable`,
          400,
        );
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for '${product.name}'`, 400);
      }

      // 🔥 CRITICAL UPDATE: Live Price & Flash Sale Check
      // డెసిషన్: కార్ట్ ప్రైస్ నమ్మకూడదు. లైవ్ ప్రైస్ కాలిక్యులేట్ చేయాలి.
      let finalPrice = product.discountPrice || product.price;

      if (product.flashSale?.isActive && product.flashSale?.salePrice > 0) {
        const now = new Date();
        const startTime = new Date(product.flashSale.startTime);
        const endTime = new Date(product.flashSale.endTime);

        // టైమ్ చెక్ చేశాకే ఆఫర్ ప్రైస్ ఇస్తాం
        if (now >= startTime && now <= endTime) {
          finalPrice = product.flashSale.salePrice;
        }
      }

      // Deduct Stock
      product.stock -= item.quantity;
      product.totalSales += item.quantity;
      await product.save({ session });

      // Calculate Item Subtotal (With Rounding)
      const itemSubtotal = Math.round(item.quantity * finalPrice * 100) / 100;
      calculatedTotalAmount += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        partNumber: product.partNumber,
        quantity: item.quantity,
        price: finalPrice, // ✅ Storing Verified Live Price
        subtotal: itemSubtotal,
        image: product.images[0]?.url,
        returnStatus: "None",
      });
    }

    // 4. Calculate Final Financials
    // (Note: Using cart tax/shipping logic, but applying to Verified Subtotal)
    const taxAmount = Math.round(
      (calculatedTotalAmount * cart.taxPercentage) / 100,
    );
    const shippingAmount = calculatedTotalAmount >= 5000 ? 0 : 100;
    const discountAmount = cart.discountAmount || 0;

    const finalTotal = Math.max(
      0,
      Math.round(
        calculatedTotalAmount + taxAmount + shippingAmount - discountAmount,
      ),
    );

    // 5. Create Order
    const order = await Order.create(
      [
        {
          user: req.user._id,
          items: orderItems,
          shippingAddress: {
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
            phone: req.user.phone,
          },
          subtotal: calculatedTotalAmount, // Verified Subtotal
          tax: taxAmount,
          taxPercentage: cart.taxPercentage,
          shippingCharges: shippingAmount,
          couponCode: cart.couponCode || null,
          discountAmount: discountAmount,
          totalAmount: finalTotal, // Verified Total
          paymentMethod,
          paymentStatus: "Pending",
          orderStatus: "Placed",
          notes,
        },
      ],
      { session },
    );

    // 6. Create Payment Record
    await Payment.create(
      [
        {
          order: order[0]._id,
          user: req.user._id,
          amount: order[0].totalAmount,
          paymentMethod,
          paymentStatus: "Pending",
        },
      ],
      { session },
    );

    // 7. Clear Cart
    cart.items = [];
    cart.subtotal = 0;
    cart.totalAmount = 0;
    cart.couponCode = null;
    cart.discountAmount = 0;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    // --- Notifications ---
    const finalOrder = await Order.findById(order[0]._id).populate(
      "user",
      "name email phone",
    );

    emitToUser(req.user._id.toString(), "order_placed", {
      orderId: finalOrder._id,
      orderNumber: finalOrder.orderNumber,
      totalAmount: finalOrder.totalAmount,
    });

    emitToAdmins("new_order", {
      orderId: finalOrder._id,
      orderNumber: finalOrder.orderNumber,
      customerName: req.user.name,
      totalAmount: finalOrder.totalAmount,
    });

    sendSuccess(res, 201, "Order placed successfully", { order: finalOrder });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
});
/**
 * @desc    Re-order previous items (Fixed & Crash Proof)
 * @route   POST /api/orders/:id/reorder
 * @access  Private (Customer)
 */
// export const reorderItems = asyncHandler(async (req, res) => {
//   const oldOrder = await Order.findById(req.params.id);

//   if (!oldOrder) {
//     throw new AppError("Order not found", 404);
//   }

//   if (oldOrder.user.toString() !== req.user._id.toString()) {
//     throw new AppError("Not authorized to reorder this", 403);
//   }

//   let cart = await Cart.findOne({ user: req.user._id });
//   if (!cart) {
//     cart = await Cart.create({ user: req.user._id, items: [] });
//   }

//   let itemsAdded = 0;

//   for (const item of oldOrder.items) {
//     // 🛡️ SAFETY CHECK: Skip if product was deleted from DB
//     if (!item.product) continue;

//     const product = await Product.findById(item.product);

//     // Check if product exists and is active
//     if (product && product.isActive && product.stock > 0) {
//       let quantityToAdd = item.quantity;
//       if (quantityToAdd > product.stock) {
//         quantityToAdd = product.stock;
//       }

//       // Safe Find Index
//       const existingItemIndex = cart.items.findIndex(
//         (ci) => ci.product && ci.product.toString() === product._id.toString(),
//       );

//       if (existingItemIndex > -1) {
//         const currentQty = cart.items[existingItemIndex].quantity;
//         const newQty = currentQty + quantityToAdd;

//         if (newQty <= product.stock) {
//           cart.items[existingItemIndex].quantity = newQty;
//           cart.items[existingItemIndex].subtotal = newQty * product.price;
//           itemsAdded++;
//         } else {
//           cart.items[existingItemIndex].quantity = product.stock;
//           cart.items[existingItemIndex].subtotal =
//             product.stock * product.price;
//         }
//       } else {
//         cart.items.push({
//           product: product._id,
//           quantity: quantityToAdd,
//           price: product.price,
//           subtotal: quantityToAdd * product.price,
//           image: product.images[0]?.url,
//         });
//         itemsAdded++;
//       }
//     }
//   }

//   if (itemsAdded === 0) {
//     throw new AppError("None of the items from this order are available.", 400);
//   }

//   // Recalculate Total
//   cart.items = cart.items.filter((item) => item.product); // Extra cleanup
//   cart.itemTotal = cart.items.reduce(
//     (acc, item) => acc + (item.subtotal || 0),
//     0,
//   );

//   await cart.save();

//   sendSuccess(res, 200, "Items added to cart successfully");
// });

export const reorderItems = asyncHandler(async (req, res) => {
  // 1. Fetch Old Order
  const oldOrder = await Order.findById(req.params.id);

  if (!oldOrder) {
    throw new AppError("Order not found", 404);
  }

  // ఆర్డర్ లో ఉన్న యూజర్ ఎవరు?
  let orderOwnerId = oldOrder.user;
  // ఒకవేళ oldOrder.user ఆబ్జెక్ట్ అయితే (populated), దాని _id తీసుకో
  if (oldOrder.user && oldOrder.user._id) {
    orderOwnerId = oldOrder.user._id;
  }

  const currentUserId = req.user._id;

  // Authorization Check
  if (orderOwnerId.toString() !== currentUserId.toString()) {
    // ఒకవేళ అడ్మిన్ అయితే అనుమతించొచ్చు (Optional - మీకు కావాలంటే ఉంచండి)
    if (req.user.role !== "admin") {
      console.log("❌ ID Mismatch - Access Denied");
      throw new AppError("Not authorized to reorder this", 403);
    }
  }

  // 2. Get or Create Cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  let itemsAdded = 0;

  // 3. Loop through Old Items
  for (const item of oldOrder.items) {
    // 🛡️ Safety Check
    if (!item.product) continue;

    // Fetch LIVE Product Data
    const product = await Product.findById(item.product);

    // ✅ Product Availability Check
    if (product && product.isActive && product.stock > 0) {
      // --- 🔥 NEW: PRICE LOGIC (Flash Sale Support) ---
      // స్కీమాలో ఉన్నట్టుగా, ఫ్లాష్ సేల్ ఉంటే ఆ ధరే తీసుకోవాలి.
      let currentPrice = product.discountPrice || product.price;

      if (product.flashSale?.isActive && product.flashSale?.salePrice) {
        const now = new Date();
        const start = new Date(product.flashSale.startTime);
        const end = new Date(product.flashSale.endTime);

        // టైమ్ చెక్ చేసి ఆఫర్ ప్రైస్ ఇస్తున్నాం
        if (now >= start && now <= end) {
          currentPrice = product.flashSale.salePrice;
        }
      }

      // --- Quantity Logic ---
      let quantityToAdd = item.quantity;
      if (quantityToAdd > product.stock) {
        quantityToAdd = product.stock;
      }

      // Check if item exists in cart
      const existingItemIndex = cart.items.findIndex(
        (ci) => ci.product.toString() === product._id.toString(),
      );

      if (existingItemIndex > -1) {
        // --- UPDATE EXISTING ITEM ---
        const currentQty = cart.items[existingItemIndex].quantity;
        let newQty = currentQty + quantityToAdd;

        if (newQty > product.stock) newQty = product.stock;

        cart.items[existingItemIndex].quantity = newQty;
        cart.items[existingItemIndex].price = currentPrice; // Live Price
        // 'itemTotal' will be calculated by Schema Hook automatically
      } else {
        // --- ADD NEW ITEM ---
        cart.items.push({
          product: product._id,
          quantity: quantityToAdd,
          price: currentPrice, // Live Price
          itemTotal: quantityToAdd * currentPrice, // Temporary set (Hook will fix/overwrite this)
        });
      }
      itemsAdded++;
    }
  }

  if (itemsAdded === 0) {
    throw new AppError("None of the items from this order are available.", 400);
  }

  // 4. 🔥 SAVE (Schema Hook does the rest!)
  // మనం ఇక్కడ Grand Total ని మాన్యువల్ గా లెక్కించాల్సిన పని లేదు.
  // మీ Cart Schema లో ఉన్న `pre('save')` హుక్.. Tax, Shipping, Total అన్నీ చూసుకుంటుంది.
  await cart.save();

  sendSuccess(res, 200, "Items added to cart successfully");
});

/**
 * @desc    Get User Orders
 * @route   GET /api/orders
 * @access  Private (Customer)
 */
export const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user._id };

  if (status) query.orderStatus = status;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  sendPaginatedResponse(res, 200, "Orders retrieved", orders, {
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

/**
 * @desc    Get Order By ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email phone",
  );
  if (!order) throw new AppError("Order not found", 404);

  // Authorization Check
  if (
    req.userType === "customer" &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not authorized", 403);
  }

  sendSuccess(res, 200, "Order details", { order });
});

/**
 * @desc    Cancel Order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (Customer)
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) throw new AppError("Order not found", 404);
  if (order.user._id.toString() !== req.user._id.toString())
    throw new AppError("Not authorized", 403);

  if (["Delivered", "Cancelled", "Shipped"].includes(order.orderStatus)) {
    throw new AppError(
      `Cannot cancel order at this stage (${order.orderStatus})`,
      400,
    );
  }

  // Update Status
  order.orderStatus = "Cancelled";
  order.cancellationReason = cancellationReason;
  order.cancelledAt = new Date();

  // Save status history
  order.statusHistory.push({
    status: "Cancelled",
    timestamp: new Date(),
    note: `Reason: ${cancellationReason}`,
    updatedBy: "Customer",
  });

  await order.save();

  // Restore Stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, totalSales: -item.quantity },
    });
  }

  // Note: Refund logic is removed as per request (since Razorpay is not active yet)

  emitToAdmins("order_cancelled", {
    orderNumber: order.orderNumber,
    reason: cancellationReason,
  });

  sendSuccess(res, 200, "Order cancelled successfully", { order });
});

/**
 * @desc    Request Return for Item (✨ NEW FEATURE)
 * @route   PUT /api/orders/:id/return/:itemId
 * @access  Private (Customer)
 */
export const requestReturn = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) throw new AppError("Order not found", 404);

  if (order.orderStatus !== "Delivered") {
    throw new AppError("Cannot return items from undelivered orders", 400);
  }

  // Find item
  const item = order.items.id(itemId);
  if (!item) throw new AppError("Item not found in order", 404);

  if (item.returnStatus !== "None") {
    throw new AppError(
      "Return already requested or processed for this item",
      400,
    );
  }

  // Update Item Status
  item.returnStatus = "Requested";

  // Push to history
  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    note: `Return requested for ${item.name}. Reason: ${reason}`,
    updatedBy: "Customer",
  });

  await order.save();

  emitToAdmins("return_requested", {
    orderNumber: order.orderNumber,
    itemName: item.name,
    reason,
  });

  sendSuccess(res, 200, "Return request submitted successfully");
});

/**
 * @desc    Update Order Status (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const {
    orderStatus,
    trackingNumber,
    courierPartner,
    estimatedDelivery,
    note,
  } = req.body;

  if (!orderStatus) {
    throw new AppError("Order status is required", 400);
  }

  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email",
  );
  if (!order) throw new AppError("Order not found", 404);

  const validStatuses = [
    "Placed",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Returned",
  ];
  if (!validStatuses.includes(orderStatus)) {
    throw new AppError("Invalid order status", 400);
  }

  // Auto-complete payment for COD on Delivery
  if (orderStatus === "Delivered") {
    order.deliveredAt = new Date();
    if (order.paymentMethod === "COD") {
      order.paymentStatus = "Completed";
      await Payment.findOneAndUpdate(
        { order: order._id },
        { paymentStatus: "Completed", paidAt: new Date() },
      );
    }
  }

  // Logistics Update
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courierPartner) order.courierPartner = courierPartner;
  if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

  // Change Status
  order.orderStatus = orderStatus;

  // Handle Admin Notes in Status History
  if (note) {
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note,
      updatedBy: "Admin",
    });
  }

  await order.save();

  // Invoice Generation
  if (orderStatus === "Delivered" && !order.invoicePath) {
    try {
      const invoicePath = await generateInvoice(order);
      order.invoicePath = invoicePath;
      order.invoiceNumber = `INV-${order.orderNumber}`;
      await order.save();
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  }

  // Notify User
  if (order.user) {
    emitToUser(order.user._id.toString(), "order_status_updated", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
    });
  }

  sendSuccess(res, 200, "Order status updated successfully", { order });
});

/**
 * @desc    Get All Orders (Admin)
 * @route   GET /api/orders/admin/all
 * @access  Private (Admin)
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    search,
    startDate,
    endDate,
  } = req.query;
  const query = {};

  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "shippingAddress.phone": { $regex: search, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const orders = await Order.find(query)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  sendPaginatedResponse(res, 200, "Orders retrieved", orders, {
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

/**
 * @desc    Download Invoice
 * @route   GET /api/orders/:id/invoice
 * @access  Private
 */
export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);

  // 🔥 FIX 1: Robust ID Checking
  // order.user ఆబ్జెక్ట్ అయినా, స్ట్రింగ్ అయినా ఇది హ్యాండిల్ చేస్తుంది
  const orderOwnerId = order.user._id
    ? order.user._id.toString()
    : order.user.toString();
  const currentUserId = req.user._id.toString();

  // మీ Middleware లో userType ఉంటే ఓకే, లేకపోతే req.user.role వాడండి
  const userRole = req.userType || req.user.role;

  // అడ్మిన్ కాకుండా, వేరే యూజర్ ఆర్డర్ చూడటానికి ట్రై చేస్తే ఆపాలి
  if (userRole !== "admin" && orderOwnerId !== currentUserId) {
    throw new AppError("Not authorized to download this invoice", 403);
  }

  // 🔥 FIX 2: File Existence Check
  // DB లో పాత్ ఉన్నా, ఫైల్ నిజంగా ఉందో లేదో చూడాలి (!fs.existsSync)
  if (!order.invoicePath || !fs.existsSync(order.invoicePath)) {
    // ఇన్వాయిస్ జనరేట్ చేసే ఫంక్షన్ కాల్ చేయండి
    const invoicePath = await generateInvoice(order);

    order.invoicePath = invoicePath;
    order.invoiceNumber = `INV-${order.orderNumber}`;
    await order.save();
  }

  // File Download
  res.download(order.invoicePath, `${order.invoiceNumber}.pdf`, (err) => {
    if (err) {
      console.error("Download Error:", err);
      // క్లయింట్‌కి ఎర్రర్ పంపడం లేదా సైలెంట్‌గా లాగ్ చేయడం
      if (!res.headersSent) {
        res.status(500).send("Could not download file");
      }
    }
  });
});
