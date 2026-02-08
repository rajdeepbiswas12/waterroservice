const request = require('supertest');
const app = require('../server');
const { User, AmcPlan, AmcSubscription, Customer } = require('../models');
const bcrypt = require('bcryptjs');

describe('AMC Subscription Assignment Tests', () => {
  let adminToken;
  let employeeToken;
  let testAdmin;
  let testEmployee;
  let testCustomer;
  let testPlan;

  beforeAll(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    testAdmin = await User.create({
      name: 'Test AMC Admin',
      email: 'amcadmin@test.com',
      password: hashedPassword,
      phone: '+1234567899',
      role: 'admin',
      isActive: true
    });

    testEmployee = await User.create({
      name: 'Test AMC Employee',
      email: 'amcemployee@test.com',
      password: hashedPassword,
      phone: '+9876543299',
      role: 'employee',
      isActive: true
    });

    // Create test customer
    testCustomer = await Customer.create({
      customerNumber: 'CUST-TEST-001',
      name: 'Test Customer',
      phone: '9999999999',
      email: 'testcustomer@test.com',
      address: 'Test Address',
      city: 'Test City',
      customerType: 'residential',
      status: 'active',
      registeredBy: testAdmin.id
    });

    // Create test AMC plan
    testPlan = await AmcPlan.create({
      planCode: 'AMC-TEST-001',
      planName: 'Test Basic Plan',
      description: 'Test plan for unit testing',
      duration: 12,
      serviceType: 'Installation',
      numberOfVisits: 4,
      price: 5000,
      gst: 18,
      features: ['Test Feature 1', 'Test Feature 2'],
      isActive: true,
      createdBy: testAdmin.id
    });

    // Login to get tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'amcadmin@test.com', password: 'Test@123' });
    adminToken = adminRes.body.token;

    const empRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'amcemployee@test.com', password: 'Test@123' });
    employeeToken = empRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await AmcSubscription.destroy({ where: {} });
    await AmcPlan.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await User.destroy({ where: { email: ['amcadmin@test.com', 'amcemployee@test.com'] } });
  });

  describe('POST /api/amc/subscriptions', () => {
    it('should create AMC subscription with valid data', async () => {
      const subscriptionData = {
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: new Date(),
        paymentMode: 'Cash',
        transactionId: 'TEST-TXN-001',
        autoRenewal: false,
        notes: 'Test subscription'
      };

      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('subscriptionNumber');
      expect(res.body.data.customerId).toBe(testCustomer.id);
      expect(res.body.data.planId).toBe(testPlan.id);
      expect(res.body.data.status).toBe('active');
    });

    it('should allow employee to create AMC subscription', async () => {
      const subscriptionData = {
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: new Date(),
        paymentMode: 'UPI',
        transactionId: 'TEST-TXN-002',
        autoRenewal: true,
        notes: 'Employee assignment'
      };

      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('subscriptionNumber');
    });

    it('should fail without authentication', async () => {
      const subscriptionData = {
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: new Date(),
        paymentMode: 'Cash'
      };

      await request(app)
        .post('/api/amc/subscriptions')
        .send(subscriptionData)
        .expect(401);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: testCustomer.id
          // Missing planId and startDate
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid plan ID', async () => {
      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: testCustomer.id,
          planId: 99999, // Non-existent plan
          startDate: new Date(),
          paymentMode: 'Cash'
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('plan not found');
    });

    it('should calculate total amount correctly with GST', async () => {
      const subscriptionData = {
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: new Date(),
        paymentMode: 'Card'
      };

      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(subscriptionData)
        .expect(201);

      // Expected: 5000 + (5000 * 18/100) = 5900
      expect(parseFloat(res.body.data.totalAmount)).toBe(5900);
      expect(parseFloat(res.body.data.paidAmount)).toBe(5900);
      expect(parseFloat(res.body.data.balanceAmount)).toBe(0);
    });

    it('should set correct end date based on plan duration', async () => {
      const startDate = new Date('2026-01-01');
      const subscriptionData = {
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: startDate,
        paymentMode: 'Cash'
      };

      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(subscriptionData)
        .expect(201);

      const expectedEndDate = new Date('2027-01-01'); // 12 months later
      const actualEndDate = new Date(res.body.data.endDate);
      
      expect(actualEndDate.getFullYear()).toBe(expectedEndDate.getFullYear());
      expect(actualEndDate.getMonth()).toBe(expectedEndDate.getMonth());
    });
  });

  describe('GET /api/amc/subscriptions', () => {
    beforeEach(async () => {
      // Create test subscription
      await AmcSubscription.create({
        subscriptionNumber: 'SUB-TEST-001',
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
        totalAmount: 5900,
        paidAmount: 5900,
        balanceAmount: 0,
        paymentStatus: 'paid',
        paymentMode: 'Cash',
        visitsUsed: 0,
        visitsRemaining: 4,
        createdBy: testEmployee.id
      });
    });

    it('should retrieve all AMC subscriptions', async () => {
      const res = await request(app)
        .get('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter subscriptions by status', async () => {
      const res = await request(app)
        .get('/api/amc/subscriptions?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach(sub => {
        expect(sub.status).toBe('active');
      });
    });
  });
});

module.exports = {
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  expect
};
