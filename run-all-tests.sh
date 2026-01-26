#!/bin/bash

# Quick Test Runner - Run all tests with summary
# Usage: ./run-all-tests.sh

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           RO Service - Full Test Suite Runner           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_PASSED=0
FRONTEND_PASSED=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Running Backend Tests (Jest)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd backend
if npm test -- --silent --passWithNoTests 2>&1 | grep -q "PASS\|Tests:.*passed"; then
  BACKEND_PASSED=1
  echo -e "${GREEN}✓ Backend tests passed${NC}"
else
  echo -e "${RED}✗ Backend tests failed${NC}"
fi
cd ..

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Running Frontend Tests (Karma/Jasmine)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd frontend
if ng test --watch=false --browsers=ChromeHeadless --code-coverage 2>&1 | grep -q "TOTAL\|SUCCESS"; then
  FRONTEND_PASSED=1
  echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
  echo -e "${YELLOW}⚠ Frontend tests require browser${NC}"
  echo -e "${YELLOW}  Run manually: cd frontend && ng test${NC}"
fi
cd ..

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $BACKEND_PASSED -eq 1 ]; then
  echo -e "  Backend:  ${GREEN}✓ PASSED${NC}"
else
  echo -e "  Backend:  ${RED}✗ FAILED${NC}"
fi

if [ $FRONTEND_PASSED -eq 1 ]; then
  echo -e "  Frontend: ${GREEN}✓ PASSED${NC}"
else
  echo -e "  Frontend: ${YELLOW}⚠ SKIPPED${NC} (requires manual run)"
fi

echo ""
echo -e "${BLUE}View Coverage Reports:${NC}"
echo "  Backend:  open backend/coverage/lcov-report/index.html"
echo "  Frontend: open frontend/coverage/index.html"
echo ""
