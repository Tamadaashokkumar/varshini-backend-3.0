# 🚗 Hyundai Spares E-Commerce Backend

A complete, production-ready backend for a real-time Hyundai spare parts e-commerce platform built with Node.js, Express.js, MongoDB, Socket.io, Razorpay, and Cloudinary.

## 🚀 Features

### 🔐 Authentication & Authorization

- JWT-based authentication (Access + Refresh tokens)
- Role-based access control (Admin & Customer)
- Secure password hashing with bcrypt
- Token refresh mechanism
- Protected routes with middleware

### 📦 Product Management

- Complete CRUD operations for products
- Multiple image upload with Cloudinary
- Categories: Engine, Brake, Electrical, Body, Accessories, etc.
- Hyundai model compatibility tracking
- Stock management with auto-status updates
- Low stock alerts
- Soft delete functionality

### 🛒 Shopping Cart

- Add/Update/Remove items
- Automatic price calculations
- GST calculation (18%)
- Shipping charges (Free above ₹5000)
- Stock validation
- Cart synchronization

### 📋 Order Management

- Place orders (COD & Razorpay)
- Order status tracking (Placed → Packed → Shipped → Delivered)
- Order cancellation
- Stock reduction on order placement
- Order history
- Admin order management

### 💳 Payment Integration

- Razorpay payment gateway integration
- Payment verification with signature validation
- COD support
- Payment status tracking
- Payment history

### 📄 Invoice System

- Automatic PDF invoice generation
- GST invoice format
- Invoice download API
- Professional invoice template

### 📊 Admin Dashboard

- Real-time statistics
- Revenue analytics (Daily/Monthly)
- Order management
- Product management
- Low stock alerts
- Customer analytics
- Sales by category

### 🔔 Real-Time Features (Socket.io)

- Live order status updates
- New order notifications to admin
- Payment status notifications
- JWT-based socket authentication
- User-specific and admin broadcast rooms

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Cloudinary account
- Razorpay account (for payment gateway)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd hyundai-spares-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/hyundai_spares

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_token_key
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Admin Credentials
ADMIN_EMAIL=admin@hyundaispares.com
ADMIN_PASSWORD=Admin@12345
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# For MongoDB Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the application

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
hyundai-spares-backend/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── cloudinary.js         # Cloudinary configuration
│   └── razorpay.js          # Razorpay configuration
├── controllers/
│   ├── authController.js     # User authentication
│   ├── adminAuthController.js # Admin authentication
│   ├── productController.js  # Product management
│   ├── cartController.js     # Cart operations
│   ├── orderController.js    # Order management
│   ├── paymentController.js  # Payment processing
│   └── dashboardController.js # Admin analytics
├── middlewares/
│   ├── auth.js              # JWT authentication
│   └── validate.js          # Input validation
├── models/
│   ├── Admin.js             # Admin schema
│   ├── User.js              # User schema
│   ├── Product.js           # Product schema
│   ├── Cart.js              # Cart schema
│   ├── Order.js             # Order schema
│   ├── Payment.js           # Payment schema
│   └── Notification.js      # Notification schema
├── routes/
│   ├── authRoutes.js        # User auth routes
│   ├── adminAuthRoutes.js   # Admin auth routes
│   ├── productRoutes.js     # Product routes
│   ├── cartRoutes.js        # Cart routes
│   ├── orderRoutes.js       # Order routes
│   ├── paymentRoutes.js     # Payment routes
│   └── dashboardRoutes.js   # Dashboard routes
├── sockets/
│   └── socketHandler.js     # Socket.io configuration
├── utils/
│   ├── errorHandler.js      # Error handling
│   ├── jwt.js               # JWT utilities
│   ├── response.js          # Response formatter
│   └── invoiceGenerator.js  # PDF invoice generator
├── invoices/                # Generated invoices (auto-created)
├── app.js                   # Express app configuration
├── server.js                # Server entry point
├── package.json
└── .env.example
```

## 🔑 Default Admin Credentials

After first run, a default admin account is created:

- **Email:** admin@hyundaispares.com
- **Password:** Admin@12345

⚠️ **Important:** Change the password immediately after first login!

## 📡 API Endpoints

### Authentication (User)

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/refresh-token     - Refresh access token
GET    /api/auth/profile           - Get user profile
PUT    /api/auth/profile           - Update user profile
PUT    /api/auth/change-password   - Change password
POST   /api/auth/address           - Add new address
PUT    /api/auth/address/:id       - Update address
DELETE /api/auth/address/:id       - Delete address
POST   /api/auth/logout            - Logout user
```

### Authentication (Admin)

```
POST   /api/admin/auth/login              - Admin login
POST   /api/admin/auth/refresh-token      - Refresh access token
GET    /api/admin/auth/profile            - Get admin profile
PUT    /api/admin/auth/profile            - Update admin profile
PUT    /api/admin/auth/change-password    - Change password
POST   /api/admin/auth/logout             - Logout admin
```

### Products

```
GET    /api/products                      - Get all products (with filters)
GET    /api/products/:id                  - Get product by ID
GET    /api/products/featured             - Get featured products
GET    /api/products/category/:category   - Get products by category
POST   /api/products                      - Create product (Admin)
PUT    /api/products/:id                  - Update product (Admin)
PATCH  /api/products/:id/stock            - Update stock (Admin)
DELETE /api/products/:id                  - Delete product (Admin)
DELETE /api/products/:id/images/:imageId  - Delete product image (Admin)
GET    /api/products/low-stock            - Get low stock products (Admin)
```

### Cart

```
GET    /api/cart                   - Get user cart
POST   /api/cart/add               - Add item to cart
PUT    /api/cart/update/:itemId    - Update cart item
DELETE /api/cart/remove/:itemId    - Remove item from cart
DELETE /api/cart/clear             - Clear cart
POST   /api/cart/sync              - Sync cart
```

### Orders

```
POST   /api/orders                 - Create order
GET    /api/orders                 - Get user orders
GET    /api/orders/:id             - Get order by ID
GET    /api/orders/:id/invoice     - Download invoice
PUT    /api/orders/:id/cancel      - Cancel order
GET    /api/orders/admin/all       - Get all orders (Admin)
PUT    /api/orders/:id/status      - Update order status (Admin)
```

### Payments

```
POST   /api/payments/create-razorpay-order     - Create Razorpay order
POST   /api/payments/verify-razorpay-payment   - Verify payment
POST   /api/payments/payment-failed            - Handle payment failure
GET    /api/payments/:orderId                  - Get payment details
GET    /api/payments/user/history              - Get payment history
GET    /api/payments/admin/all                 - Get all payments (Admin)
```

### Dashboard (Admin Only)

```
GET    /api/dashboard/stats                - Get dashboard statistics
GET    /api/dashboard/revenue/monthly      - Get monthly revenue
GET    /api/dashboard/revenue/daily        - Get daily revenue
GET    /api/dashboard/orders/recent        - Get recent orders
GET    /api/dashboard/products/low-stock   - Get low stock products
GET    /api/dashboard/products/top-selling - Get top selling products
GET    /api/dashboard/sales/by-category    - Get sales by category
GET    /api/dashboard/customers/growth     - Get customer growth
GET    /api/dashboard/payments/methods     - Get payment method stats
```

## 🔌 Socket.io Events

### Client → Server

```javascript
// Authentication (via handshake)
socket.auth = { token: "your-jwt-token" };

// Join order room
socket.emit("join_order_room", orderId);

// Leave order room
socket.emit("leave_order_room", orderId);
```

### Server → Client

```javascript
// Connection success
socket.on("connected", (data) => {});

// Order placed
socket.on("order_placed", (data) => {});

// Order status updated
socket.on("order_status_updated", (data) => {});

// Payment success
socket.on("payment_success", (data) => {});

// Payment failed
socket.on("payment_failed", (data) => {});

// New order (Admin only)
socket.on("new_order", (data) => {});
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent brute force attacks
- **MongoDB Sanitization** - Prevent NoSQL injection
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Input Validation** - Express-validator
- **Error Handling** - Centralized error management

## 📊 Database Models

### User

- Personal information
- Multiple addresses
- Authentication credentials
- Role-based access

### Product

- Product details
- Multiple images
- Stock management
- Category & compatibility
- Pricing & discounts

### Order

- Order items
- Shipping address
- Payment details
- Status tracking
- Invoice information

### Payment

- Payment method
- Razorpay details
- Transaction status
- Amount & currency

## 🧪 Testing

Test the API using tools like:

- Postman
- Thunder Client (VS Code)
- Insomnia
- cURL

Import the API endpoints and test with proper authentication headers.

## 🚀 Deployment

### Environment Variables

Set all required environment variables in your hosting platform.

### MongoDB

- Use MongoDB Atlas for production
- Enable IP whitelist
- Create database user

### Cloudinary

- Sign up for free account
- Get API credentials from dashboard

### Razorpay

- Create account and verify business
- Generate API keys from dashboard
- Test with test mode first

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Hyundai Spares Backend Team

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

For support, email support@hyundaispares.com

---

**Happy Coding! 🚀**
