const request = require('supertest');
const app = require('../server');
const { User, Customer, Order } = require('../models');
const bcrypt = require('bcryptjs');

describe('Customer API Endpoints', () => {
  let adminToken;
  let testAdmin;
  let testCustomer;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await bcrypt.hash('TestAdmin@123', 10);
    testAdmin = await User.create({
      name: 'Test Admin',
      email: 'customertest@test.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      isActive: true
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customertest@test.com',
        password: 'TestAdmin@123'
      });
    
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    if (testCustomer) {
      await Order.destroy({ where: { customerId: testCustomer.id } });
      await Customer.destroy({ where: { id: testCustomer.id } });
    }
    await User.destroy({ where: { email: 'customertest@test.com' } });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer with valid data', async () => {
      const customerData = {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john.doe@test.com',
        alternatePhone: '9876543211',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '123456',
        customerType: 'residential',
        gstNumber: 'GST123456',
        notes: 'Test customer'
      };

      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(customerData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', customerData.name);
      expect(res.body.data).toHaveProperty('phone', customerData.phone);
      expect(res.body.data).toHaveProperty('customerNumber');
      expect(res.body.data.customerNumber).toMatch(/^CUST-\d{6}$/);

      testCustomer = res.body.data;
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({
          name: 'Test Customer',
          phone: '9876543210'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should fail with duplicate phone number', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Customer',
          phone: '9876543210', // Same as testCustomer
          address: '123 Test Street'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with invalid phone number', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Phone Customer',
          phone: '123', // Invalid phone
          address: '123 Test Street'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@test.com' // Missing name, phone, address
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/customers', () => {
    it('should get all customers with pagination', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 10);
    });

    it('should filter customers by search query', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'John' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should filter customers by status', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'active' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get customer by id with orders and subscriptions', async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', testCustomer.id);
      expect(res.body.data).toHaveProperty('name', testCustomer.name);
      expect(res.body.data).toHaveProperty('orders');
      expect(Array.isArray(res.body.data.orders)).toBe(true);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .get('/api/customers/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update customer details', async () => {
      const updateData = {
        name: 'John Doe Updated',
        email: 'john.updated@test.com',
        notes: 'Updated notes'
      };

      const res = await request(app)
        .put(`/api/customers/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', updateData.name);
      expect(res.body.data).toHaveProperty('email', updateData.email);
    });

    it('should fail to update non-existent customer', async () => {
      const res = await request(app)
        .put('/api/customers/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/customers/stats', () => {
    it('should get customer statistics', async () => {
      const res = await request(app)
        .get('/api/customers/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalCustomers');
      expect(res.body.data).toHaveProperty('activeCustomers');
      expect(res.body.data).toHaveProperty('inactiveCustomers');
      expect(res.body.data).toHaveProperty('topCustomers');
      expect(Array.isArray(res.body.data.topCustomers)).toBe(true);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should not delete customer with existing orders', async () => {
      // Create an order for the customer first
      const order = await Order.create({
        orderNumber: 'ORD-TEST-001',
        customerId: testCustomer.id,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        customerAddress: testCustomer.address,
        serviceType: 'Installation',
        status: 'pending',
        priority: 'medium'
      });

      const res = await request(app)
        .delete(`/api/customers/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);

      // Cleanup
      await Order.destroy({ where: { id: order.id } });
    });

    it('should delete customer without orders', async () => {
      // Create a new customer without orders
      const newCustomer = await Customer.create({
        customerNumber: 'CUST-999999',
        name: 'Delete Test Customer',
        phone: '9999999999',
        address: '123 Delete Street',
        status: 'active'
      });

      const res = await request(app)
        .delete(`/api/customers/${newCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
