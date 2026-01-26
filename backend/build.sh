#!/bin/bash

# Backend Build Script
# This script builds the backend application for production deployment

set -e  # Exit on any error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║        RO Service - Backend Build Script             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BUILD_DIR="dist"
NODE_ENV="production"

echo -e "${BLUE}→ Step 1: Cleaning previous build...${NC}"
if [ -d "$BUILD_DIR" ]; then
  rm -rf $BUILD_DIR
  echo -e "${GREEN}✓ Build directory cleaned${NC}"
else
  echo -e "${YELLOW}⚠ No previous build found${NC}"
fi
echo ""

echo -e "${BLUE}→ Step 2: Installing dependencies...${NC}"
npm ci --production=false
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}→ Step 3: Running tests...${NC}"
if npm test -- --passWithNoTests; then
  echo -e "${GREEN}✓ All tests passed${NC}"
else
  echo -e "${RED}✗ Tests failed${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}→ Step 4: Creating production build...${NC}"
mkdir -p $BUILD_DIR

# Copy source files
echo "  • Copying source files..."
cp -r routes controllers models middleware utils config.js server.js $BUILD_DIR/

# Copy package files
echo "  • Copying package files..."
cp package.json package-lock.json $BUILD_DIR/

# Create production environment file
echo "  • Creating production environment..."
cat > $BUILD_DIR/.env.production << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ro_service
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:4200
EOF

echo -e "${GREEN}✓ Build created in $BUILD_DIR/${NC}"
echo ""

echo -e "${BLUE}→ Step 5: Installing production dependencies...${NC}"
cd $BUILD_DIR
npm ci --production
cd ..
echo -e "${GREEN}✓ Production dependencies installed${NC}"
echo ""

echo -e "${BLUE}→ Step 6: Copying migration script...${NC}"
cp migrate.sh $BUILD_DIR/
chmod +x $BUILD_DIR/migrate.sh
echo -e "${GREEN}✓ Migration script copied${NC}"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Backend Build Completed Successfully       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Build Output:${NC} ./backend/$BUILD_DIR/"
echo -e "${YELLOW}To deploy:${NC}"
echo "  1. Copy the $BUILD_DIR/ directory to your server"
echo "  2. Update .env.production with your configuration"
echo "  3. Run database migration: ./migrate.sh"
echo "  4. Start server: node server.js"
echo ""
