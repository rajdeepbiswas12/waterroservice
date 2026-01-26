const request = require('supertest');
const app = require('../server');
const { User, Order, OrderHistory } = require('../models');
const bcrypt = require('bcryptjs');

describe('Order Endpoints', () => {
  let adminToken;
  let employeeToken;
  let testAdmin;
  let testEmployee;
  let testOrder;

  beforeAll(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    testAdmin = await User.create({
      name: 'Test Admin Order',
      email: 'orderadmin@test.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      isActive: true
    });

    testEmployee = await User.create({
      name: 'Test Employee',
      email: 'employee@test.com',
      password: hashedPassword,
      phone: '+9876543210',
      role: 'employee',
      isActive: true
    });

    // Login to get tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'orderadmin@test.com', password: 'Test@123' });
    adminToken = adminRes.body.token;

    const empRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@test.com', password: 'Test@123' });
    employeeToken = empRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await OrderHistory.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await User.destroy({ where: { email: ['orderadmin@test.com', 'employee@test.com'] } });
  });

  describe('POST /api/orders', () => {
    it('should create new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          customerEmail: 'john@example.com',
          customerAddress: '123 Main St, City',
          latitude: 40.7128,
          longitude: -74.0060,
          serviceType: 'Installation',
          priority: 'high',
          description: 'New RO system installation',
          scheduledDate: new Date(Date.now() + 86400000).toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.order).toHaveProperty('orderNumber');
      expect(res.body.order).toHaveProperty('customerName', 'John Doe');
      expect(res.body.order).toHaveProperty('status', 'pending');

      testOrder = res.body.order;
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerName: 'Jane Doe'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should allow employee to create order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerName: 'Jane Smith',
          customerPhone: '+1234567891',
          customerAddress: '456 Oak Ave, City',
          serviceType: 'Repair',
          priority: 'medium'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/orders', () => {
    it('should get all orders for admin', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count');
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const res = await request(app)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      res.body.orders.forEach(order => {
        expect(order.status).toBe('pending');
      });
    });

    it('should filter orders by priority', async () => {
      const res = await request(app)
        .get('/api/orders?priority=high')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      res.body.orders.forEach(order => {
        expect(order.priority).toBe('high');
      });
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get single order by id', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.order).toHaveProperty('id', testOrder.id);
      expect(res.body.order).toHaveProperty('customerName', 'John Doe');
    });

    it('should fail with invalid order id', async () => {
      const res = await request(app)
        .get('/api/orders/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update order', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          priority: 'urgent',
          description: 'Updated description - urgent installation'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.order).toHaveProperty('priority', 'urgent');
    });
  });

  describe('PUT /api/orders/:id/assign', () => {
    it('should assign order to employee', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: testEmployee.id
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.order).toHaveProperty('status', 'assigned');
      expect(res.body.order).toHaveProperty('assignedToId', testEmployee.id);
    });

    it('should fail with invalid employee id', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: 99999
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'in-progress',
          notes: 'Work started on installation'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.order).toHaveProperty('status', 'in-progress');
    });

    it('should fail with invalid status', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid-status'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/orders/:id/history', () => {
    it('should get order history', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrder.id}/history`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/orders/dashboard/stats', () => {
    it('should get dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/orders/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.stats).toHaveProperty('totalOrders');
      expect(res.body.stats).toHaveProperty('ordersByStatus');
      expect(res.body.stats).toHaveProperty('ordersByPriority');
      expect(res.body.stats).toHaveProperty('recentOrders');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should delete order (admin only)', async () => {
      const res = await request(app)
        .delete(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Order deleted successfully');
    });

    it('should fail to delete non-existent order', async () => {
      const res = await request(app)
        .delete('/api/orders/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
