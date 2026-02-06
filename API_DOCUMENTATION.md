# 📚 API Documentation

Complete API reference for Hyundai Spares E-Commerce Platform

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 User Authentication

### Register User

**POST** `/auth/register`

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### User Login

**POST** `/auth/login`

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get User Profile

**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

### Add Address

**POST** `/auth/address`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "addressType": "Home",
  "street": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "isDefault": true
}
```

---

## 👔 Admin Authentication

### Admin Login

**POST** `/admin/auth/login`

**Body:**

```json
{
  "email": "admin@hyundaispares.com",
  "password": "Admin@12345"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin",
      "email": "admin@hyundaispares.com",
      "role": "admin"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 📦 Products

### Get All Products

**GET** `/products`

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12)
- `category` (string): Filter by category
- `model` (string): Filter by compatible model
- `search` (string): Search in name, description, part number
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `inStock` (boolean): Show only in-stock items
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): asc or desc (default: desc)

**Example:**

```
GET /products?category=Engine&model=Creta&page=1&limit=12
```

**Response:**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 12,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Get Product by ID

**GET** `/products/:id`

### Create Product (Admin)

**POST** `/products`

**Headers:**

- `Authorization: Bearer <admin-token>`
- `Content-Type: multipart/form-data`

**Form Data:**

```
name: "Engine Oil Filter"
partNumber: "EOL123"
description: "High-quality engine oil filter for Hyundai vehicles"
category: "Engine"
compatibleModels: ["Creta", "Verna", "i20"]
price: 450
discountPrice: 400
stock: 100
lowStockThreshold: 10
images: [file1.jpg, file2.jpg]
specifications: {"Size": "Standard", "Material": "Metal"}
warrantyPeriod: "6 months"
tags: ["filter", "engine", "oil"]
```

### Update Product (Admin)

**PUT** `/products/:id`

**Headers:**

- `Authorization: Bearer <admin-token>`
- `Content-Type: multipart/form-data`

### Update Stock (Admin)

**PATCH** `/products/:id/stock`

**Headers:** `Authorization: Bearer <admin-token>`

**Body:**

```json
{
  "stock": 50
}
```

### Delete Product (Admin)

**DELETE** `/products/:id`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Featured Products

**GET** `/products/featured`

### Get Products by Category

**GET** `/products/category/:category`

**Example:**

```
GET /products/category/Engine
```

### Get Low Stock Products (Admin)

**GET** `/products/low-stock`

**Headers:** `Authorization: Bearer <admin-token>`

---

## 🛒 Cart

### Get Cart

**GET** `/cart`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "_id": "...",
      "user": "...",
      "items": [
        {
          "product": {
            "name": "Engine Oil Filter",
            "partNumber": "EOL123",
            "images": [...]
          },
          "quantity": 2,
          "price": 400,
          "subtotal": 800
        }
      ],
      "totalItems": 2,
      "subtotal": 800,
      "tax": 144,
      "shippingCharges": 100,
      "totalAmount": 1044
    }
  }
}
```

### Add to Cart

**POST** `/cart/add`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "productId": "product_id_here",
  "quantity": 2
}
```

### Update Cart Item

**PUT** `/cart/update/:itemId`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "quantity": 3
}
```

### Remove from Cart

**DELETE** `/cart/remove/:itemId`

**Headers:** `Authorization: Bearer <token>`

### Clear Cart

**DELETE** `/cart/clear`

**Headers:** `Authorization: Bearer <token>`

### Sync Cart

**POST** `/cart/sync`

**Headers:** `Authorization: Bearer <token>`

---

## 📋 Orders

### Create Order

**POST** `/orders`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "shippingAddressId": "address_id_here",
  "paymentMethod": "Razorpay",
  "notes": "Please deliver between 10 AM - 2 PM"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "_id": "...",
      "orderNumber": "ORD20241219001",
      "user": {...},
      "items": [...],
      "totalAmount": 1044,
      "paymentMethod": "Razorpay",
      "paymentStatus": "Pending",
      "orderStatus": "Placed"
    }
  }
}
```

### Get User Orders

**GET** `/orders`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (number)
- `limit` (number)
- `status` (string): Filter by order status

### Get Order by ID

**GET** `/orders/:id`

**Headers:** `Authorization: Bearer <token>`

### Cancel Order

**PUT** `/orders/:id/cancel`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "cancellationReason": "Changed my mind"
}
```

### Get All Orders (Admin)

**GET** `/orders/admin/all`

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**

- `page` (number)
- `limit` (number)
- `status` (string)
- `paymentStatus` (string)
- `search` (string)
- `startDate` (date)
- `endDate` (date)

### Update Order Status (Admin)

**PUT** `/orders/:id/status`

**Headers:** `Authorization: Bearer <admin-token>`

**Body:**

```json
{
  "orderStatus": "Shipped",
  "trackingNumber": "TRK123456789",
  "courierPartner": "BlueDart",
  "estimatedDelivery": "2024-12-25",
  "note": "Package shipped via BlueDart"
}
```

### Download Invoice

**GET** `/orders/:id/invoice`

**Headers:** `Authorization: Bearer <token>`

**Response:** PDF file download

---

## 💳 Payments

### Create Razorpay Order

**POST** `/payments/create-razorpay-order`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "orderId": "order_id_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "razorpayOrderId": "order_xyz123",
    "amount": 104400,
    "currency": "INR",
    "keyId": "rzp_test_..."
  }
}
```

### Verify Razorpay Payment

**POST** `/payments/verify-razorpay-payment`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc789",
  "razorpaySignature": "signature_here",
  "orderId": "order_id_here"
}
```

### Handle Payment Failure

**POST** `/payments/payment-failed`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "orderId": "order_id_here",
  "error": {
    "description": "Payment failed due to insufficient balance"
  }
}
```

### Get Payment Details

**GET** `/payments/:orderId`

**Headers:** `Authorization: Bearer <token>`

### Get Payment History

**GET** `/payments/user/history`

**Headers:** `Authorization: Bearer <token>`

### Get All Payments (Admin)

**GET** `/payments/admin/all`

**Headers:** `Authorization: Bearer <admin-token>`

---

## 📊 Dashboard (Admin Only)

### Get Dashboard Stats

**GET** `/dashboard/stats`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalOrders": 150,
      "totalRevenue": 450000,
      "totalCustomers": 85,
      "pendingOrders": 12,
      "lowStockCount": 5,
      "todayOrders": 8,
      "todayRevenue": 24000,
      "ordersByStatus": [...]
    }
  }
}
```

### Get Monthly Revenue

**GET** `/dashboard/revenue/monthly?year=2024`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Daily Revenue

**GET** `/dashboard/revenue/daily`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Recent Orders

**GET** `/dashboard/orders/recent?limit=10`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Low Stock Products

**GET** `/dashboard/products/low-stock`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Top Selling Products

**GET** `/dashboard/products/top-selling?limit=10`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Sales by Category

**GET** `/dashboard/sales/by-category`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Customer Growth

**GET** `/dashboard/customers/growth?months=6`

**Headers:** `Authorization: Bearer <admin-token>`

### Get Payment Method Stats

**GET** `/dashboard/payments/methods`

**Headers:** `Authorization: Bearer <admin-token>`

---

## 🔌 Socket.io Events

### Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "your-jwt-token",
  },
});

socket.on("connected", (data) => {
  console.log("Connected:", data);
});
```

### Customer Events

```javascript
// Listen for order updates
socket.on("order_placed", (data) => {
  console.log("Order placed:", data);
});

socket.on("order_status_updated", (data) => {
  console.log("Order status updated:", data);
});

socket.on("payment_success", (data) => {
  console.log("Payment successful:", data);
});

socket.on("payment_failed", (data) => {
  console.log("Payment failed:", data);
});
```

### Admin Events

```javascript
// Listen for new orders
socket.on("new_order", (data) => {
  console.log("New order received:", data);
});

socket.on("order_cancelled", (data) => {
  console.log("Order cancelled:", data);
});
```

### Join Order Room

```javascript
socket.emit("join_order_room", orderId);
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

# API Testing Examples

## Setup

Before testing, ensure you have:

1. Backend server running on `http://localhost:5000`
2. Valid JWT token (login first)
3. Valid Product IDs in your database
4. Valid Order with "Delivered" status for review testing

## Authentication

First, login to get your JWT token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the token from response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## Wishlist API Tests

### 1. Toggle Product in Wishlist (Add)

```bash
curl -X POST http://localhost:5000/api/wishlist/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Product added to wishlist",
  "action": "added",
  "wishlist": {
    "_id": "...",
    "user": "...",
    "products": [...]
  }
}
```

### 2. Toggle Product in Wishlist (Remove)

```bash
# Call the same endpoint again with the same productId
curl -X POST http://localhost:5000/api/wishlist/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Product removed from wishlist",
  "action": "removed",
  "wishlist": {
    "_id": "...",
    "user": "...",
    "products": [...]
  }
}
```

### 3. Get User's Wishlist

```bash
curl -X GET http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "products": [
    {
      "product": {
        "_id": "...",
        "name": "Product Name",
        "price": 99.99,
        "images": ["..."],
        "stock": 50
      },
      "addedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 4. Check if Product is in Wishlist

```bash
curl -X GET http://localhost:5000/api/wishlist/check/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "inWishlist": true
}
```

### 5. Clear Wishlist

```bash
curl -X DELETE http://localhost:5000/api/wishlist/clear \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Wishlist cleared successfully"
}
```

---

## Review API Tests

### 1. Check if User Can Review Product

```bash
curl -X GET http://localhost:5000/api/reviews/can-review/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (Can Review):**

```json
{
  "canReview": true
}
```

**Expected Response (Already Reviewed):**

```json
{
  "canReview": false,
  "reason": "already_reviewed",
  "review": { ... }
}
```

**Expected Response (Not Purchased):**

```json
{
  "canReview": false,
  "reason": "not_purchased"
}
```

### 2. Create a Review

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "rating": 5,
    "comment": "This product is amazing! Highly recommended. The quality exceeded my expectations and delivery was fast."
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "_id": "...",
    "user": {
      "_id": "...",
      "name": "John Doe"
    },
    "product": "507f1f77bcf86cd799439011",
    "rating": 5,
    "comment": "This product is amazing!...",
    "verified": true,
    "helpful": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "stats": {
    "averageRating": 4.8,
    "totalReviews": 15,
    "distribution": { ... }
  }
}
```

**Error Cases:**

**Not Purchased:**

```json
{
  "success": false,
  "message": "You can only review products you have purchased and received"
}
```

**Already Reviewed:**

```json
{
  "success": false,
  "message": "You have already reviewed this product"
}
```

### 3. Get Product Reviews (with Pagination)

```bash
curl -X GET "http://localhost:5000/api/reviews/products/507f1f77bcf86cd799439011/reviews?page=1&limit=5&sortBy=createdAt&order=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "reviews": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "name": "Jane Smith",
        "avatar": "..."
      },
      "rating": 5,
      "comment": "Great product!",
      "verified": true,
      "helpful": 12,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalReviews": 15,
    "limit": 5
  }
}
```

### 4. Get Review Statistics

```bash
curl -X GET http://localhost:5000/api/reviews/products/507f1f77bcf86cd799439011/stats
```

**Expected Response:**

```json
{
  "success": true,
  "stats": {
    "averageRating": 4.3,
    "totalReviews": 15,
    "distribution": {
      "1": 1,
      "2": 0,
      "3": 2,
      "4": 5,
      "5": 7
    }
  }
}
```

### 5. Update a Review

```bash
curl -X PUT http://localhost:5000/api/reviews/60d5ec49f1b2c72b8c8e4f3a \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 4,
    "comment": "Updated my review - still a great product but found a minor issue with the packaging."
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Review updated successfully",
  "review": { ... },
  "stats": { ... }
}
```

### 6. Delete a Review

```bash
curl -X DELETE http://localhost:5000/api/reviews/60d5ec49f1b2c72b8c8e4f3a \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### 7. Mark Review as Helpful

```bash
curl -X POST http://localhost:5000/api/reviews/60d5ec49f1b2c72b8c8e4f3a/helpful \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "helpful": 13
}
```

---

## Postman Collection

You can import this JSON into Postman:

```json
{
  "info": {
    "name": "Wishlist & Reviews API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Wishlist",
      "item": [
        {
          "name": "Toggle Wishlist",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"productId\": \"{{productId}}\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/wishlist/toggle",
              "host": ["{{baseUrl}}"],
              "path": ["wishlist", "toggle"]
            }
          }
        },
        {
          "name": "Get Wishlist",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/wishlist",
              "host": ["{{baseUrl}}"],
              "path": ["wishlist"]
            }
          }
        }
      ]
    },
    {
      "name": "Reviews",
      "item": [
        {
          "name": "Create Review",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"productId\": \"{{productId}}\",\n  \"rating\": 5,\n  \"comment\": \"Great product!\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/reviews",
              "host": ["{{baseUrl}}"],
              "path": ["reviews"]
            }
          }
        },
        {
          "name": "Get Product Reviews",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/reviews/products/{{productId}}/reviews?page=1&limit=10",
              "host": ["{{baseUrl}}"],
              "path": ["reviews", "products", "{{productId}}", "reviews"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN"
    },
    {
      "key": "productId",
      "value": "507f1f77bcf86cd799439011"
    }
  ]
}
```

---

## JavaScript/Axios Examples

### Wishlist

```javascript
// Toggle wishlist
const toggleWishlist = async (productId) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/wishlist/toggle",
      { productId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};

// Get wishlist
const getWishlist = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/wishlist", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};
```

### Reviews

```javascript
// Create review
const createReview = async (productId, rating, comment) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/reviews",
      { productId, rating, comment },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};

// Get reviews
const getReviews = async (productId) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/reviews/products/${productId}/reviews`,
      {
        params: {
          page: 1,
          limit: 10,
          sortBy: "createdAt",
          order: "desc",
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};
```

---

## Test Data Setup

Before testing reviews, create test data:

```javascript
// 1. Create a user
// 2. Create a product
// 3. Create an order with status "Delivered"
// 4. Then test review creation

// MongoDB shell commands:
db.orders.insertOne({
  user: ObjectId("USER_ID"),
  items: [
    {
      product: ObjectId("PRODUCT_ID"),
      quantity: 1,
      price: 99.99,
    },
  ],
  status: "Delivered",
  totalPrice: 99.99,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

---

## Common Error Codes

- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (user not authorized for this action)
- **404**: Not Found (resource doesn't exist)
- **400**: Bad Request (validation error)
- **500**: Internal Server Error (check server logs)

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔒 Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes

---

## 📝 Notes

1. All timestamps are in ISO 8601 format
2. Prices are in INR (Indian Rupees)
3. Razorpay amounts are in paise (multiply by 100)
4. File uploads use `multipart/form-data`
5. All successful responses have `success: true`
6. All error responses have `success: false`

---

**For more information, visit the GitHub repository or contact support.**
