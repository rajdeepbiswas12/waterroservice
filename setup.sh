#!/bin/bash

# RO Service Management System - Quick Setup Script
# This script helps you set up the development environment

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  RO Service Management System - Quick Setup Script       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
else
    echo -e "${GREEN}✓ Node.js is installed ($(node -v))${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✓ npm is installed ($(npm -v))${NC}"
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠ MySQL is not installed or not in PATH${NC}"
    echo "Please install MySQL from https://dev.mysql.com/downloads/"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ MySQL is installed${NC}"
fi

# Check if Angular CLI is installed
if ! command -v ng &> /dev/null; then
    echo -e "${YELLOW}⚠ Angular CLI is not installed${NC}"
    read -p "Do you want to install Angular CLI globally? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g @angular/cli
        echo -e "${GREEN}✓ Angular CLI installed${NC}"
    fi
else
    echo -e "${GREEN}✓ Angular CLI is installed ($(ng version --minimal))${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Setting up Backend..."
echo "═══════════════════════════════════════════════════════════"

# Backend Setup
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit backend/.env file with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

cd ..

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Setting up Frontend..."
echo "═══════════════════════════════════════════════════════════"

# Frontend Setup
cd frontend

echo "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi

cd ..

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Database Setup Instructions"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Make sure MySQL server is running"
echo "2. Create database by running:"
echo "   mysql -u root -p"
echo "   CREATE DATABASE ro_service_db;"
echo "   CREATE USER 'ro_admin'@'localhost' IDENTIFIED BY 'your_password';"
echo "   GRANT ALL PRIVILEGES ON ro_service_db.* TO 'ro_admin'@'localhost';"
echo "   FLUSH PRIVILEGES;"
echo "   EXIT;"
echo ""
echo "3. Update backend/.env with your database credentials"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your environment:"
echo "   - Edit backend/.env with your settings"
echo "   - Edit frontend/src/environments/environment.ts"
echo ""
echo "2. Start the backend server:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   ng serve"
echo ""
echo "4. Create initial admin user using the API"
echo "   (See README.md for instructions)"
echo ""
echo "5. Access the application:"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:5000"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
