#!/bin/bash

# Test Verification Script
# This script verifies that all unit tests exist and are properly configured

echo "╔════════════════════════════════════════════════════════╗"
echo "║     RO Service - Unit Test Verification Report        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counters
BACKEND_TESTS=0
FRONTEND_TESTS=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}BACKEND TESTS (Jest + Supertest)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Backend Tests
BACKEND_DIR="backend/tests"

if [ -d "$BACKEND_DIR" ]; then
  echo "📁 Backend Test Directory: $BACKEND_DIR"
  echo ""
  
  # Customer Tests
  if [ -f "$BACKEND_DIR/customer.test.js" ]; then
    echo -e "  ${GREEN}✓${NC} customer.test.js"
    LINES=$(wc -l < "$BACKEND_DIR/customer.test.js")
    TESTS=$(grep -c "it('should" "$BACKEND_DIR/customer.test.js" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    BACKEND_TESTS=$((BACKEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} customer.test.js - MISSING"
  fi
  
  # AMC Tests
  if [ -f "$BACKEND_DIR/amc.test.js" ]; then
    echo -e "  ${GREEN}✓${NC} amc.test.js"
    LINES=$(wc -l < "$BACKEND_DIR/amc.test.js")
    TESTS=$(grep -c "it('should" "$BACKEND_DIR/amc.test.js" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    BACKEND_TESTS=$((BACKEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} amc.test.js - MISSING"
  fi
  
  # Order Tests
  if [ -f "$BACKEND_DIR/order.test.js" ]; then
    echo -e "  ${GREEN}✓${NC} order.test.js"
    LINES=$(wc -l < "$BACKEND_DIR/order.test.js")
    TESTS=$(grep -c "it('should" "$BACKEND_DIR/order.test.js" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    BACKEND_TESTS=$((BACKEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} order.test.js - MISSING"
  fi
  
  # Auth Tests
  if [ -f "$BACKEND_DIR/auth.test.js" ]; then
    echo -e "  ${GREEN}✓${NC} auth.test.js"
    LINES=$(wc -l < "$BACKEND_DIR/auth.test.js")
    TESTS=$(grep -c "it('should" "$BACKEND_DIR/auth.test.js" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    BACKEND_TESTS=$((BACKEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} auth.test.js - MISSING"
  fi
  
  # User Tests
  if [ -f "$BACKEND_DIR/user.test.js" ]; then
    echo -e "  ${GREEN}✓${NC} user.test.js"
    LINES=$(wc -l < "$BACKEND_DIR/user.test.js")
    TESTS=$(grep -c "it('should" "$BACKEND_DIR/user.test.js" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    BACKEND_TESTS=$((BACKEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} user.test.js - MISSING"
  fi
  
  # Models Tests
  if [ -f "$BACKEND_DIR/models.test.js" ]; then
    echo -e "  ${GREEN}✓${NC} models.test.js"
    LINES=$(wc -l < "$BACKEND_DIR/models.test.js")
    TESTS=$(grep -c "it('should" "$BACKEND_DIR/models.test.js" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    BACKEND_TESTS=$((BACKEND_TESTS + TESTS))
  else
    echo -e "  ${YELLOW}⚠${NC} models.test.js - OPTIONAL"
  fi
  
else
  echo -e "${RED}✗ Backend test directory not found!${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}FRONTEND TESTS (Jasmine + Karma)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Frontend Tests
FRONTEND_DIR="frontend/src/app"

if [ -d "$FRONTEND_DIR" ]; then
  echo "📁 Frontend Test Directory: $FRONTEND_DIR"
  echo ""
  
  echo -e "${YELLOW}Services:${NC}"
  
  # Customer Service Tests
  if [ -f "$FRONTEND_DIR/services/customer.service.spec.ts" ]; then
    echo -e "  ${GREEN}✓${NC} customer.service.spec.ts"
    LINES=$(wc -l < "$FRONTEND_DIR/services/customer.service.spec.ts")
    TESTS=$(grep -c "it('should" "$FRONTEND_DIR/services/customer.service.spec.ts" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    FRONTEND_TESTS=$((FRONTEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} customer.service.spec.ts - MISSING"
  fi
  
  # AMC Service Tests
  if [ -f "$FRONTEND_DIR/services/amc.service.spec.ts" ]; then
    echo -e "  ${GREEN}✓${NC} amc.service.spec.ts"
    LINES=$(wc -l < "$FRONTEND_DIR/services/amc.service.spec.ts")
    TESTS=$(grep -c "it('should" "$FRONTEND_DIR/services/amc.service.spec.ts" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    FRONTEND_TESTS=$((FRONTEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} amc.service.spec.ts - MISSING"
  fi
  
  # Order Service Tests
  if [ -f "$FRONTEND_DIR/services/order.service.spec.ts" ]; then
    echo -e "  ${GREEN}✓${NC} order.service.spec.ts"
    LINES=$(wc -l < "$FRONTEND_DIR/services/order.service.spec.ts")
    TESTS=$(grep -c "it('should" "$FRONTEND_DIR/services/order.service.spec.ts" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    FRONTEND_TESTS=$((FRONTEND_TESTS + TESTS))
  else
    echo -e "  ${YELLOW}⚠${NC} order.service.spec.ts"
  fi
  
  echo ""
  echo -e "${YELLOW}Components:${NC}"
  
  # Customer List Component Tests
  if [ -f "$FRONTEND_DIR/components/customers/customer-list/customer-list.component.spec.ts" ]; then
    echo -e "  ${GREEN}✓${NC} customer-list.component.spec.ts"
    LINES=$(wc -l < "$FRONTEND_DIR/components/customers/customer-list/customer-list.component.spec.ts")
    TESTS=$(grep -c "it('should" "$FRONTEND_DIR/components/customers/customer-list/customer-list.component.spec.ts" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    FRONTEND_TESTS=$((FRONTEND_TESTS + TESTS))
  else
    echo -e "  ${RED}✗${NC} customer-list.component.spec.ts - MISSING"
  fi
  
  # Customer Form Component Tests
  if [ -f "$FRONTEND_DIR/components/customers/customer-form/customer-form.component.spec.ts" ]; then
    echo -e "  ${GREEN}✓${NC} customer-form.component.spec.ts"
    LINES=$(wc -l < "$FRONTEND_DIR/components/customers/customer-form/customer-form.component.spec.ts")
    TESTS=$(grep -c "it('should" "$FRONTEND_DIR/components/customers/customer-form/customer-form.component.spec.ts" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    FRONTEND_TESTS=$((FRONTEND_TESTS + TESTS))
  else
    echo -e "  ${YELLOW}⚠${NC} customer-form.component.spec.ts"
  fi
  
  # AMC Plans Component Tests
  if [ -f "$FRONTEND_DIR/components/amc/amc-plans/amc-plans.component.spec.ts" ]; then
    echo -e "  ${GREEN}✓${NC} amc-plans.component.spec.ts"
    LINES=$(wc -l < "$FRONTEND_DIR/components/amc/amc-plans/amc-plans.component.spec.ts")
    TESTS=$(grep -c "it('should" "$FRONTEND_DIR/components/amc/amc-plans/amc-plans.component.spec.ts" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    FRONTEND_TESTS=$((FRONTEND_TESTS + TESTS))
  else
    echo -e "  ${YELLOW}⚠${NC} amc-plans.component.spec.ts"
  fi
  
  # AMC Subscriptions Component Tests
  if [ -f "$FRONTEND_DIR/components/amc/amc-subscriptions/amc-subscriptions.component.spec.ts" ]; then
    echo -e "  ${GREEN}✓${NC} amc-subscriptions.component.spec.ts"
    LINES=$(wc -l < "$FRONTEND_DIR/components/amc/amc-subscriptions/amc-subscriptions.component.spec.ts")
    TESTS=$(grep -c "it('should" "$FRONTEND_DIR/components/amc/amc-subscriptions/amc-subscriptions.component.spec.ts" || echo "0")
    echo "    └─ $LINES lines, ~$TESTS test cases"
    FRONTEND_TESTS=$((FRONTEND_TESTS + TESTS))
  else
    echo -e "  ${YELLOW}⚠${NC} amc-subscriptions.component.spec.ts"
  fi
  
else
  echo -e "${RED}✗ Frontend directory not found!${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Backend Test Cases:${NC}  ~$BACKEND_TESTS tests"
echo -e "  ${GREEN}Frontend Test Cases:${NC} ~$FRONTEND_TESTS tests"
echo -e "  ${GREEN}Total Test Cases:${NC}    ~$((BACKEND_TESTS + FRONTEND_TESTS)) tests"
echo ""

# Check test configuration files
echo -e "${YELLOW}Configuration Files:${NC}"
if [ -f "backend/jest.config.js" ]; then
  echo -e "  ${GREEN}✓${NC} backend/jest.config.js"
else
  echo -e "  ${RED}✗${NC} backend/jest.config.js - MISSING"
fi

if [ -f "frontend/karma.conf.js" ]; then
  echo -e "  ${GREEN}✓${NC} frontend/karma.conf.js"
else
  echo -e "  ${RED}✗${NC} frontend/karma.conf.js - MISSING"
fi

if [ -f "backend/package.json" ]; then
  if grep -q '"test":' "backend/package.json"; then
    echo -e "  ${GREEN}✓${NC} backend/package.json (test script configured)"
  else
    echo -e "  ${RED}✗${NC} backend/package.json (test script missing)"
  fi
fi

if [ -f "frontend/package.json" ]; then
  if grep -q '"test":' "frontend/package.json"; then
    echo -e "  ${GREEN}✓${NC} frontend/package.json (test script configured)"
  else
    echo -e "  ${RED}✗${NC} frontend/package.json (test script missing)"
  fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}HOW TO RUN TESTS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Backend Tests:"
echo "  cd backend && npm test"
echo "  cd backend && npm run test:coverage"
echo "  cd backend && ./run-tests.sh"
echo ""
echo "Frontend Tests:"
echo "  cd frontend && ng test"
echo "  cd frontend && ng test --watch=false --code-coverage"
echo "  cd frontend && ./run-tests.sh"
echo ""
echo -e "${GREEN}✓ Test verification complete!${NC}"
echo ""
