# SQL Schema - RO Service Database

## Database Creation

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS ro_service_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ro_service_db;
```

## Tables

### 1. Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  isActive BOOLEAN DEFAULT true,
  address TEXT,
  profileImage VARCHAR(255),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Orders Table

```sql
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderNumber VARCHAR(50) UNIQUE NOT NULL,
  customerName VARCHAR(100) NOT NULL,
  customerPhone VARCHAR(20) NOT NULL,
  customerEmail VARCHAR(100),
  customerAddress TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  serviceType VARCHAR(100) NOT NULL COMMENT 'e.g., Installation, Repair, Maintenance, Filter Change',
  status ENUM('pending', 'assigned', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  description TEXT,
  scheduledDate DATETIME,
  completedDate DATETIME,
  assignedToId INT,
  assignedById INT,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignedToId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assignedById) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orderNumber (orderNumber),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_assignedToId (assignedToId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Order History Table

```sql
CREATE TABLE IF NOT EXISTS order_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  userId INT,
  action VARCHAR(100) NOT NULL COMMENT 'e.g., Created, Assigned, Status Changed, Completed',
  oldStatus VARCHAR(50),
  newStatus VARCHAR(50),
  description TEXT,
  metadata JSON COMMENT 'Additional data in JSON format',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orderId (orderId),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Sample Data

### Insert Admin User

```sql
-- Note: Password should be hashed using bcrypt in application
-- This is just a structure example
INSERT INTO users (name, email, password, phone, role, isActive)
VALUES 
('Admin User', 'admin@roservice.com', '$2a$10$hashed_password_here', '+1234567890', 'admin', true);
```

### Insert Sample Employees

```sql
INSERT INTO users (name, email, password, phone, role, address)
VALUES 
('John Doe', 'john@roservice.com', '$2a$10$hashed_password', '+1234567891', 'employee', '123 Main St'),
('Jane Smith', 'jane@roservice.com', '$2a$10$hashed_password', '+1234567892', 'employee', '456 Oak Ave'),
('Bob Johnson', 'bob@roservice.com', '$2a$10$hashed_password', '+1234567893', 'employee', '789 Pine Rd');
```

### Insert Sample Orders

```sql
INSERT INTO orders 
(orderNumber, customerName, customerPhone, customerEmail, customerAddress, latitude, longitude, serviceType, status, priority, description, scheduledDate)
VALUES 
('RO17062315001', 'Alice Williams', '+1234567894', 'alice@email.com', '321 Elm Street, City', 40.7128, -74.0060, 'Installation', 'pending', 'high', 'New RO system installation', '2026-02-01 10:00:00'),
('RO17062315002', 'Charlie Brown', '+1234567895', 'charlie@email.com', '654 Maple Drive, Town', 34.0522, -118.2437, 'Repair', 'assigned', 'urgent', 'Leaking pipe repair', '2026-01-28 14:00:00'),
('RO17062315003', 'Diana Prince', '+1234567896', 'diana@email.com', '987 Cedar Lane, Village', 41.8781, -87.6298, 'Maintenance', 'in-progress', 'medium', 'Regular maintenance check', '2026-01-27 09:00:00'),
('RO17062315004', 'Edward Norton', '+1234567897', 'edward@email.com', '147 Birch Court, Suburb', 29.7604, -95.3698, 'Filter Change', 'completed', 'low', 'Filter replacement', '2026-01-25 11:00:00');
```

## Useful Queries

### Get all active employees with order count

```sql
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  COUNT(o.id) as activeOrderCount
FROM users u
LEFT JOIN orders o ON u.id = o.assignedToId AND o.status IN ('assigned', 'in-progress')
WHERE u.role = 'employee' AND u.isActive = true
GROUP BY u.id
ORDER BY activeOrderCount ASC;
```

### Get order statistics

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) as percentage
FROM orders
GROUP BY status;
```

### Get recent order history

```sql
SELECT 
  oh.id,
  oh.action,
  oh.description,
  oh.createdAt,
  o.orderNumber,
  o.customerName,
  u.name as performedBy
FROM order_history oh
JOIN orders o ON oh.orderId = o.id
LEFT JOIN users u ON oh.userId = u.id
ORDER BY oh.createdAt DESC
LIMIT 50;
```

### Get employee performance

```sql
SELECT 
  u.name,
  COUNT(o.id) as totalOrders,
  SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completedOrders,
  ROUND(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.id), 2) as completionRate
FROM users u
LEFT JOIN orders o ON u.id = o.assignedToId
WHERE u.role = 'employee'
GROUP BY u.id
ORDER BY completedOrders DESC;
```

### Get monthly order trends

```sql
SELECT 
  DATE_FORMAT(createdAt, '%Y-%m') as month,
  COUNT(*) as totalOrders,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders
FROM orders
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
ORDER BY month DESC;
```

## Database Maintenance

### Backup Database

```sql
-- Via command line
mysqldump -u username -p ro_service_db > backup_$(date +%Y%m%d).sql
```

### Restore Database

```sql
-- Via command line
mysql -u username -p ro_service_db < backup_file.sql
```

### Optimize Tables

```sql
OPTIMIZE TABLE users, orders, order_history;
```

### Check Table Status

```sql
SHOW TABLE STATUS FROM ro_service_db;
```

## Indexes for Performance

The schema already includes essential indexes. To add more if needed:

```sql
-- Add index for customer search
ALTER TABLE orders ADD INDEX idx_customerName (customerName);

-- Add composite index for order filtering
ALTER TABLE orders ADD INDEX idx_status_priority (status, priority);

-- Add index for date range queries
ALTER TABLE orders ADD INDEX idx_scheduledDate (scheduledDate);
```

## Views (Optional - for complex queries)

### Active Orders View

```sql
CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
  o.*,
  u.name as employeeName,
  u.phone as employeePhone,
  CONCAT(u2.name) as assignedByName
FROM orders o
LEFT JOIN users u ON o.assignedToId = u.id
LEFT JOIN users u2 ON o.assignedById = u2.id
WHERE o.status IN ('pending', 'assigned', 'in-progress');
```

### Dashboard Statistics View

```sql
CREATE OR REPLACE VIEW dashboard_stats_view AS
SELECT 
  (SELECT COUNT(*) FROM orders) as totalOrders,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pendingOrders,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completedOrders,
  (SELECT COUNT(*) FROM orders WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as recentOrders,
  (SELECT COUNT(*) FROM users WHERE role = 'employee' AND isActive = true) as activeEmployees;
```

## Security Considerations

1. **Never store plain text passwords** - Always use bcrypt hashing
2. **Use prepared statements** - Prevent SQL injection
3. **Limit user privileges** - Grant only necessary permissions
4. **Regular backups** - Automated daily backups
5. **Monitor slow queries** - Use EXPLAIN to optimize
6. **Sanitize inputs** - Validate all user inputs before queries

## Connection Pooling Configuration

```javascript
// In database.js
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    pool: {
      max: 10,      // Maximum connections in pool
      min: 0,       // Minimum connections
      acquire: 30000, // Maximum time to get connection
      idle: 10000   // Maximum idle time
    }
  }
);
```

---

**Note:** This schema is automatically created by Sequelize when you run the backend server. The above SQL is provided for reference and manual database setup if needed.
