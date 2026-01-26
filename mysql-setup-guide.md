# MySQL Setup Guide for RO Service Application

## Option 1: Manual MySQL Setup (Recommended)

### Step 1: Access MySQL as root
Try one of these commands to access MySQL:
```bash
# Try with sudo
sudo mysql

# OR if you know the root password
mysql -u root -p
```

### Step 2: Once in MySQL console, run these commands:
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS ro_service_db;

-- Create user with password
CREATE USER IF NOT EXISTS 'ro_admin'@'localhost' IDENTIFIED BY 'RoService@2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON ro_service_db.* TO 'ro_admin'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User='ro_admin';

-- Exit MySQL
EXIT;
```

### Step 3: Test the connection
```bash
mysql -u ro_admin -p'RoService@2024' ro_service_db -e "SELECT 'Connection successful!' AS Status;"
```

---

## Option 2: Quick Setup Script

Save this as a file and run it:

```bash
# Create script
cat > setup-mysql.sh << 'SCRIPT'
#!/bin/bash
echo "=== MySQL Setup for RO Service ==="
echo ""
echo "This script will set up the MySQL database."
echo "You may need to enter your system sudo password and/or MySQL root password."
echo ""

# Try to run MySQL commands
sudo mysql << 'SQL'
CREATE DATABASE IF NOT EXISTS ro_service_db;
CREATE USER IF NOT EXISTS 'ro_admin'@'localhost' IDENTIFIED BY 'RoService@2024';
GRANT ALL PRIVILEGES ON ro_service_db.* TO 'ro_admin'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database created successfully!' AS Status;
SQL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ MySQL database setup complete!"
    echo ""
    echo "Testing connection..."
    mysql -u ro_admin -p'RoService@2024' ro_service_db -e "SELECT 'Connection test successful!' AS Status;"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Everything is ready! You can now start the backend server."
    else
        echo "❌ Connection test failed. Please check the credentials."
    fi
else
    echo ""
    echo "❌ Failed to create database. Please try manual setup."
    echo ""
    echo "Run: sudo mysql"
    echo "Then execute the SQL commands from Option 1 above."
fi
SCRIPT

# Make it executable
chmod +x setup-mysql.sh

# Run it
./setup-mysql.sh
```

---

## Option 3: Reset MySQL Root Password (If needed)

If you can't access MySQL at all:

### For MySQL 8.0+:
```bash
# Stop MySQL
sudo systemctl stop mysql

# Start MySQL in safe mode
sudo mysqld_safe --skip-grant-tables &

# Access MySQL (in another terminal)
mysql -u root

# In MySQL console:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
EXIT;

# Kill safe mode
sudo pkill mysqld

# Start MySQL normally
sudo systemctl start mysql

# Now you can access with: mysql -u root -p
```

---

## Option 4: Use Different Database User

If you have another MySQL user (like your system user), update the `.env` file:

```bash
# backend/.env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=ro_service_db
DB_PORT=3306
```

---

## After MySQL is Set Up

1. **Verify the .env file** in `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=ro_admin
   DB_PASSWORD=RoService@2024
   DB_NAME=ro_service_db
   DB_PORT=3306
   ```

2. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

3. **You should see**:
   ```
   MySQL Database connected successfully
   Database synchronized
   ```

4. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   ng serve
   ```

5. **Access the application**:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5000

---

## Troubleshooting

### Error: "Access denied for user"
- Double-check the credentials in `.env`
- Verify the user exists: `mysql -u ro_admin -p'RoService@2024'`
- Recreate the user if needed

### Error: "Cannot connect to MySQL server"
- Check if MySQL is running: `sudo systemctl status mysql`
- Start MySQL: `sudo systemctl start mysql`

### Error: "Database does not exist"
- Create it manually: `mysql -u ro_admin -p'RoService@2024' -e "CREATE DATABASE ro_service_db;"`

---

## Quick Commands Reference

```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql

# Access MySQL as root with sudo
sudo mysql

# Access MySQL with user and password
mysql -u ro_admin -p'RoService@2024'

# Test database connection
mysql -u ro_admin -p'RoService@2024' ro_service_db -e "SELECT 1;"
```
