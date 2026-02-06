import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/response.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import sendEmail, { generateCartEmailTemplate } from "../utils/email.js";
// /**
//  * @desc    Get User Cart
//  * @route   GET /api/cart
//  * @access  Private (Customer)
//  */
// export const getCart = asyncHandler(async (req, res) => {
//   let cart = await Cart.findOne({ user: req.user._id });

//   if (!cart) {
//     // Create empty cart if doesn't exist
//     cart = await Cart.create({
//       user: req.user._id,
//       items: [],
//     });
//   }

//   sendSuccess(res, 200, 'Cart retrieved successfully', { cart });
// });

// /**
//  * @desc    Add Item to Cart
//  * @route   POST /api/cart/add
//  * @access  Private (Customer)
//  */
// export const addToCart = asyncHandler(async (req, res) => {
//   const { productId, quantity = 1 } = req.body;

//   if (!productId) {
//     throw new AppError('Product ID is required', 400);
//   }

//   // Verify product exists and is available
//   const product = await Product.findById(productId);

//   if (!product || !product.isActive) {
//     throw new AppError('Product not found or unavailable', 404);
//   }

//   // Check stock availability
//   if (product.stock < quantity) {
//     throw new AppError(`Only ${product.stock} items available in stock`, 400);
//   }

//   // Get or create cart
//   let cart = await Cart.findOne({ user: req.user._id });

//   if (!cart) {
//     cart = await Cart.create({
//       user: req.user._id,
//       items: [],
//     });
//   }

//   // Check if product already in cart
//   const existingItem = cart.items.find(
//     (item) => item.product.toString() === productId
//   );

//   if (existingItem) {
//     // Update quantity
//     const newQuantity = existingItem.quantity + quantity;

//     if (product.stock < newQuantity) {
//       throw new AppError(`Only ${product.stock} items available in stock`, 400);
//     }

//     existingItem.quantity = newQuantity;
//     existingItem.price = product.discountPrice || product.price;
//     existingItem.subtotal = existingItem.quantity * existingItem.price;
//   } else {
//     // Add new item
//     cart.items.push({
//       product: productId,
//       quantity,
//       price: product.discountPrice || product.price,
//       subtotal: quantity * (product.discountPrice || product.price),
//     });
//   }

//   await cart.save();

//   // Populate cart before sending
//   await cart.populate('items.product', 'name partNumber images price discountPrice stock stockStatus');

//   sendSuccess(res, 200, 'Item added to cart successfully', { cart });
// });

// /**
//  * @desc    Update Cart Item Quantity
//  * @route   PUT /api/cart/update/:itemId
//  * @access  Private (Customer)
//  */
// export const updateCartItem = asyncHandler(async (req, res) => {
//   const { itemId } = req.params;
//   const { quantity } = req.body;

//   if (!quantity || quantity < 1) {
//     throw new AppError('Quantity must be at least 1', 400);
//   }

//   const cart = await Cart.findOne({ user: req.user._id });

//   if (!cart) {
//     throw new AppError('Cart not found', 404);
//   }

//   const item = cart.items.id(itemId);

//   if (!item) {
//     throw new AppError('Item not found in cart', 404);
//   }

//   // Verify product stock
//   const product = await Product.findById(item.product);

//   if (!product || !product.isActive) {
//     throw new AppError('Product not available', 404);
//   }

//   if (product.stock < quantity) {
//     throw new AppError(`Only ${product.stock} items available in stock`, 400);
//   }

//   // Update quantity
//   item.quantity = quantity;
//   item.price = product.discountPrice || product.price;
//   item.subtotal = item.quantity * item.price;

//   await cart.save();

//   // Populate cart
//   await cart.populate('items.product', 'name partNumber images price discountPrice stock stockStatus');

//   sendSuccess(res, 200, 'Cart item updated successfully', { cart });
// });

// /**
//  * @desc    Remove Item from Cart
//  * @route   DELETE /api/cart/remove/:itemId
//  * @access  Private (Customer)
//  */
// export const removeFromCart = asyncHandler(async (req, res) => {
//   const { itemId } = req.params;

//   const cart = await Cart.findOne({ user: req.user._id });

//   if (!cart) {
//     throw new AppError('Cart not found', 404);
//   }

//   const item = cart.items.id(itemId);

//   if (!item) {
//     throw new AppError('Item not found in cart', 404);
//   }

//   // Remove item
//   item.deleteOne();
//   await cart.save();

//   // Populate cart
//   await cart.populate('items.product', 'name partNumber images price discountPrice stock stockStatus');

//   sendSuccess(res, 200, 'Item removed from cart successfully', { cart });
// });

/**
 * Helper: Calculate Product Price (Handling Flash Sales)
 */
// const getProductPrice = (product) => {
//   let price = product.discountPrice || product.price;

//   // Flash Sale Logic
//   if (product.flashSale?.isActive && product.flashSale?.salePrice) {
//     const now = new Date();
//     if (
//       now >= product.flashSale.startTime &&
//       now <= product.flashSale.endTime
//     ) {
//       price = product.flashSale.salePrice;
//     }
//   }
//   return price;
// };

/**
 * Helper: Calculate Product Price (Strict Flash Sale Logic)
 */
const getProductPrice = (product) => {
  // 1. Default Price (Discount or MRP)
  let finalPrice = product.discountPrice || product.price;

  // 2. Check if Flash Sale exists & is Active
  if (
    product.flashSale &&
    product.flashSale.isActive &&
    product.flashSale.salePrice > 0
  ) {
    const now = new Date(); // Current Time
    const startTime = new Date(product.flashSale.startTime);
    const endTime = new Date(product.flashSale.endTime);

    // 3. Compare Dates Correctly
    if (now >= startTime && now <= endTime) {
      finalPrice = product.flashSale.salePrice;
    }
  }

  return Number(finalPrice); // Ensure it's a number
};

/**
 * @desc    Get User Cart
 * @route   GET /api/cart
 * @access  Private (Customer)
 */
// export const getCart = asyncHandler(async (req, res) => {
//   let cart = await Cart.findOne({ user: req.user._id });

//   if (!cart) {
//     cart = await Cart.create({
//       user: req.user._id,
//       items: [],
//     });
//   }

//   // Populate product details
//   await cart.populate('items.product', 'name partNumber images price discountPrice stock stockStatus flashSale');

//   sendSuccess(res, 200, 'Cart retrieved successfully', { cart });
// });

export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name partNumber images price discountPrice stock stockStatus flashSale",
  );

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
    return sendSuccess(res, 200, "Cart retrieved successfully", { cart });
  }

  // 🔥 FIX: కార్ట్ ఓపెన్ చేసినప్పుడు, లేటెస్ట్ ఫ్లాష్ సేల్ ధరలు అప్‌డేట్ అవ్వాలి
  let cartModified = false;

  cart.items.forEach((item) => {
    // Product డిలీట్ అయిపోతే skip చేయి
    if (!item.product) return;

    // ప్రొడక్ట్ నుండి తాజా ధరను తెచ్చుకో (Helper function వాడుతున్నాం)
    const currentLivePrice = getProductPrice(item.product);

    // కార్ట్‌లో ఉన్న ధర పాతది అయితే, అప్‌డేట్ చేయి
    if (item.price !== currentLivePrice) {
      item.price = currentLivePrice;
      item.itemTotal = item.quantity * currentLivePrice;
      cartModified = true;
    }
  });

  // ధరలు మారితేనే డేటాబేస్ సేవ్ చేయి (Performance బాగుంటుంది)
  if (cartModified) {
    await cart.save();
    // రీ-కాలిక్యులేషన్ తర్వాత మళ్ళీ సేవ్ అవుతుంది కాబట్టి totals అన్నీ సెట్ అవుతాయి.
  }

  sendSuccess(res, 200, "Cart retrieved successfully", { cart });
});

/**
 * @desc    Add Item to Cart
 * @route   POST /api/cart/add
 * @access  Private (Customer)
 */
// export const addToCart = asyncHandler(async (req, res) => {
//   const { productId, quantity = 1 } = req.body;

//   if (!productId) throw new AppError("Product ID is required", 400);

//   const product = await Product.findById(productId);
//   if (!product || !product.isActive)
//     throw new AppError("Product not found or unavailable", 404);

//   // Check stock
//   if (product.stock < quantity) {
//     throw new AppError(`Only ${product.stock} items available in stock`, 400);
//   }

//   let cart = await Cart.findOne({ user: req.user._id });
//   if (!cart) {
//     cart = await Cart.create({ user: req.user._id, items: [] });
//   }

//   // 🔥 FIX 1: Get correct price (Flash sale aware)
//   const price = getProductPrice(product);

//   const existingItemIndex = cart.items.findIndex(
//     (item) => item.product.toString() === productId,
//   );

//   if (existingItemIndex > -1) {
//     // Update quantity
//     const newQuantity = cart.items[existingItemIndex].quantity + quantity;

//     if (product.stock < newQuantity) {
//       throw new AppError(`Only ${product.stock} items available in stock`, 400);
//     }

//     cart.items[existingItemIndex].quantity = newQuantity;
//     cart.items[existingItemIndex].price = price;

//     // 🔥 FIX 2: Use 'itemTotal' instead of 'subtotal'
//     cart.items[existingItemIndex].itemTotal = newQuantity * price;
//   } else {
//     // Add new item
//     cart.items.push({
//       product: productId,
//       quantity,
//       price: price,
//       // 🔥 FIX 3: Use 'itemTotal' (Schema requirement)
//       itemTotal: quantity * price,
//     });
//   }

//   // Pre-save hook will calculate total cart amount
//   await cart.save();
//   await cart.populate(
//     "items.product",
//     "name partNumber images price discountPrice stock stockStatus flashSale",
//   );

//   sendSuccess(res, 200, "Item added to cart successfully", { cart });
// });

/**
 * @desc    Add Item to Cart
 * @route   POST /api/cart/add
 * @access  Private (Customer)
 */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) throw new AppError("Product ID is required", 400);

  // 1. ప్రొడక్ట్ ని "flashSale" తో సహా తీసుకురావాలి
  const product = await Product.findById(productId).select("+flashSale");

  if (!product || !product.isActive) {
    throw new AppError("Product not found or unavailable", 404);
  }

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // 🔥 FIX: స్ట్రాంగ్ డేట్ చెకింగ్ ఉన్న హెల్పర్ ఫంక్షన్ వాడుతున్నాం
  const price = getProductPrice(product);

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (existingItemIndex > -1) {
    // Update existing item
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;

    if (product.stock < newQuantity) {
      throw new AppError(`Only ${product.stock} items available in stock`, 400);
    }

    cart.items[existingItemIndex].quantity = newQuantity;

    // ఎప్పుడు యాడ్ చేసినా లేటెస్ట్ ధర అప్‌డేట్ అవ్వాలి
    cart.items[existingItemIndex].price = price;
    cart.items[existingItemIndex].itemTotal = newQuantity * price;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      price: price,
      itemTotal: quantity * price,
    });
  }

  await cart.save();
  await cart.populate(
    "items.product",
    "name partNumber images price discountPrice stock stockStatus flashSale",
  );

  sendSuccess(res, 200, "Item added to cart successfully", { cart });
});

/**
 * @desc    Update Cart Item Quantity
 * @route   PUT /api/cart/update/:itemId
 * @access  Private (Customer)
 */
export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1)
    throw new AppError("Quantity must be at least 1", 400);

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError("Cart not found", 404);

  const item = cart.items.id(itemId);
  if (!item) throw new AppError("Item not found in cart", 404);

  const product = await Product.findById(item.product);
  if (!product || !product.isActive)
    throw new AppError("Product not available", 404);

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  // 🔥 FIX 4: Update price & itemTotal
  const currentPrice = getProductPrice(product);

  item.quantity = quantity;
  item.price = currentPrice;
  item.itemTotal = quantity * currentPrice; // Changed from subtotal to itemTotal

  await cart.save();
  await cart.populate(
    "items.product",
    "name partNumber images price discountPrice stock stockStatus flashSale",
  );

  sendSuccess(res, 200, "Cart item updated successfully", { cart });
});

/**
 * @desc    Remove Item from Cart
 * @route   DELETE /api/cart/remove/:itemId
 * @access  Private (Customer)
 */
export const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) throw new AppError("Cart not found", 404);

  const item = cart.items.id(itemId);
  if (!item) throw new AppError("Item not found in cart", 404);

  item.deleteOne();
  await cart.save();
  await cart.populate(
    "items.product",
    "name partNumber images price discountPrice stock stockStatus",
  );

  sendSuccess(res, 200, "Item removed from cart successfully", { cart });
});

/**
 * @desc    Sync Cart (Update prices and availability)
 * @route   POST /api/cart/sync
 * @access  Private (Customer)
 */
export const syncCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0)
    throw new AppError("Cart is empty", 400);

  const updates = [];
  const removedItems = [];

  // Loop backwards to safely remove items
  for (let i = cart.items.length - 1; i >= 0; i--) {
    const item = cart.items[i];
    const product = await Product.findById(item.product);

    if (!product || !product.isActive || product.stock === 0) {
      removedItems.push(item);
      cart.items.splice(i, 1); // Remove item
      continue;
    }

    // Check Price Changes
    const currentPrice = getProductPrice(product);
    let updated = false;

    if (item.price !== currentPrice) {
      item.price = currentPrice;
      updated = true;
    }

    // Check Stock Limit
    if (item.quantity > product.stock) {
      item.quantity = product.stock;
      updated = true;
    }

    if (updated) {
      item.itemTotal = item.quantity * item.price; // Update itemTotal
      updates.push(item);
    }
  }

  await cart.save();
  await cart.populate(
    "items.product",
    "name partNumber images price discountPrice stock stockStatus flashSale",
  );

  sendSuccess(res, 200, "Cart synced successfully", {
    cart,
    updates: updates.length,
    removed: removedItems.length,
  });
});

/**
 * @desc    Clear Cart
 * @route   DELETE /api/cart/clear
 * @access  Private (Customer)
 */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = [];
  await cart.save();

  sendSuccess(res, 200, "Cart cleared successfully", { cart });
});

// /**
//  * @desc    Sync Cart (Update prices and availability)
//  * @route   POST /api/cart/sync
//  * @access  Private (Customer)
//  */
// export const syncCart = asyncHandler(async (req, res) => {
//   const cart = await Cart.findOne({ user: req.user._id });

//   if (!cart || cart.items.length === 0) {
//     throw new AppError('Cart is empty', 400);
//   }

//   // Check each item's availability and price
//   const updates = [];
//   const removedItems = [];

//   for (const item of cart.items) {
//     const product = await Product.findById(item.product);

//     if (!product || !product.isActive || product.stock === 0) {
//       // Remove unavailable items
//       removedItems.push(item);
//       item.deleteOne();
//       continue;
//     }

//     // Update price if changed
//     const currentPrice = product.discountPrice || product.price;
//     if (item.price !== currentPrice) {
//       item.price = currentPrice;
//       item.subtotal = item.quantity * item.price;
//       updates.push(item);
//     }

//     // Adjust quantity if exceeds stock
//     if (item.quantity > product.stock) {
//       item.quantity = product.stock;
//       item.subtotal = item.quantity * item.price;
//       updates.push(item);
//     }
//   }

//   await cart.save();

//   // Populate cart
//   await cart.populate('items.product', 'name partNumber images price discountPrice stock stockStatus');

//   sendSuccess(res, 200, 'Cart synced successfully', {
//     cart,
//     updates: updates.length,
//     removed: removedItems.length,
//   });
// });

/**
 * 🕵️ 1. Cron Job Function: Check & Mark Abandoned Carts
 * (Runs automatically via Cron or Manual Trigger)
 */
export const markAbandonedCarts = async (req, res) => {
  try {
    console.log("⏳ Running Abandoned Cart Check...");

    // 24 Hours ago
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    // 🔥 MAIN FIX & OPTIMIZATION:
    // 1. "items.0": { $exists: true } -> ఐటమ్స్ ఉన్న కార్ట్స్ మాత్రమే తీసుకుంటుంది.
    // 2. updateMany -> ఒక్కొక్కటి సేవ్ చేయకుండా, ఒకేసారి అన్నీ అప్‌డేట్ చేస్తుంది (Fast).
    const result = await Cart.updateMany(
      {
        status: "Active",
        lastActiveAt: { $lt: cutoffTime },
        "items.0": { $exists: true }, // Cart ఖాళీగా ఉంటే Abandoned అవ్వదు
      },
      {
        $set: { status: "Abandoned" },
      },
    );

    console.log(`⚠️ Marked ${result.modifiedCount} carts as Abandoned.`);

    // API ద్వారా కాల్ చేసినప్పుడు రెస్పాన్స్ పంపాలి (Cron Job కి ఇది అవసరం లేదు)
    if (res) {
      return res.status(200).json({
        success: true,
        count: result.modifiedCount,
        message: "Abandoned carts updated successfully.",
      });
    }
  } catch (error) {
    console.error("❌ Error marking carts:", error);
    if (res)
      return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 📋 2. Get Abandoned Carts List (For Admin Dashboard)
 */
export const getAbandonedCarts = async (req, res) => {
  try {
    const carts = await Cart.find({
      status: "Abandoned",
      "items.0": { $exists: true }, // 🔥 Safety Check: పొరపాటున ఖాళీ కార్ట్స్ ఉన్నా అవి లిస్ట్ లో రావు
    })
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate({
        path: "items.product",
        select: "name images price",
      })
      .sort({ lastActiveAt: -1 })
      .lean(); // 🔥 lean() వాడితే డేటాబేస్ రీడింగ్ చాలా ఫాస్ట్ అవుతుంది

    // Guest Users ని హ్యాండిల్ చేయడానికి డేటా ఫార్మాటింగ్
    const formattedCarts = carts.map((cart) => ({
      ...cart,
      userName: cart.user ? cart.user.name : "Guest User",
      userEmail: cart.user ? cart.user.email : "N/A",
      userPhone: cart.user ? cart.user.phone : "N/A",
    }));

    res.status(200).json({
      success: true,
      count: formattedCarts.length,
      data: formattedCarts,
    });
  } catch (error) {
    console.error("Error fetching abandoned carts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 📩 3. Send Recovery Email (Manual Trigger from Button)
 * This uses Nodemailer to send actual emails.
 */
export const sendRecoveryEmail = async (req, res) => {
  try {
    const { id } = req.params; // Cart ID

    // Cart వివరాలతో పాటు User & Product వివరాలు కూడా కావాలి
    const cart = await Cart.findById(id)
      .populate("user", "email name")
      .populate("items.product", "name images price");

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    if (cart.isReminderSent) {
      return res.status(400).json({
        success: false,
        message: "Reminder already sent to this user",
      });
    }

    if (!cart.user || !cart.user.email) {
      return res
        .status(400)
        .json({ success: false, message: "User email not found" });
    }

    // A. Generate HTML Template
    const emailHtml = generateCartEmailTemplate(cart.user.name, cart.items);

    // B. Send Email using Utility
    const isSent = await sendEmail(
      cart.user.email,
      "Items in your cart are waiting! 🛒", // Subject
      emailHtml,
    );

    if (isSent) {
      // C. Update DB Status
      cart.isReminderSent = true;
      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Recovery email sent successfully!" });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email via SMTP" });
    }
  } catch (error) {
    console.error("Error sending recovery email:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
