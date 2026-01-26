# 🌊 RO Service Tracking & Management System

A comprehensive full-stack web application for managing RO (Reverse Osmosis) water service orders, employee assignments, order tracking, and real-time WhatsApp notifications.

![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript)

---

## ✨ Features

### 👨‍💼 Admin Portal
- ✅ **Secure Authentication** - JWT-based login system
- ✅ **Admin Role Management** - Add/delete admin users
- ✅ **Employee Management** - Complete CRUD operations for service employees
- ✅ **Order Creation** - Create orders with customer details and Google Maps integration
- ✅ **Order Assignment** - Manually assign orders to available employees
- ✅ **Order Tracking** - Complete order status history and timeline
- ✅ **Pictorial Dashboard** - Beautiful charts and statistics visualization
- ✅ **WhatsApp Integration** - Automated notifications for order assignments

### 👷 Employee Portal
- ✅ **Employee Login** - Dedicated employee authentication
- ✅ **Assigned Orders** - View all assigned orders
- ✅ **Order History** - Complete order timeline and status updates
- ✅ **WhatsApp Notifications** - Receive instant order assignment alerts

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 17 (Standalone Components) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8.0+ |
| **ORM** | Sequelize |
| **Authentication** | JWT (JSON Web Tokens) |
| **Maps** | Google Maps JavaScript API |
| **Notifications** | Twilio WhatsApp API |
| **UI Framework** | Angular Material |
| **Charts** | Chart.js |
| **Styling** | SCSS + Custom CSS |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **MySQL** v8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **Angular CLI** - `npm install -g @angular/cli`
- **Git** ([Download](https://git-scm.com/))
- **Google Maps API Key** ([Get Key](https://developers.google.com/maps/documentation/javascript/get-api-key))
- **Twilio Account** for WhatsApp ([Sign Up](https://www.twilio.com/))

---

## 🚀 Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone <your-repository-url>
cd waterroservice
```

### 2️⃣ Database Setup (MySQL)

#### Option A: Local MySQL Installation

1. **Install MySQL** (if not already installed)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS (using Homebrew)
brew install mysql

# Windows
# Download installer from https://dev.mysql.com/downloads/installer/
```

2. **Start MySQL Service**
```bash
# Linux
sudo systemctl start mysql
sudo systemctl enable mysql

# macOS
brew services start mysql

# Windows
# MySQL runs as a service automatically
```

3. **Secure MySQL Installation** (First time only)
```bash
sudo mysql_secure_installation
```

4. **Login to MySQL**
```bash
mysql -u root -p
```

5. **Create Database**
```sql
CREATE DATABASE ro_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ro_admin'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ro_service_db.* TO 'ro_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Option B: Using MySQL Docker Container

```bash
docker run --name ro-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=ro_service_db \
  -e MYSQL_USER=ro_admin \
  -e MYSQL_PASSWORD=your_secure_password \
  -p 3306:3306 \
  -d mysql:8.0
```

#### Option C: Cloud MySQL (For Production)

**Hostinger MySQL:**
- Login to Hostinger control panel
- Navigate to "Databases" → "MySQL Databases"
- Create new database: `ro_service_db`
- Note down host, username, password, port

**Other Cloud Options:**
- [AWS RDS MySQL](https://aws.amazon.com/rds/mysql/)
- [Google Cloud SQL](https://cloud.google.com/sql)
- [Azure Database for MySQL](https://azure.microsoft.com/en-us/services/mysql/)
- [PlanetScale](https://planetscale.com/)

### 3️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` file with your configuration:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=ro_admin
DB_PASSWORD=your_secure_password
DB_NAME=ro_service_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_very_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# WhatsApp/Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:4200
```

**Start Backend Server:**
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

### 4️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

**Configure Environment Variables:**

Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
};
```

Edit `src/environments/environment.prod.ts` for production:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
};
```

**Start Frontend Development Server:**
```bash
ng serve
```

Frontend will run on `http://localhost:4200`

### 5️⃣ Create Initial Admin User

After starting the backend, create the first admin user using API:

```bash
curl -X POST http://localhost:5000/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@roservice.com",
    "password": "Admin@123",
    "phone": "+1234567890",
    "role": "admin"
  }'
```

Or use Postman/Insomnia to send POST request to:
- **URL:** `http://localhost:5000/api/auth/register-admin`
- **Body (JSON):**
```json
{
  "name": "Admin User",
  "email": "admin@roservice.com",
  "password": "Admin@123",
  "phone": "+1234567890",
  "role": "admin"
}
```

---

## 📱 WhatsApp Integration Setup

### Get Twilio Credentials

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Go to **Console Dashboard**
3. Copy your **Account SID** and **Auth Token**
4. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
5. Follow the sandbox setup instructions
6. Add your Twilio number to `.env`

### WhatsApp Sandbox Setup (Development)

1. Send `join <sandbox-code>` to Twilio WhatsApp number
2. You'll receive a confirmation
3. Now you can receive messages in development

### Production WhatsApp Setup

1. Submit your business profile to Twilio
2. Get approval for WhatsApp Business API
3. Update phone number in `.env`

---

## 🗺️ Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Maps JavaScript API**
4. Create credentials (API Key)
5. Restrict API key (optional but recommended):
   - HTTP referrers for frontend
   - IP addresses for backend
6. Add API key to `environment.ts`

---

## 🔐 Default Login Credentials

**Admin Login:**
- Email: `admin@roservice.com`
- Password: `Admin@123`

**⚠️ Change these credentials immediately after first login!**

---

## 📁 Project Structure

```
waterroservice/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL/Sequelize configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management
│   │   └── orderController.js   # Order management
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Order.js             # Order model
│   │   ├── OrderHistory.js      # Order history model
│   │   └── index.js             # Model relationships
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── users.js             # User routes
│   │   └── orders.js            # Order routes
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── utils/
│   │   ├── generateToken.js     # JWT token generator
│   │   └── whatsapp.js          # WhatsApp notifications
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   └── server.js                # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── login/           # Login component
│   │   │   │   └── admin/           # Admin components
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts  # Auth service
│   │   │   │   ├── user.service.ts  # User service
│   │   │   │   └── order.service.ts # Order service
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts    # Route guard
│   │   │   ├── interceptors/
│   │   │   │   └── http.interceptor.ts # HTTP interceptor
│   │   │   ├── models/              # TypeScript interfaces
│   │   │   ├── app.config.ts
│   │   │   ├── app.routes.ts
│   │   │   └── app.component.ts
│   │   ├── environments/            # Environment configs
│   │   ├── assets/                  # Static assets
│   │   └── styles.scss              # Global styles
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | Register new user | Admin |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/updatepassword` | Update password | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| GET | `/api/users/employees/available` | Get available employees | Admin |

### Orders
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders` | Get all orders | Yes |
| GET | `/api/orders/:id` | Get order by ID | Yes |
| POST | `/api/orders` | Create new order | Admin |
| PUT | `/api/orders/:id` | Update order | Admin |
| PUT | `/api/orders/:id/assign` | Assign order to employee | Admin |
| PUT | `/api/orders/:id/status` | Update order status | Yes |
| DELETE | `/api/orders/:id` | Delete order | Admin |
| GET | `/api/orders/:id/history` | Get order history | Yes |
| GET | `/api/orders/dashboard/stats` | Get dashboard statistics | Admin |

---

## 🚀 Deployment

### 🔹 Deployment on Hostinger

#### Backend Deployment

1. **Purchase Hostinger Hosting Plan**
   - VPS or Cloud hosting recommended
   - Shared hosting works but limited

2. **Setup Node.js Application**
```bash
# SSH into your server
ssh username@your-server-ip

# Install Node.js (if not present)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

3. **Upload Backend Files**
```bash
# Option 1: Using Git
git clone <your-repository-url>
cd waterroservice/backend

# Option 2: Using FileZilla/SCP
# Upload backend folder to /home/username/waterroservice/backend
```

4. **Install Dependencies & Configure**
```bash
cd backend
npm install --production

# Create .env file
nano .env
# Add production environment variables
```

5. **Setup MySQL Database**
```bash
# Create database via Hostinger panel or MySQL command line
mysql -u username -p
CREATE DATABASE ro_service_db;
EXIT;
```

6. **Start Application with PM2**
```bash
pm2 start server.js --name "ro-service-backend"
pm2 save
pm2 startup
```

7. **Configure Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Frontend Deployment

1. **Build Angular App for Production**
```bash
cd frontend
ng build --configuration production
```

2. **Upload to Hostinger**
```bash
# Upload contents of dist/ro-service-frontend/ to public_html
# Or use subdomain folder
```

3. **Create .htaccess for Angular Routing**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

4. **Enable SSL Certificate**
   - Go to Hostinger Control Panel
   - Navigate to SSL section
   - Enable free Let's Encrypt SSL

---

### 🔹 Alternative: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: ro_service_db
      MYSQL_USER: ro_admin
      MYSQL_PASSWORD: your_password
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_USER: ro_admin
      DB_PASSWORD: your_password
      DB_NAME: ro_service_db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql-data:
```

---

## 🔧 Git Setup & Workflow

### Initialize Git Repository

```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: RO Service Management System"

# Add remote repository
git remote add origin <your-repository-url>

# Push to main branch
git branch -M main
git push -u origin main
```

### Recommended Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create Pull Request on GitHub/GitLab
# After review, merge to main

# Update local main branch
git checkout main
git pull origin main
```

---

## 🧪 Testing

### Backend API Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roservice.com","password":"Admin@123"}'
```

### Frontend Testing

```bash
cd frontend
ng test
```

---

## 🔒 Security Best Practices

1. **Change default credentials** immediately
2. **Use strong JWT secret** in production
3. **Enable HTTPS** (SSL Certificate)
4. **Restrict CORS** to specific domains
5. **Sanitize user inputs**
6. **Regular security updates**
7. **Use environment variables** for sensitive data
8. **Implement rate limiting** for API endpoints
9. **Regular database backups**
10. **Monitor application logs**

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('admin', 'employee') DEFAULT 'employee',
  isActive BOOLEAN DEFAULT true,
  address TEXT,
  profileImage VARCHAR(255),
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderNumber VARCHAR(50) UNIQUE NOT NULL,
  customerName VARCHAR(100) NOT NULL,
  customerPhone VARCHAR(20) NOT NULL,
  customerEmail VARCHAR(100),
  customerAddress TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  serviceType VARCHAR(100) NOT NULL,
  status ENUM('pending','assigned','in-progress','completed','cancelled'),
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  description TEXT,
  scheduledDate DATETIME,
  completedDate DATETIME,
  assignedToId INT,
  assignedById INT,
  notes TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (assignedToId) REFERENCES users(id),
  FOREIGN KEY (assignedById) REFERENCES users(id)
);
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 📞 Support

For issues, questions, or contributions:
- 📧 Email: support@roservice.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/waterroservice/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/waterroservice/wiki)

---

## 🎉 Acknowledgments

- Angular Team for the amazing framework
- Node.js & Express.js communities
- MySQL & Sequelize teams
- Twilio for WhatsApp API
- Google Maps Platform
- Angular Material Design

---

**Made with ❤️ for RO Service Management**

**Version:** 1.0.0  
**Last Updated:** January 2026

---

## 🚦 Quick Start Summary

```bash
# 1. Clone and install
git clone <repo-url> && cd waterroservice

# 2. Setup MySQL database
mysql -u root -p
CREATE DATABASE ro_service_db;

# 3. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your config
npm run dev

# 4. Frontend setup (new terminal)
cd frontend
npm install
ng serve

# 5. Access application
# Frontend: http://localhost:4200
# Backend: http://localhost:5000
# Login: admin@roservice.com / Admin@123
```

🎊 **You're all set! Happy coding!** 🎊
