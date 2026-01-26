# API Testing Collection

## Base URL
```
Local: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

---

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "admin@roservice.com",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@roservice.com",
    "phone": "+1234567890",
    "role": "admin"
  }
}
```

### 2. Register User (Admin Only)
**POST** `/auth/register`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@roservice.com",
  "password": "Password123",
  "phone": "+1234567891",
  "role": "employee",
  "address": "123 Main Street"
}
```

### 3. Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

### 4. Update Password
**PUT** `/auth/updatepassword`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

---

## User Management Endpoints (Admin Only)

### 1. Get All Users
**GET** `/users`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `role` (optional): `admin` | `employee`
- `isActive` (optional): `true` | `false`

**Example:**
```
GET /users?role=employee&isActive=true
```

### 2. Get User by ID
**GET** `/users/:id`

**Headers:**
```
Authorization: Bearer {token}
```

### 3. Update User
**PUT** `/users/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@email.com",
  "phone": "+9876543210",
  "address": "New Address",
  "isActive": true
}
```

### 4. Delete User
**DELETE** `/users/:id`

**Headers:**
```
Authorization: Bearer {token}
```

### 5. Get Available Employees
**GET** `/users/employees/available`

**Headers:**
```
Authorization: Bearer {token}
```

---

## Order Management Endpoints

### 1. Get All Orders
**GET** `/orders`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: `pending` | `assigned` | `in-progress` | `completed` | `cancelled`
- `priority`: `low` | `medium` | `high` | `urgent`
- `assignedToId`: Employee ID
- `startDate`: ISO date string
- `endDate`: ISO date string

**Example:**
```
GET /orders?status=pending&priority=high
```

### 2. Get Order by ID
**GET** `/orders/:id`

**Headers:**
```
Authorization: Bearer {token}
```

### 3. Create Order (Admin Only)
**POST** `/orders`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "customerName": "Alice Williams",
  "customerPhone": "+1234567894",
  "customerEmail": "alice@email.com",
  "customerAddress": "321 Elm Street, City, State 12345",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "serviceType": "Installation",
  "priority": "high",
  "description": "New RO system installation required",
  "scheduledDate": "2026-02-01T10:00:00.000Z"
}
```

### 4. Update Order (Admin Only)
**PUT** `/orders/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "customerName": "Updated Name",
  "priority": "urgent",
  "description": "Updated description",
  "notes": "Additional notes"
}
```

### 5. Assign Order to Employee (Admin Only)
**PUT** `/orders/:id/assign`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "employeeId": 2
}
```

### 6. Update Order Status
**PUT** `/orders/:id/status`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "status": "completed",
  "notes": "Work completed successfully"
}
```

**Status Options:**
- `pending`
- `assigned`
- `in-progress`
- `completed`
- `cancelled`

### 7. Delete Order (Admin Only)
**DELETE** `/orders/:id`

**Headers:**
```
Authorization: Bearer {token}
```

### 8. Get Order History
**GET** `/orders/:id/history`

**Headers:**
```
Authorization: Bearer {token}
```

### 9. Get Dashboard Statistics (Admin Only)
**GET** `/orders/dashboard/stats`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "ordersByStatus": [
      { "status": "pending", "count": 20 },
      { "status": "assigned", "count": 30 },
      { "status": "in-progress", "count": 25 },
      { "status": "completed", "count": 70 },
      { "status": "cancelled", "count": 5 }
    ],
    "ordersByPriority": [
      { "priority": "low", "count": 40 },
      { "priority": "medium", "count": 60 },
      { "priority": "high", "count": 35 },
      { "priority": "urgent", "count": 15 }
    ],
    "recentOrders": 15,
    "completedThisMonth": 25,
    "activeEmployees": 8,
    "busiestEmployees": [...]
  }
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'employee' is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@roservice.com",
    "password": "Admin@123"
  }'
```

### Create Order Example
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+1234567890",
    "customerAddress": "123 Test St",
    "serviceType": "Installation",
    "priority": "medium"
  }'
```

### Get Orders Example
```bash
curl -X GET "http://localhost:5000/api/orders?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Postman Collection

Import this into Postman for easier testing:

```json
{
  "info": {
    "name": "RO Service API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Save your token after login and use `{{token}}` in Authorization headers.

---

## Rate Limiting (if implemented)

- 100 requests per 15 minutes per IP
- After limit: 429 Too Many Requests

---

## WebSocket Events (Future Enhancement)

For real-time updates:
- `order:created`
- `order:assigned`
- `order:statusChanged`
- `order:completed`
