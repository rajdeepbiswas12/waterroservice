const request = require('supertest');
const app = require('../server');
const { User, Customer, AmcPlan, AmcSubscription, AmcVisit } = require('../models');
const bcrypt = require('bcryptjs');

describe('AMC API Endpoints', () => {
  let adminToken;
  let testAdmin;
  let testCustomer;
  let testPlan;
  let testSubscription;
  let testVisit;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await bcrypt.hash('TestAdmin@123', 10);
    testAdmin = await User.create({
      name: 'Test Admin AMC',
      email: 'amctest@test.com',
      password: hashedPassword,
      phone: '+1234567891',
      role: 'admin',
      isActive: true
    });

    // Create test customer
    testCustomer = await Customer.create({
      customerNumber: 'CUST-AMC001',
      name: 'AMC Test Customer',
      phone: '8888888888',
      address: '123 AMC Street',
      city: 'Test City',
      state: 'Test State',
      status: 'active'
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'amctest@test.com',
        password: 'TestAdmin@123'
      });
    
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    if (testVisit) {
      await AmcVisit.destroy({ where: { id: testVisit.id } });
    }
    if (testSubscription) {
      await AmcSubscription.destroy({ where: { id: testSubscription.id } });
    }
    if (testPlan) {
      await AmcPlan.destroy({ where: { id: testPlan.id } });
    }
    if (testCustomer) {
      await Customer.destroy({ where: { id: testCustomer.id } });
    }
    await User.destroy({ where: { email: 'amctest@test.com' } });
  });

  // ============ AMC PLANS TESTS ============
  describe('POST /api/amc/plans', () => {
    it('should create a new AMC plan', async () => {
      const planData = {
        planName: 'Gold Plan',
        serviceType: 'Full Service',
        duration: 12,
        numberOfVisits: 4,
        price: 5000,
        gst: 18,
        description: 'Quarterly service plan',
        features: ['Free parts', 'Priority service', '24x7 support'],
        isActive: true
      };

      const res = await request(app)
        .post('/api/amc/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(planData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('planName', planData.planName);
      expect(res.body.data).toHaveProperty('planCode');
      expect(res.body.data.planCode).toMatch(/^PLAN-[A-Z0-9]{6}$/);
      expect(res.body.data).toHaveProperty('totalAmount');

      testPlan = res.body.data;
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/amc/plans')
        .send({
          planName: 'Test Plan',
          duration: 12,
          numberOfVisits: 4,
          price: 5000
        });

      expect(res.statusCode).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/amc/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          planName: 'Invalid Plan',
          // Missing required fields
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/amc/plans', () => {
    it('should get all AMC plans', async () => {
      const res = await request(app)
        .get('/api/amc/plans')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter active plans', async () => {
      const res = await request(app)
        .get('/api/amc/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ isActive: 'true' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/amc/plans/:id', () => {
    it('should get plan by id', async () => {
      const res = await request(app)
        .get(`/api/amc/plans/${testPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', testPlan.id);
      expect(res.body.data).toHaveProperty('planName', testPlan.planName);
    });

    it('should return 404 for non-existent plan', async () => {
      const res = await request(app)
        .get('/api/amc/plans/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/amc/plans/:id', () => {
    it('should update plan details', async () => {
      const updateData = {
        planName: 'Gold Plan Updated',
        price: 5500,
        description: 'Updated description'
      };

      const res = await request(app)
        .put(`/api/amc/plans/${testPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('planName', updateData.planName);
      expect(res.body.data).toHaveProperty('price', updateData.price.toString());
    });
  });

  // ============ AMC SUBSCRIPTIONS TESTS ============
  describe('POST /api/amc/subscriptions', () => {
    it('should create a new AMC subscription', async () => {
      const subscriptionData = {
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: new Date().toISOString().split('T')[0],
        paymentMode: 'online',
        transactionId: 'TXN123456',
        autoRenewal: true
      };

      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(subscriptionData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('subscriptionNumber');
      expect(res.body.data.subscriptionNumber).toMatch(/^SUB-[A-Z0-9]{8}$/);
      expect(res.body.data).toHaveProperty('status', 'active');
      expect(res.body.data).toHaveProperty('visitsRemaining', testPlan.numberOfVisits);

      testSubscription = res.body.data;
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: testCustomer.id
          // Missing planId and other required fields
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/amc/subscriptions', () => {
    it('should get all subscriptions with pagination', async () => {
      const res = await request(app)
        .get('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter subscriptions by status', async () => {
      const res = await request(app)
        .get('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'active' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should filter subscriptions by customer', async () => {
      const res = await request(app)
        .get('/api/amc/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ customerId: testCustomer.id });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/amc/subscriptions/:id', () => {
    it('should get subscription by id with details', async () => {
      const res = await request(app)
        .get(`/api/amc/subscriptions/${testSubscription.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', testSubscription.id);
      expect(res.body.data).toHaveProperty('customer');
      expect(res.body.data).toHaveProperty('plan');
      expect(res.body.data).toHaveProperty('visits');
    });
  });

  describe('PUT /api/amc/subscriptions/:id/cancel', () => {
    it('should cancel subscription', async () => {
      const res = await request(app)
        .put(`/api/amc/subscriptions/${testSubscription.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cancellationReason: 'Customer request' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'cancelled');
      expect(res.body.data).toHaveProperty('cancellationReason', 'Customer request');
    });

    it('should fail to cancel already cancelled subscription', async () => {
      const res = await request(app)
        .put(`/api/amc/subscriptions/${testSubscription.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cancellationReason: 'Test' });

      expect(res.statusCode).toBe(400);
    });
  });

  // ============ AMC VISITS TESTS ============
  describe('POST /api/amc/visits', () => {
    beforeAll(async () => {
      // Create a new active subscription for visit tests
      const newSubscription = await AmcSubscription.create({
        subscriptionNumber: 'SUB-TEST001',
        customerId: testCustomer.id,
        planId: testPlan.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
        paymentMode: 'cash',
        amountPaid: 5000,
        gstAmount: 900,
        totalAmount: 5900,
        visitsUsed: 0,
        visitsRemaining: testPlan.numberOfVisits
      });
      testSubscription = newSubscription;
    });

    it('should create a new AMC visit', async () => {
      const visitData = {
        subscriptionId: testSubscription.id,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Scheduled maintenance visit'
      };

      const res = await request(app)
        .post('/api/amc/visits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(visitData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('visitNumber');
      expect(res.body.data.visitNumber).toMatch(/^VISIT-\d{8}$/);
      expect(res.body.data).toHaveProperty('status', 'scheduled');

      testVisit = res.body.data;
    });

    it('should fail without subscription', async () => {
      const res = await request(app)
        .post('/api/amc/visits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduledDate: new Date().toISOString().split('T')[0]
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/amc/visits', () => {
    it('should get all visits', async () => {
      const res = await request(app)
        .get('/api/amc/visits')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter visits by subscription', async () => {
      const res = await request(app)
        .get('/api/amc/visits')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ subscriptionId: testSubscription.id });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should filter visits by status', async () => {
      const res = await request(app)
        .get('/api/amc/visits')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'scheduled' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('PUT /api/amc/visits/:id', () => {
    it('should update visit status to completed', async () => {
      const updateData = {
        status: 'completed',
        actualDate: new Date().toISOString().split('T')[0],
        servicePerformed: 'Full maintenance',
        partsReplaced: [
          { part: 'Filter', quantity: 2 }
        ],
        technicianNotes: 'All systems working properly'
      };

      const res = await request(app)
        .put(`/api/amc/visits/${testVisit.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'completed');
      expect(res.body.data).toHaveProperty('servicePerformed', updateData.servicePerformed);
    });
  });

  // ============ AMC STATS TESTS ============
  describe('GET /api/amc/stats', () => {
    it('should get AMC statistics', async () => {
      const res = await request(app)
        .get('/api/amc/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalSubscriptions');
      expect(res.body.data).toHaveProperty('activeSubscriptions');
      expect(res.body.data).toHaveProperty('expiredSubscriptions');
      expect(res.body.data).toHaveProperty('pendingVisits');
      expect(res.body.data).toHaveProperty('completedVisits');
      expect(typeof res.body.data.totalSubscriptions).toBe('number');
    });
  });
});
