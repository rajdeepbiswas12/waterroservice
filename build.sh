#!/bin/bash

# Master Build Script
# This script builds both frontend and backend applications

set -e  # Exit on any error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     RO Service - Complete Build Script (CI/CD)       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BUILD_OUTPUT="$PROJECT_ROOT/build"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Track build status
BACKEND_BUILD_SUCCESS=0
FRONTEND_BUILD_SUCCESS=0

echo -e "${BLUE}Build started at: $(date)${NC}"
echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"
echo ""

# Create build output directory
echo -e "${BLUE}→ Creating build output directory...${NC}"
mkdir -p $BUILD_OUTPUT
echo ""

# Build Backend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Building Backend Application...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d "$BACKEND_DIR" ]; then
  cd $BACKEND_DIR
  chmod +x build.sh
  if ./build.sh; then
    BACKEND_BUILD_SUCCESS=1
    echo -e "${GREEN}✓ Backend build completed${NC}"
    
    # Copy backend build to output
    if [ -d "dist" ]; then
      cp -r dist $BUILD_OUTPUT/backend
      echo -e "${GREEN}✓ Backend artifacts copied to build/backend/${NC}"
    fi
  else
    echo -e "${RED}✗ Backend build failed${NC}"
  fi
  cd $PROJECT_ROOT
else
  echo -e "${RED}✗ Backend directory not found${NC}"
fi
echo ""

# Build Frontend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Building Frontend Application...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d "$FRONTEND_DIR" ]; then
  cd $FRONTEND_DIR
  chmod +x build.sh
  if ./build.sh; then
    FRONTEND_BUILD_SUCCESS=1
    echo -e "${GREEN}✓ Frontend build completed${NC}"
    
    # Copy frontend build to output
    if [ -d "dist" ]; then
      cp -r dist $BUILD_OUTPUT/frontend
      echo -e "${GREEN}✓ Frontend artifacts copied to build/frontend/${NC}"
    fi
  else
    echo -e "${RED}✗ Frontend build failed${NC}"
  fi
  cd $PROJECT_ROOT
else
  echo -e "${RED}✗ Frontend directory not found${NC}"
fi
echo ""

# Create deployment package
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Creating Deployment Package...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $BACKEND_BUILD_SUCCESS -eq 1 ] && [ $FRONTEND_BUILD_SUCCESS -eq 1 ]; then
  cd $BUILD_OUTPUT
  tar -czf ro-service-complete-$TIMESTAMP.tar.gz backend frontend
  PACKAGE_SIZE=$(du -sh ro-service-complete-$TIMESTAMP.tar.gz | cut -f1)
  echo -e "${GREEN}✓ Deployment package created: $PACKAGE_SIZE${NC}"
  echo -e "${GREEN}  Location: build/ro-service-complete-$TIMESTAMP.tar.gz${NC}"
  cd $PROJECT_ROOT
fi
echo ""

# Build Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Build Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $BACKEND_BUILD_SUCCESS -eq 1 ]; then
  echo -e "  Backend:  ${GREEN}✓ SUCCESS${NC}"
else
  echo -e "  Backend:  ${RED}✗ FAILED${NC}"
fi

if [ $FRONTEND_BUILD_SUCCESS -eq 1 ]; then
  echo -e "  Frontend: ${GREEN}✓ SUCCESS${NC}"
else
  echo -e "  Frontend: ${RED}✗ FAILED${NC}"
fi

echo ""
echo -e "${BLUE}Build completed at: $(date)${NC}"
echo ""

if [ $BACKEND_BUILD_SUCCESS -eq 1 ] && [ $FRONTEND_BUILD_SUCCESS -eq 1 ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║        🎉 All Builds Completed Successfully! 🎉       ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Build Artifacts:${NC}"
  echo "  • Backend:  ./build/backend/"
  echo "  • Frontend: ./build/frontend/"
  echo "  • Package:  ./build/ro-service-complete-$TIMESTAMP.tar.gz"
  echo ""
  exit 0
else
  echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║              ⚠ Build Failed - Check Logs ⚠           ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi
