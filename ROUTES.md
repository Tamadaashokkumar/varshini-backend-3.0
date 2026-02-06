# 📋 Complete API Routes List

All available API endpoints in the Hyundai Spares E-Commerce Backend

---

## 🏥 Health & Info

| Method | Endpoint  | Description       | Auth Required |
| ------ | --------- | ----------------- | ------------- |
| GET    | `/health` | Health check      | No            |
| GET    | `/api`    | API documentation | No            |

---

## 🔐 User Authentication (`/api/auth`)

| Method | Endpoint              | Description          | Auth Required |
| ------ | --------------------- | -------------------- | ------------- |
| POST   | `/register`           | Register new user    | No            |
| POST   | `/login`              | User login           | No            |
| POST   | `/refresh-token`      | Refresh access token | No            |
| GET    | `/profile`            | Get user profile     | Customer      |
| PUT    | `/profile`            | Update user profile  | Customer      |
| PUT    | `/change-password`    | Change password      | Customer      |
| POST   | `/address`            | Add new address      | Customer      |
| PUT    | `/address/:addressId` | Update address       | Customer      |
| DELETE | `/address/:addressId` | Delete address       | Customer      |
| POST   | `/logout`             | Logout user          | Customer      |

---

## 👔 Admin Authentication (`/api/admin/auth`)

| Method | Endpoint           | Description          | Auth Required |
| ------ | ------------------ | -------------------- | ------------- |
| POST   | `/login`           | Admin login          | No            |
| POST   | `/refresh-token`   | Refresh access token | No            |
| GET    | `/profile`         | Get admin profile    | Admin         |
| PUT    | `/profile`         | Update admin profile | Admin         |
| PUT    | `/change-password` | Change password      | Admin         |
| POST   | `/logout`          | Logout admin         | Admin         |

---

## 📦 Products (`/api/products`)

| Method | Endpoint               | Description                  | Auth Required |
| ------ | ---------------------- | ---------------------------- | ------------- |
| GET    | `/`                    | Get all products             | No            |
| GET    | `/featured`            | Get featured products        | No            |
| GET    | `/category/:category`  | Get products by category     | No            |
| GET    | `/low-stock`           | Get low stock products       | Admin         |
| GET    | `/:id`                 | Get product by ID            | No            |
| POST   | `/`                    | Create product               | Admin         |
| PUT    | `/:id`                 | Update product               | Admin         |
| PATCH  | `/:id/stock`           | Update product stock         | Admin         |
| DELETE | `/:id`                 | Delete product (soft delete) | Admin         |
| DELETE | `/:id/images/:imageId` | Delete product image         | Admin         |

---

## 🛒 Cart (`/api/cart`)

| Method | Endpoint          | Description               | Auth Required |
| ------ | ----------------- | ------------------------- | ------------- |
| GET    | `/`               | Get user cart             | Customer      |
| POST   | `/add`            | Add item to cart          | Customer      |
| PUT    | `/update/:itemId` | Update cart item quantity | Customer      |
| DELETE | `/remove/:itemId` | Remove item from cart     | Customer      |
| DELETE | `/clear`          | Clear cart                | Customer      |
| POST   | `/sync`           | Sync cart prices          | Customer      |

---

## 📋 Orders (`/api/orders`)

| Method | Endpoint       | Description            | Auth Required  |
| ------ | -------------- | ---------------------- | -------------- |
| POST   | `/`            | Create order           | Customer       |
| GET    | `/`            | Get user orders        | Customer       |
| GET    | `/admin/all`   | Get all orders         | Admin          |
| GET    | `/:id`         | Get order by ID        | Customer/Admin |
| GET    | `/:id/invoice` | Download order invoice | Customer/Admin |
| PUT    | `/:id/cancel`  | Cancel order           | Customer       |
| PUT    | `/:id/status`  | Update order status    | Admin          |

---

## 💳 Payments (`/api/payments`)

| Method | Endpoint                   | Description              | Auth Required  |
| ------ | -------------------------- | ------------------------ | -------------- |
| POST   | `/create-razorpay-order`   | Create Razorpay order    | Customer       |
| POST   | `/verify-razorpay-payment` | Verify Razorpay payment  | Customer       |
| POST   | `/payment-failed`          | Handle payment failure   | Customer       |
| GET    | `/:orderId`                | Get payment details      | Customer/Admin |
| GET    | `/user/history`            | Get user payment history | Customer       |
| GET    | `/admin/all`               | Get all payments         | Admin          |

---

## 📊 Dashboard - Admin Only (`/api/dashboard`)

| Method | Endpoint                | Description                 | Auth Required |
| ------ | ----------------------- | --------------------------- | ------------- |
| GET    | `/stats`                | Get dashboard statistics    | Admin         |
| GET    | `/revenue/monthly`      | Get monthly revenue         | Admin         |
| GET    | `/revenue/daily`        | Get daily revenue (30 days) | Admin         |
| GET    | `/orders/recent`        | Get recent orders           | Admin         |
| GET    | `/products/low-stock`   | Get low stock products      | Admin         |
| GET    | `/products/top-selling` | Get top selling products    | Admin         |
| GET    | `/sales/by-category`    | Get sales by category       | Admin         |
| GET    | `/customers/growth`     | Get customer growth         | Admin         |
| GET    | `/payments/methods`     | Get payment method stats    | Admin         |

---

## 📈 Total Routes Summary

| Category      | Public Routes | Customer Routes | Admin Routes | Total  |
| ------------- | ------------- | --------------- | ------------ | ------ |
| Health & Info | 2             | 0               | 0            | 2      |
| User Auth     | 3             | 7               | 0            | 10     |
| Admin Auth    | 2             | 0               | 4            | 6      |
| Products      | 4             | 0               | 6            | 10     |
| Cart          | 0             | 6               | 0            | 6      |
| Orders        | 0             | 5               | 2            | 7      |
| Payments      | 0             | 5               | 1            | 6      |
| Dashboard     | 0             | 0               | 9            | 9      |
| **Total**     | **11**        | **23**          | **22**       | **56** |

---

## 🔒 Authentication Requirements

### Public Routes (11 total)

No authentication required. Open to all users.

### Customer Routes (23 total)

Requires JWT token from customer login.
Header: `Authorization: Bearer <customer-token>`

### Admin Routes (22 total)

Requires JWT token from admin login.
Header: `Authorization: Bearer <admin-token>`

---

## 📝 Request Methods Summary

| Method    | Count  | Usage              |
| --------- | ------ | ------------------ |
| GET       | 26     | Retrieve data      |
| POST      | 14     | Create/Submit data |
| PUT       | 8      | Update data        |
| PATCH     | 1      | Partial update     |
| DELETE    | 7      | Delete data        |
| **Total** | **56** |                    |

---

## 🔌 Socket.io Events

### Server → Client Events

#### Customer Events

- `connected` - Connection established
- `order_placed` - New order placed
- `order_status_updated` - Order status changed
- `payment_success` - Payment successful
- `payment_failed` - Payment failed
- `order_cancelled` - Order cancelled

#### Admin Events

- `connected` - Connection established
- `new_order` - New order received
- `order_cancelled` - Order cancelled by customer
- `dashboard_update_requested` - Dashboard data requested

### Client → Server Events

- `join_order_room` - Join specific order room
- `leave_order_room` - Leave specific order room
- `request_dashboard_update` - Request dashboard update (Admin)

---

## 📦 Request/Response Format

### Standard Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🎯 Quick Reference by Role

### For Frontend Developers

**Customer Features:**

- Register/Login: `/api/auth/register`, `/api/auth/login`
- Browse Products: `/api/products`
- Cart: `/api/cart/*`
- Checkout: `/api/orders`
- Payment: `/api/payments/*`

**Admin Features:**

- Login: `/api/admin/auth/login`
- Dashboard: `/api/dashboard/*`
- Manage Products: `/api/products/*`
- Manage Orders: `/api/orders/admin/*`

### For Testing

**Postman Collection:**
Import these base URLs:

- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

**Authentication:**

1. Login to get token
2. Add token to Authorization header
3. Use Bearer token format

---

## 🔄 API Versioning

Current Version: **v1**

All routes are under `/api` path.

Future versions will use:

- v2: `/api/v2`
- v3: `/api/v3`

---

## 📞 Support

For API questions or issues:

- Documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- GitHub Issues: [Repository](https://github.com/yourusername/hyundai-spares-backend/issues)
- Email: support@hyundaispares.com

---

**Last Updated:** December 19, 2024
