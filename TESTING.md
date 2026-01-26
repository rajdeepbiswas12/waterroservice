# Test Configuration for RO Service Application

## Backend Tests

### Running Tests

```bash
# Install test dependencies
cd backend
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Create test database
mysql -u debian-sys-maint -p'JqEUCVXXSvsK5r2u' -e "CREATE DATABASE IF NOT EXISTS ro_service_test_db;"
```

### Test Files Created

1. **tests/auth.test.js** - Authentication endpoints tests
   - Login functionality
   - Registration
   - Get current user
   - Update password

2. **tests/order.test.js** - Order management tests
   - Create, read, update, delete orders
   - Assign orders to employees
   - Update order status
   - Order history
   - Dashboard statistics

3. **tests/user.test.js** - User management tests
   - User CRUD operations
   - Filter users
   - Get available employees
   - Delete validation

4. **tests/models.test.js** - Database model tests
   - User model validation
   - Order model validation
   - OrderHistory model
   - Model associations

### Test Coverage

Current test coverage targets:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## Frontend Tests

### Running Tests

```bash
# Install dependencies
cd frontend
npm install

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --code-coverage

# Run specific test file
npm test -- --include='**/auth.service.spec.ts'
```

### Test Files Created

1. **services/auth.service.spec.ts** - Authentication service tests
   - Login/logout functionality
   - User registration
   - Password update
   - Role checking (isAdmin, isEmployee)

2. **services/order.service.spec.ts** - Order service tests
   - Get all orders with filters
   - Create/update/delete orders
   - Assign orders
   - Update order status
   - Get order history
   - Dashboard statistics

3. **services/user.service.spec.ts** - User service tests
   - Get all users with filters
   - Get single user
   - Update user
   - Delete user
   - Get available employees

4. **components/login/login.component.spec.ts** - Login component tests
   - Form validation
   - Email/password validation
   - Password visibility toggle
   - Login success/error handling
   - Navigation after login

5. **guards/auth.guard.spec.ts** - Auth guard tests
   - Route protection
   - Role-based authorization
   - Redirect to login
   - Redirect unauthorized users

### Test Configuration

Angular uses Jasmine and Karma for testing:
- **karma.conf.js** - Test runner configuration
- **tsconfig.spec.json** - TypeScript configuration for tests

---

## Test Database Setup

Before running backend tests, create a test database:

```bash
# Using debian-sys-maint user
mysql -u debian-sys-maint -p'JqEUCVXXSvsK5r2u' << 'SQL'
CREATE DATABASE IF NOT EXISTS ro_service_test_db;
GRANT ALL PRIVILEGES ON ro_service_test_db.* TO 'ro_admin'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Or manually:
```sql
CREATE DATABASE IF NOT EXISTS ro_service_test_db;
GRANT ALL PRIVILEGES ON ro_service_test_db.* TO 'ro_admin'@'localhost';
FLUSH PRIVILEGES;
```

---

## Running All Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests (in new terminal)
cd frontend && npm test

# Or run both with coverage
cd backend && npm run test:coverage
cd frontend && npm test -- --code-coverage
```

---

## Test Best Practices

### Backend
- Each test file has `beforeAll` and `afterAll` hooks for setup/cleanup
- Tests use isolated test data
- Database transactions for test isolation
- Mock external services (Twilio, etc.)

### Frontend
- Use Angular testing utilities (TestBed, ComponentFixture)
- Mock HTTP calls with HttpTestingController
- Test component initialization, user interactions, and error handling
- Mock services with Jasmine spies

---

## Continuous Integration

For CI/CD pipelines, run:

```bash
# Backend
cd backend
npm install
npm test -- --ci --coverage

# Frontend
cd frontend
npm install
npm test -- --browsers=ChromeHeadless --watch=false --code-coverage
```

---

## Test Coverage Reports

After running tests with coverage:

### Backend
```bash
cd backend
npm run test:coverage
# View report: open coverage/lcov-report/index.html
```

### Frontend
```bash
cd frontend
npm test -- --code-coverage
# View report: open coverage/index.html
```

---

## Common Test Commands

```bash
# Backend - Run specific test file
npm test -- tests/auth.test.js

# Backend - Update snapshots
npm test -- -u

# Frontend - Run tests for specific component
npm test -- --include='**/login.component.spec.ts'

# Frontend - Run tests in headless mode
npm test -- --browsers=ChromeHeadless --watch=false

# Frontend - Debug tests
npm test -- --browsers=Chrome --watch=true
```

---

## Troubleshooting

### Backend Tests

**Issue: Database connection failed**
- Solution: Ensure test database exists and credentials are correct in `.env.test`

**Issue: Tests timeout**
- Solution: Increase timeout in `jest.config.js` or use `jest.setTimeout()`

**Issue: Port already in use**
- Solution: Tests use a different port (5001) defined in `.env.test`

### Frontend Tests

**Issue: Can't resolve '@angular/...'**
- Solution: Run `npm install` to ensure all dependencies are installed

**Issue: Tests fail with HTTP errors**
- Solution: Ensure all HTTP calls are mocked with `HttpTestingController`

**Issue: Karma not found**
- Solution: Install Angular CLI globally: `npm install -g @angular/cli`

---

## Next Steps

1. ✅ Run backend tests: `cd backend && npm test`
2. ✅ Run frontend tests: `cd frontend && npm test`
3. ✅ Check coverage reports
4. 📝 Add more test cases for edge cases
5. 🔄 Integrate with CI/CD pipeline
6. 📊 Set up code coverage monitoring

---

For more details, see individual test files in:
- Backend: `/backend/tests/`
- Frontend: `/frontend/src/app/**/*.spec.ts`
