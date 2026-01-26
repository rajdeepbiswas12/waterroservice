#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  RO Service - MySQL Database Setup                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if MySQL is running
if ! sudo systemctl is-active --quiet mysql; then
    echo "❌ MySQL is not running. Starting MySQL..."
    sudo systemctl start mysql
    sleep 2
fi

echo "Setting up MySQL database..."
echo ""
echo "You may be prompted for your system password (sudo)."
echo ""

# Try to create database and user
sudo mysql << 'SQL'
CREATE DATABASE IF NOT EXISTS ro_service_db;
CREATE USER IF NOT EXISTS 'ro_admin'@'localhost' IDENTIFIED BY 'RoService@2024';
GRANT ALL PRIVILEGES ON ro_service_db.* TO 'ro_admin'@'localhost';
FLUSH PRIVILEGES;

-- Show status
SELECT '✅ Database created successfully!' AS Status;
SHOW DATABASES LIKE 'ro_service_db';
SELECT User, Host FROM mysql.user WHERE User='ro_admin';
SQL

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "Testing database connection..."
    echo "═══════════════════════════════════════════════════════════"
    
    mysql -u ro_admin -p'RoService@2024' ro_service_db -e "SELECT '✅ Connection test successful!' AS Status, DATABASE() AS CurrentDatabase;"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "╔═══════════════════════════════════════════════════════════╗"
        echo "║  ✅ MySQL Database Setup Complete!                        ║"
        echo "╚═══════════════════════════════════════════════════════════╝"
        echo ""
        echo "Database Details:"
        echo "  • Database Name: ro_service_db"
        echo "  • Username: ro_admin"
        echo "  • Password: RoService@2024"
        echo "  • Host: localhost"
        echo "  • Port: 3306"
        echo ""
        echo "Next steps:"
        echo "  1. Start the backend server:"
        echo "     cd backend && npm run dev"
        echo ""
        echo "  2. In a new terminal, start the frontend:"
        echo "     cd frontend && ng serve"
        echo ""
        echo "  3. Access the application:"
        echo "     http://localhost:4200"
        echo ""
    else
        echo ""
        echo "❌ Connection test failed!"
        echo ""
        echo "Please check:"
        echo "  1. MySQL is running: sudo systemctl status mysql"
        echo "  2. User was created properly"
        echo "  3. Password is correct: RoService@2024"
        echo ""
        echo "Try manual connection:"
        echo "  mysql -u ro_admin -p'RoService@2024' ro_service_db"
    fi
else
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  ❌ Failed to create database                             ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "This might be because:"
    echo "  1. MySQL requires a password for root access"
    echo "  2. You don't have sudo privileges"
    echo "  3. MySQL is not installed or not running"
    echo ""
    echo "Please try manual setup:"
    echo "  1. Run: sudo mysql"
    echo "  2. Then execute these commands:"
    echo ""
    echo "     CREATE DATABASE IF NOT EXISTS ro_service_db;"
    echo "     CREATE USER IF NOT EXISTS 'ro_admin'@'localhost' IDENTIFIED BY 'RoService@2024';"
    echo "     GRANT ALL PRIVILEGES ON ro_service_db.* TO 'ro_admin'@'localhost';"
    echo "     FLUSH PRIVILEGES;"
    echo "     EXIT;"
    echo ""
    echo "For detailed instructions, see: mysql-setup-guide.md"
fi
