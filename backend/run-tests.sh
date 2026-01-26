#!/bin/bash

echo "=================================="
echo "Running Backend Unit Tests"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Customer API Tests${NC}"
npm test -- --testPathPattern=customer.test.js --silent

echo ""
echo -e "${BLUE}2. AMC API Tests${NC}"
npm test -- --testPathPattern=amc.test.js --silent

echo ""
echo -e "${BLUE}3. Order API Tests${NC}"
npm test -- --testPathPattern=order.test.js --silent

echo ""
echo -e "${BLUE}4. Auth API Tests${NC}"
npm test -- --testPathPattern=auth.test.js --silent

echo ""
echo -e "${BLUE}5. User API Tests${NC}"
npm test -- --testPathPattern=user.test.js --silent

echo ""
echo -e "${GREEN}=================================="
echo "All Backend Tests Completed!"
echo "==================================${NC}"
