#!/bin/bash

echo "=================================="
echo "Running Frontend Unit Tests"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Running Angular Karma Tests${NC}"
echo ""

# Run specific test suites
echo "1. Customer Service Tests"
ng test --include='**/customer.service.spec.ts' --watch=false --browsers=ChromeHeadless

echo ""
echo "2. AMC Service Tests"
ng test --include='**/amc.service.spec.ts' --watch=false --browsers=ChromeHeadless

echo ""
echo "3. Customer List Component Tests"
ng test --include='**/customer-list.component.spec.ts' --watch=false --browsers=ChromeHeadless

echo ""
echo -e "${GREEN}=================================="
echo "All Frontend Tests Completed!"
echo "==================================${NC}"
