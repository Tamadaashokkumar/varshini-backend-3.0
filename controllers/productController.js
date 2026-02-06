// import { asyncHandler, AppError } from '../utils/errorHandler.js';
// import { sendSuccess, sendPaginatedResponse } from '../utils/response.js';
// import { deleteFromCloudinary } from '../config/cloudinary.js';
// import Product from '../models/Product.js';

// /**
//  * @desc    Create Product
//  * @route   POST /api/products
//  * @access  Private (Admin)
//  */
// export const createProduct = asyncHandler(async (req, res) => {
//   const {
//     name,
//     partNumber,
//     description,
//     category,
//     subcategory,
//     compatibleModels,
//     price,
//     discountPrice,
//     stock,
//     lowStockThreshold,
//     specifications,
//     warrantyPeriod,
//     manufacturer,
//     tags,
//     weight,
//     dimensions,
//   } = req.body;

//   // Check if part number already exists
//   const existingProduct = await Product.findOne({ partNumber });

//   if (existingProduct) {
//     throw new AppError('Product with this part number already exists', 400);
//   }

//   // Handle uploaded images
//   const images = req.files ? req.files.map((file) => ({
//     url: file.path,
//     publicId: file.filename,
//   })) : [];

//   // Create product
//   const product = await Product.create({
//     name,
//     partNumber,
//     description,
//     category,
//     subcategory,
//     compatibleModels: compatibleModels ? JSON.parse(compatibleModels) : [],
//     price,
//     discountPrice,
//     stock,
//     lowStockThreshold,
//     images,
//     specifications: specifications ? JSON.parse(specifications) : {},
//     warrantyPeriod,
//     manufacturer,
//     tags: tags ? JSON.parse(tags) : [],
//     weight,
//     dimensions: dimensions ? JSON.parse(dimensions) : {},
//   });

//   sendSuccess(res, 201, 'Product created successfully', { product });
// });

// /**
//  * @desc    Get All Products
//  * @route   GET /api/products
//  * @access  Public
//  */
// export const getAllProducts = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 12,
//     category,
//     model,
//     search,
//     minPrice,
//     maxPrice,
//     inStock,
//     sortBy = 'createdAt',
//     sortOrder = 'desc',
//   } = req.query;

//   // Build query
//   const query = { isActive: true };

//   if (category) {
//     query.category = category;
//   }

//   if (model) {
//     query.compatibleModels = model;
//   }

//   if (search) {
//     query.$text = { $search: search };
//   }

//   if (minPrice || maxPrice) {
//     query.price = {};
//     if (minPrice) query.price.$gte = Number(minPrice);
//     if (maxPrice) query.price.$lte = Number(maxPrice);
//   }

//   if (inStock === 'true') {
//     query.stock = { $gt: 0 };
//   }

//   // Calculate pagination
//   const skip = (Number(page) - 1) * Number(limit);

//   // Execute query
//   const products = await Product.find(query)
//     .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
//     .skip(skip)
//     .limit(Number(limit));

//   const total = await Product.countDocuments(query);

//   sendPaginatedResponse(
//     res,
//     200,
//     'Products retrieved successfully',
//     products,
//     {
//       total,
//       page: Number(page),
//       limit: Number(limit),
//     }
//   );
// });

// /**
//  * @desc    Get Product By ID
//  * @route   GET /api/products/:id
//  * @access  Public
//  */
// export const getProductById = asyncHandler(async (req, res) => {
//   const product = await Product.findById(req.params.id);

//   if (!product || !product.isActive) {
//     throw new AppError('Product not found', 404);
//   }

//   sendSuccess(res, 200, 'Product retrieved successfully', { product });
// });

// /**
//  * @desc    Update Product
//  * @route   PUT /api/products/:id
//  * @access  Private (Admin)
//  */
// export const updateProduct = asyncHandler(async (req, res) => {
//   const {
//     name,
//     description,
//     category,
//     subcategory,
//     compatibleModels,
//     price,
//     discountPrice,
//     stock,
//     lowStockThreshold,
//     specifications,
//     warrantyPeriod,
//     manufacturer,
//     tags,
//     weight,
//     dimensions,
//     isActive,
//   } = req.body;

//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     throw new AppError('Product not found', 404);
//   }

//   // Update fields
//   if (name) product.name = name;
//   if (description) product.description = description;
//   if (category) product.category = category;
//   if (subcategory !== undefined) product.subcategory = subcategory;
//   if (compatibleModels) product.compatibleModels = JSON.parse(compatibleModels);
//   if (price) product.price = price;
//   if (discountPrice !== undefined) product.discountPrice = discountPrice;
//   if (stock !== undefined) product.stock = stock;
//   if (lowStockThreshold) product.lowStockThreshold = lowStockThreshold;
//   if (specifications) product.specifications = JSON.parse(specifications);
//   if (warrantyPeriod) product.warrantyPeriod = warrantyPeriod;
//   if (manufacturer) product.manufacturer = manufacturer;
//   if (tags) product.tags = JSON.parse(tags);
//   if (weight !== undefined) product.weight = weight;
//   if (dimensions) product.dimensions = JSON.parse(dimensions);
//   if (isActive !== undefined) product.isActive = isActive;

//   // Handle new images
//   if (req.files && req.files.length > 0) {
//     const newImages = req.files.map((file) => ({
//       url: file.path,
//       publicId: file.filename,
//     }));
//     product.images.push(...newImages);
//   }

//   await product.save();

//   sendSuccess(res, 200, 'Product updated successfully', { product });
// });

// /**
//  * @desc    Delete Product Image
//  * @route   DELETE /api/products/:id/images/:imageId
//  * @access  Private (Admin)
//  */
// export const deleteProductImage = asyncHandler(async (req, res) => {
//   const { id, imageId } = req.params;

//   const product = await Product.findById(id);

//   if (!product) {
//     throw new AppError('Product not found', 404);
//   }

//   const image = product.images.id(imageId);

//   if (!image) {
//     throw new AppError('Image not found', 404);
//   }

//   // Delete from Cloudinary
//   await deleteFromCloudinary(image.publicId);

//   // Remove from database
//   image.deleteOne();
//   await product.save();

//   sendSuccess(res, 200, 'Image deleted successfully');
// });

// /**
//  * @desc    Soft Delete Product
//  * @route   DELETE /api/products/:id
//  * @access  Private (Admin)
//  */
// export const deleteProduct = asyncHandler(async (req, res) => {
//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     throw new AppError('Product not found', 404);
//   }

//   product.isDeleted = true;
//   product.isActive = false;
//   await product.save();

//   sendSuccess(res, 200, 'Product deleted successfully');
// });

// /**
//  * @desc    Get Products By Category
//  * @route   GET /api/products/category/:category
//  * @access  Public
//  */
// export const getProductsByCategory = asyncHandler(async (req, res) => {
//   const { category } = req.params;
//   const { page = 1, limit = 12 } = req.query;

//   const skip = (Number(page) - 1) * Number(limit);

//   const products = await Product.find({
//     category,
//     isActive: true,
//   })
//     .skip(skip)
//     .limit(Number(limit))
//     .sort({ createdAt: -1 });

//   const total = await Product.countDocuments({ category, isActive: true });

//   sendPaginatedResponse(
//     res,
//     200,
//     'Products retrieved successfully',
//     products,
//     {
//       total,
//       page: Number(page),
//       limit: Number(limit),
//     }
//   );
// });

// /**
//  * @desc    Get Low Stock Products
//  * @route   GET /api/products/low-stock
//  * @access  Private (Admin)
//  */
// export const getLowStockProducts = asyncHandler(async (req, res) => {
//   const products = await Product.find({
//     stockStatus: { $in: ['Low Stock', 'Out of Stock'] },
//     isActive: true,
//   }).sort({ stock: 1 });

//   sendSuccess(res, 200, 'Low stock products retrieved successfully', {
//     products,
//     count: products.length,
//   });
// });

// /**
//  * @desc    Update Product Stock
//  * @route   PATCH /api/products/:id/stock
//  * @access  Private (Admin)
//  */
// export const updateProductStock = asyncHandler(async (req, res) => {
//   const { stock } = req.body;

//   if (stock === undefined) {
//     throw new AppError('Stock quantity is required', 400);
//   }

//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     throw new AppError('Product not found', 404);
//   }

//   product.stock = stock;
//   await product.save();

//   sendSuccess(res, 200, 'Stock updated successfully', { product });
// });

// /**
//  * @desc    Get Featured Products (Best Sellers)
//  * @route   GET /api/products/featured
//  * @access  Public
//  */
// export const getFeaturedProducts = asyncHandler(async (req, res) => {
//   const products = await Product.find({
//     isActive: true,
//   })
//     .sort({ totalSales: -1, averageRating: -1 })
//     .limit(8);

//   sendSuccess(res, 200, 'Featured products retrieved successfully', {
//     products,
//   });
// });

import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";
import Product from "../models/Product.js";

// Helper to safely parse JSON strings (Multipart forms send objects as strings)
const parseData = (data) => {
  if (!data) return undefined;
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    return data;
  }
};

/**
 * @desc    Create Product
 * @route   POST /api/products
 * @access  Private (Admin)
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    partNumber,
    description,
    category,
    subcategory,
    price,
    discountPrice,
    stock,
    lowStockThreshold,
    warrantyPeriod,
    manufacturer,
    // Complex fields (Need JSON parsing)
    compatibleModels,
    specifications,
    tags,
    flashSale,
    inventoryAnalytics,
    returnPolicy,
    shippingInfo,
  } = req.body;

  // 1. Check duplicate part number
  const existingProduct = await Product.findOne({ partNumber });
  if (existingProduct) {
    throw new AppError("Product with this part number already exists", 400);
  }

  // 2. Handle Images
  const images = req.files
    ? req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }))
    : [];

  // 3. Create Product
  const product = await Product.create({
    name,
    partNumber,
    description,
    category,
    subcategory,
    price,
    discountPrice,
    stock,
    lowStockThreshold,
    warrantyPeriod,
    manufacturer,
    images,
    // Parsing JSON fields coming from FormData
    compatibleModels: parseData(compatibleModels) || [],
    specifications: parseData(specifications) || {},
    tags: parseData(tags) || [],
    flashSale: parseData(flashSale) || {},
    inventoryAnalytics: parseData(inventoryAnalytics) || {},
    returnPolicy: parseData(returnPolicy) || {},
    shippingInfo: parseData(shippingInfo) || {},
  });

  sendSuccess(res, 201, "Product created successfully", { product });
});

/**
 * @desc    Get All Products (With Advanced Filters)
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 500,
    category,
    subcategory,
    model, // Car Model Name e.g., "Creta"
    year, // Car Year e.g., 2020
    search,
    minPrice,
    maxPrice,
    inStock,
    isFlashSale,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query = { isActive: true };

  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;

  // Filter by Compatible Model & Year
  if (model) {
    query.compatibleModels = {
      $elemMatch: {
        modelName: { $regex: model, $options: "i" }, // Case-insensitive search
        ...(year && {
          yearFrom: { $lte: Number(year) },
          $or: [{ yearTo: { $gte: Number(year) } }, { yearTo: null }], // Covers "Till Date"
        }),
      },
    };
  }

  // Text Search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { partNumber: { $regex: search, $options: "i" } },
      {
        sanitizedPartNumber: {
          $regex: search.replace(/[^a-zA-Z0-9]/g, ""),
          $options: "i",
        },
      }, // Smart Search
    ];
  }

  // Price Range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Stock Filter
  if (inStock === "true") {
    query.stock = { $gt: 0 };
  }

  // Flash Sale Filter
  if (isFlashSale === "true") {
    const now = new Date();
    query["flashSale.isActive"] = true;
    query["flashSale.startTime"] = { $lte: now };
    query["flashSale.endTime"] = { $gte: now };
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute
  const products = await Product.find(query)
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  sendPaginatedResponse(res, 200, "Products retrieved successfully", products, {
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

/**
 * @desc    Get Product By ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  sendSuccess(res, 200, "Product retrieved successfully", { product });
});

// /**
//  * @desc    Update Product
//  * @route   PUT /api/products/:id
//  * @access  Private (Admin)
//  */
// export const updateProduct = asyncHandler(async (req, res) => {
//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     throw new AppError("Product not found", 404);
//   }

//   // Extract fields from request
//   const {
//     name,
//     partNumber,
//     description,
//     category,
//     subcategory,
//     compatibleModels,
//     price,
//     discountPrice,
//     stock,
//     lowStockThreshold,
//     specifications,
//     warrantyPeriod,
//     manufacturer,
//     tags,
//     flashSale,
//     inventoryAnalytics,
//     returnPolicy,
//     shippingInfo,
//     isActive,
//   } = req.body;

//   // Direct Updates
//   // ... (code continues)

//   // Direct Updates - Safe Check for Zeros
//   if (name) product.name = name;
//   if (partNumber) product.partNumber = partNumber;
//   if (description) product.description = description;
//   if (category) product.category = category;
//   if (subcategory) product.subcategory = subcategory;

//   // 🔥 FIX: 0 value vachina update ayye laaga conditions marchali
//   if (price !== undefined) product.price = Number(price);
//   if (discountPrice !== undefined)
//     product.discountPrice = Number(discountPrice);
//   if (stock !== undefined) product.stock = Number(stock);
//   if (lowStockThreshold !== undefined)
//     product.lowStockThreshold = Number(lowStockThreshold);

//   if (warrantyPeriod) product.warrantyPeriod = warrantyPeriod;
//   if (manufacturer) product.manufacturer = manufacturer;
//   if (isActive !== undefined) product.isActive = isActive;

//   // ... (remaining code same)

//   // JSON Parsed Updates (Objects/Arrays)
//   if (compatibleModels) product.compatibleModels = parseData(compatibleModels);
//   if (specifications) product.specifications = parseData(specifications);
//   if (tags) product.tags = parseData(tags);
//   if (flashSale) product.flashSale = parseData(flashSale);
//   if (inventoryAnalytics)
//     product.inventoryAnalytics = parseData(inventoryAnalytics);
//   if (returnPolicy) product.returnPolicy = parseData(returnPolicy);
//   if (shippingInfo) product.shippingInfo = parseData(shippingInfo);

//   // Handle New Images
//   if (req.files && req.files.length > 0) {
//     const newImages = req.files.map((file) => ({
//       url: file.path,
//       publicId: file.filename,
//     }));
//     product.images.push(...newImages);
//   }

//   await product.save();

//   sendSuccess(res, 200, "Product updated successfully", { product });
// });

/**
 * @desc    Update Product
 * @route   PUT /api/products/:id
 * @access  Private (Admin)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Extract fields from request
  const {
    name,
    partNumber,
    description,
    category,
    subcategory,
    compatibleModels,
    price,
    discountPrice,
    stock,
    lowStockThreshold,
    specifications,
    warrantyPeriod,
    manufacturer,
    tags,
    flashSale,
    inventoryAnalytics,
    returnPolicy,
    shippingInfo,
    isActive,
  } = req.body;

  // --- DIRECT UPDATES (Fixed for 0 values) ---

  if (name) product.name = name;
  if (partNumber) product.partNumber = partNumber;
  if (description) product.description = description;
  if (category) product.category = category;
  if (subcategory) product.subcategory = subcategory;

  // ⚠️ FIX: 'undefined' check pettam valla 0 unna kani update avutundi
  if (price !== undefined) product.price = Number(price);
  if (discountPrice !== undefined)
    product.discountPrice = Number(discountPrice);
  if (stock !== undefined) product.stock = Number(stock);
  if (lowStockThreshold !== undefined)
    product.lowStockThreshold = Number(lowStockThreshold);

  if (warrantyPeriod) product.warrantyPeriod = warrantyPeriod;
  if (manufacturer) product.manufacturer = manufacturer;

  // Boolean values check
  if (isActive !== undefined) {
    // String "false" vasthe Boolean false ga marchali
    product.isActive = isActive === "true" || isActive === true;
  }

  // --- JSON PARSED UPDATES (Objects/Arrays) ---
  if (compatibleModels) product.compatibleModels = parseData(compatibleModels);
  if (specifications) product.specifications = parseData(specifications);
  if (tags) product.tags = parseData(tags);
  if (flashSale) product.flashSale = parseData(flashSale);
  if (inventoryAnalytics)
    product.inventoryAnalytics = parseData(inventoryAnalytics);
  if (returnPolicy) product.returnPolicy = parseData(returnPolicy);
  if (shippingInfo) product.shippingInfo = parseData(shippingInfo);

  // --- HANDLE NEW IMAGES ---
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
    product.images.push(...newImages);
  }

  // 🔥 IMPORTANT: save() call chesthe ne logic trigger ayyi status update avutundi
  await product.save();

  sendSuccess(res, 200, "Product updated successfully", { product });
});

/**
 * @desc    Delete Product Image
 * @route   DELETE /api/products/:id/images/:imageId
 * @access  Private (Admin)
 */
export const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  const product = await Product.findById(id);

  if (!product) throw new AppError("Product not found", 404);

  const image = product.images.id(imageId);
  if (!image) throw new AppError("Image not found", 404);

  // Delete from Cloudinary
  await deleteFromCloudinary(image.publicId);

  // Remove from DB
  image.deleteOne();
  await product.save();

  sendSuccess(res, 200, "Image deleted successfully");
});

/**
 * @desc    Soft Delete Product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) throw new AppError("Product not found", 404);

  product.isDeleted = true;
  product.isActive = false;
  await product.save();

  sendSuccess(res, 200, "Product deleted successfully");
});

/**
 * @desc    Get Products By Category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 12 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const products = await Product.find({ category, isActive: true })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments({ category, isActive: true });

  sendPaginatedResponse(res, 200, "Products retrieved", products, {
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

/**
 * @desc    Get Low Stock Products
 * @route   GET /api/products/low-stock
 * @access  Private (Admin)
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    stockStatus: { $in: ["Low Stock", "Out of Stock"] },
    isActive: true,
  }).sort({ stock: 1 });

  sendSuccess(res, 200, "Low stock products retrieved", {
    products,
    count: products.length,
  });
});

/**
 * @desc    Update Product Stock
 * @route   PATCH /api/products/:id/stock
 * @access  Private (Admin)
 */
export const updateProductStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined)
    throw new AppError("Stock quantity is required", 400);

  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);

  product.stock = stock;
  await product.save();

  sendSuccess(res, 200, "Stock updated successfully", { product });
});

/**
 * @desc    Get Featured Products (Best Sellers or Flash Sales)
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  // Logic: First show active Flash Sales, then Best Sellers
  const now = new Date();

  const products = await Product.find({ isActive: true })
    .sort({
      "flashSale.isActive": -1, // Flash sales first
      totalSales: -1, // Then best sellers
      averageRating: -1,
    })
    .limit(8);

  sendSuccess(res, 200, "Featured products retrieved", { products });
});

/**
 * @desc    Get Related Products (Same Category)
 * @route   GET /api/products/:id/related
 * @access  Public
 */
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. ప్రస్తుత ప్రొడక్ట్ ని కనుక్కోవడం
  const currentProduct = await Product.findById(id);
  if (!currentProduct) {
    throw new AppError("Product not found", 404);
  }

  // 2. అదే Category లో ఉన్న వేరే ప్రొడక్ట్స్ ని వెతకడం (ప్రస్తుత ప్రొడక్ట్ ని వదిలేసి)
  const relatedProducts = await Product.find({
    category: currentProduct.category,
    _id: { $ne: id }, // Exclude current product
    isActive: true,
  })
    .limit(4) // కేవలం 4 మాత్రమే కావాలి
    .sort({ averageRating: -1 }); // రేటింగ్ బాగున్నవి ముందు వస్తాయి

  sendSuccess(res, 200, "Related products retrieved", {
    products: relatedProducts,
  });
});

/**
 * @desc    Get Smart Auto-Bundles (Frequently Bought Together)
 * @route   GET /api/products/:id/bundles
 * @access  Public
 */
export const getSmartBundles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. ప్రస్తుతం యూజర్ చూస్తున్న ప్రొడక్ట్ ని తీసుకురావడం
  const sourceProduct = await Product.findById(id);

  if (!sourceProduct) {
    throw new AppError("Product not found", 404);
  }

  // 2. లాజిక్: ఏ కేటగిరీకి ఏది జోడిగా (Combo) బాగుంటుంది?
  // ఉదాహరణ: Engine చూస్తుంటే -> Service Parts (Oil, Filters) చూపించు
  const categoryRules = {
    // Main Category        // Recommended Categories for Bundle
    Engine: ["Service Parts", "Electrical"],
    Brake: ["Suspension", "Service Parts"], // Brake Pad + Brake Oil
    Suspension: ["Brake", "Body"],
    Electrical: ["Accessories", "Interior"],
    Body: ["Exterior", "Accessories"],
    "Service Parts": ["Engine", "Accessories"], // Oil చూస్తుంటే Engine Parts చూపించు
    Accessories: ["Interior", "Exterior"],
    Transmission: ["Engine", "Service Parts"],
  };

  // టార్గెట్ కేటగిరీలను ఎంచుకోవడం (Default గా 'Service Parts' & 'Accessories' పెడతాం)
  const targetCategories = categoryRules[sourceProduct.category] || [
    "Service Parts",
    "Accessories",
  ];

  // 3. కారు మోడల్ మ్యాచింగ్ (Smart Logic)
  // సోర్స్ ప్రొడక్ట్ ఏ కార్లకు (ఉదా: Creta, i20) సపోర్ట్ చేస్తుందో ఆ లిస్ట్ తీసుకోవాలి.
  const supportedModels = sourceProduct.compatibleModels.map(
    (m) => m.modelName,
  );

  // 4. డేటాబేస్ క్వెరీ (The Real Magic)
  const bundleSuggestions = await Product.find({
    _id: { $ne: sourceProduct._id }, // చూస్తున్న ప్రొడక్ట్ మళ్ళీ రాకూడదు
    category: { $in: targetCategories }, // పైన నిర్ణయించిన కేటగిరీల్లో ఉండాలి
    isActive: true,
    stockStatus: "In Stock", // స్టాక్ ఉన్నవి మాత్రమే

    // 🔥 CRITICAL: అదే కార్ మోడల్ కి సపోర్ట్ చేసేవి మాత్రమే రావాలి
    "compatibleModels.modelName": { $in: supportedModels },
  })
    .sort({ totalSales: -1, averageRating: -1 }) // బాగా అమ్ముడయ్యేవి ముందు వస్తాయి
    .limit(3) // బండిల్ లో మాక్సిమం 3 ఐటమ్స్ చాలు
    .select(
      "name partNumber price discountPrice images stock compatibleModels",
    );

  // 5. కాలిక్యులేషన్స్ (Frontend కి ఈజీగా ఉండటం కోసం)
  const bundleItems = [sourceProduct, ...bundleSuggestions];

  // బండిల్ మొత్తం ధర కాలిక్యులేట్ చేయడం
  const totalPrice = bundleItems.reduce(
    (acc, item) => acc + (item.discountPrice || item.price),
    0,
  );

  // నిజమైన ధర (MRP)
  const totalMRP = bundleItems.reduce((acc, item) => acc + item.price, 0);

  sendSuccess(res, 200, "Smart bundle retrieved successfully", {
    mainProduct: {
      _id: sourceProduct._id,
      name: sourceProduct.name,
      price: sourceProduct.discountPrice || sourceProduct.price,
      image: sourceProduct.images[0]?.url,
    },
    suggestedAddons: bundleSuggestions, // ఇవి బండిల్ లో యాడ్ చేయాల్సినవి
    bundleSummary: {
      totalItems: bundleItems.length,
      totalPrice: totalPrice, // ఆఫర్ ప్రైస్ టోటల్
      totalMRP: totalMRP, // అసలు ధర టోటల్
      youSave: totalMRP - totalPrice,
    },
  });
});
