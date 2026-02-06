import crypto from 'crypto';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import razorpayInstance from '../config/razorpay.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { emitToUser } from '../sockets/socketHandler.js';

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payments/create-razorpay-order
 * @access  Private (Customer)
 */
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }

  // Get order
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify order belongs to user
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  // Check if order payment method is Razorpay
  if (order.paymentMethod !== 'Razorpay') {
    throw new AppError('Order payment method is not Razorpay', 400);
  }

  // Check if already paid
  if (order.paymentStatus === 'Completed') {
    throw new AppError('Order already paid', 400);
  }

  // Create Razorpay order
  const razorpayOrder = await razorpayInstance.orders.create({
    amount: Math.round(order.totalAmount * 100), // Amount in paise
    currency: 'INR',
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  // Update order with Razorpay order ID
  order.paymentDetails = {
    ...order.paymentDetails,
    razorpayOrderId: razorpayOrder.id,
  };
  await order.save();

  // Update payment record
  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      razorpayOrderId: razorpayOrder.id,
    }
  );

  sendSuccess(res, 200, 'Razorpay order created successfully', {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payments/verify-razorpay-payment
 * @access  Private (Customer)
 */
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
    throw new AppError('All payment details are required', 400);
  }

  // Get order
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify order belongs to user
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    // Payment verification failed
    order.paymentStatus = 'Failed';
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        paymentStatus: 'Failed',
        razorpayPaymentId,
        razorpaySignature,
        failureReason: 'Signature verification failed',
      }
    );

    throw new AppError('Payment verification failed', 400);
  }

  // Payment verified successfully
  order.paymentStatus = 'Completed';
  order.paymentDetails = {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paidAt: new Date(),
  };
  order.orderStatus = 'Confirmed';

  await order.save();

  // Update payment record
  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      paymentStatus: 'Completed',
      razorpayPaymentId,
      razorpaySignature,
      transactionId: razorpayPaymentId,
      paidAt: new Date(),
    }
  );

  // Emit notification to user
  emitToUser(req.user._id.toString(), 'payment_success', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
  });

  sendSuccess(res, 200, 'Payment verified successfully', {
    order,
  });
});

/**
 * @desc    Handle Payment Failure
 * @route   POST /api/payments/payment-failed
 * @access  Private (Customer)
 */
export const handlePaymentFailure = asyncHandler(async (req, res) => {
  const { orderId, error } = req.body;

  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify order belongs to user
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  // Update order payment status
  order.paymentStatus = 'Failed';
  await order.save();

  // Update payment record
  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      paymentStatus: 'Failed',
      failureReason: error?.description || 'Payment failed',
    }
  );

  // Emit notification to user
  emitToUser(req.user._id.toString(), 'payment_failed', {
    orderId: order._id,
    orderNumber: order.orderNumber,
  });

  sendSuccess(res, 200, 'Payment failure recorded', {
    order,
  });
});

/**
 * @desc    Get Payment Details
 * @route   GET /api/payments/:orderId
 * @access  Private (Customer/Admin)
 */
export const getPaymentDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const payment = await Payment.findOne({ order: orderId })
    .populate('order', 'orderNumber totalAmount paymentMethod paymentStatus')
    .populate('user', 'name email phone');

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Check authorization for customers
  if (
    req.userType === 'customer' &&
    payment.user._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized', 403);
  }

  sendSuccess(res, 200, 'Payment details retrieved successfully', {
    payment,
  });
});

/**
 * @desc    Get User Payment History
 * @route   GET /api/payments/user/history
 * @access  Private (Customer)
 */
export const getUserPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const payments = await Payment.find({ user: req.user._id })
    .populate('order', 'orderNumber totalAmount orderStatus')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Payment.countDocuments({ user: req.user._id });

  sendSuccess(res, 200, 'Payment history retrieved successfully', {
    payments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc    Get All Payments (Admin)
 * @route   GET /api/payments/admin/all
 * @access  Private (Admin)
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, method } = req.query;

  const query = {};

  if (status) {
    query.paymentStatus = status;
  }

  if (method) {
    query.paymentMethod = method;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const payments = await Payment.find(query)
    .populate('order', 'orderNumber totalAmount orderStatus')
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Payment.countDocuments(query);

  sendSuccess(res, 200, 'Payments retrieved successfully', {
    payments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});
