# ⚡ Quick Start Guide

Get your Hyundai Spares Backend running in 5 minutes!

---

## 📋 Prerequisites

Before you begin, make sure you have:
- ✅ Node.js v16+ installed
- ✅ MongoDB installed (or MongoDB Atlas account)
- ✅ Cloudinary account (free tier works)
- ✅ Razorpay account (test mode is fine)

---

## 🚀 Step 1: Installation (2 minutes)

```bash
# Navigate to project directory
cd hyundai-spares-backend

# Install all dependencies
npm install
```

**What gets installed:**
- Express.js, MongoDB, Socket.io
- JWT, Bcrypt, Razorpay, Cloudinary
- PDFKit, and all other dependencies

---

## ⚙️ Step 2: Environment Setup (2 minutes)

### Create your .env file:
```bash
cp .env.example .env
```

### Edit .env with your credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB - Choose one:
# Option 1: Local MongoDB
MONGO_URI=mongodb://localhost:27017/hyundai_spares

# Option 2: MongoDB Atlas (Recommended)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hyundai_spares

# JWT Secrets (Generate random strings)
JWT_ACCESS_SECRET=your_super_secret_key_here_change_me
JWT_REFRESH_SECRET=your_another_secret_key_here_change_me
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Cloudinary (Get from dashboard.cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Admin Credentials (Change after first login!)
ADMIN_EMAIL=admin@hyundaispares.com
ADMIN_PASSWORD=Admin@12345
```

---

## 🎯 Step 3: Start Server (30 seconds)

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

**You should see:**
```
✅ MongoDB Connected: localhost
✅ Default admin account created:
   Email: admin@hyundaispares.com
   Password: Admin@12345
   ⚠️  Please change the password after first login!
✅ Socket.io initialized

═══════════════════════════════════════════════════════
🚀 Server running in development mode
📡 Server listening on port 5000
🌐 API Base URL: http://localhost:5000
📚 API Documentation: http://localhost:5000/api
💓 Health Check: http://localhost:5000/health
═══════════════════════════════════════════════════════
```

---

## ✅ Step 4: Test the API (1 minute)

### 1. Health Check
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-12-19T..."
}
```

### 2. Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hyundaispares.com",
    "password": "Admin@12345"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Products (Public endpoint)
```bash
curl http://localhost:5000/api/products
```

---

## 🧪 Testing with Postman

### Import Collection

Create a new Postman collection with these settings:

**Base URL Variable:**
```
{{baseUrl}} = http://localhost:5000/api
```

**Auth Token Variable:**
```
{{token}} = <paste-your-token-here>
```

### Test Flow:

1. **Admin Login**
   - POST `{{baseUrl}}/admin/auth/login`
   - Copy `accessToken` to `{{token}}`

2. **Create Product**
   - POST `{{baseUrl}}/products`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: form-data with product details

3. **Register User**
   - POST `{{baseUrl}}/auth/register`

4. **User Login**
   - POST `{{baseUrl}}/auth/login`
   - Copy `accessToken`

5. **Add to Cart**
   - POST `{{baseUrl}}/cart/add`
   - Headers: `Authorization: Bearer {{token}}`

6. **Create Order**
   - POST `{{baseUrl}}/orders`

---

## 🔧 Common Setup Issues

### Issue 1: MongoDB Connection Failed
**Error:** `MongooseServerSelectionError`

**Solutions:**
- Check if MongoDB is running: `mongosh`
- Verify connection string in `.env`
- For Atlas: Check IP whitelist

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3000
```

### Issue 3: Cloudinary Upload Failed
**Error:** `Invalid cloud_name`

**Solutions:**
- Verify credentials in `.env`
- Check Cloudinary dashboard
- Ensure no extra spaces in values

### Issue 4: Module Not Found
**Error:** `Cannot find module`

**Solutions:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Connect Frontend

### React/Next.js Example:

```javascript
// api/config.js
const API_BASE_URL = 'http://localhost:5000/api';

export default API_BASE_URL;
```

```javascript
// api/auth.js
import API_BASE_URL from './config';

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  return response.json();
};
```

### Socket.io Connection:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

socket.on('connected', (data) => {
  console.log('Connected to real-time server', data);
});

socket.on('order_placed', (data) => {
  console.log('New order:', data);
});
```

---

## 📊 API Testing Checklist

### Authentication ✅
- [ ] Register new user
- [ ] Login user
- [ ] Get profile
- [ ] Update profile
- [ ] Change password
- [ ] Add address
- [ ] Admin login

### Products ✅
- [ ] Create product with images
- [ ] Get all products
- [ ] Get product by ID
- [ ] Update product
- [ ] Update stock
- [ ] Get featured products

### Cart ✅
- [ ] Add to cart
- [ ] Get cart
- [ ] Update quantity
- [ ] Remove item
- [ ] Clear cart

### Orders ✅
- [ ] Create order
- [ ] Get user orders
- [ ] Get order by ID
- [ ] Download invoice
- [ ] Cancel order

### Payments ✅
- [ ] Create Razorpay order
- [ ] Verify payment
- [ ] Get payment history

### Dashboard (Admin) ✅
- [ ] Get statistics
- [ ] Get monthly revenue
- [ ] Get recent orders
- [ ] Get low stock products

---

## 🎓 Learning Resources

### Explore the Code:
1. **Start here:** `server.js` - Server entry point
2. **Then:** `app.js` - Express configuration
3. **Next:** `routes/` - See all API routes
4. **Finally:** `controllers/` - Business logic

### Read Documentation:
1. `README.md` - Complete guide
2. `API_DOCUMENTATION.md` - All endpoints
3. `ROUTES.md` - Quick routes reference
4. `DEPLOYMENT.md` - Deploy to production

---

## 🚀 Deploy to Production

### Quick Deploy Options:

**1. Heroku (Easiest)**
```bash
heroku create hyundai-spares
heroku config:set MONGO_URI=... CLOUDINARY_CLOUD_NAME=...
git push heroku main
```

**2. DigitalOcean**
- Create new App
- Connect GitHub
- Add environment variables
- Deploy

**3. AWS EC2**
- Launch Ubuntu instance
- Install Node.js
- Clone repository
- Run with PM2

See `DEPLOYMENT.md` for detailed instructions.

---

## 🎉 You're All Set!

Your Hyundai Spares Backend is now running!

### What's Working:
✅ 56 API endpoints
✅ Real-time notifications
✅ Payment processing
✅ Invoice generation
✅ Admin dashboard
✅ Complete authentication

### Next Steps:
1. Change admin password
2. Create some test products
3. Test the order flow
4. Build your frontend
5. Deploy to production

---

## 📞 Need Help?

- 📖 Check `API_DOCUMENTATION.md` for detailed API reference
- 🚀 Check `DEPLOYMENT.md` for deployment help
- 📋 Check `ROUTES.md` for quick routes reference
- 💬 Open an issue on GitHub

---

**Happy Coding! 🚀**

---

## 🎯 5-Minute Test Script

Run this complete test:

```bash
# 1. Health check
curl http://localhost:5000/health

# 2. Admin login
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hyundaispares.com","password":"Admin@12345"}'

# 3. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "password":"password123",
    "phone":"9876543210"
  }'

# 4. Get products
curl http://localhost:5000/api/products

# 5. Get dashboard stats (with admin token)
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

If all 5 tests pass, your backend is working perfectly! 🎉
