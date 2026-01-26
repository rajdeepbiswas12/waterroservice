const { User, Order, OrderHistory } = require('../models');
const bcrypt = require('bcryptjs');

describe('Models', () => {
  describe('User Model', () => {
    let testUser;

    afterAll(async () => {
      if (testUser) {
        await User.destroy({ where: { id: testUser.id } });
      }
    });

    it('should create a new user', async () => {
      testUser = await User.create({
        name: 'Model Test User',
        email: 'modeltest@test.com',
        password: 'Test@123',
        phone: '+1234567890',
        role: 'employee'
      });

      expect(testUser).toHaveProperty('id');
      expect(testUser.name).toBe('Model Test User');
      expect(testUser.email).toBe('modeltest@test.com');
      expect(testUser.role).toBe('employee');
      expect(testUser.isActive).toBe(true);
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'Test@123';
      const user = await User.create({
        name: 'Hash Test User',
        email: 'hashtest@test.com',
        password: plainPassword,
        phone: '+9876543210',
        role: 'employee'
      });

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/);

      // Cleanup
      await User.destroy({ where: { id: user.id } });
    });

    it('should match password correctly', async () => {
      const isMatch = await testUser.matchPassword('Test@123');
      expect(isMatch).toBe(true);

      const isNotMatch = await testUser.matchPassword('WrongPassword');
      expect(isNotMatch).toBe(false);
    });

    it('should fail to create user with duplicate email', async () => {
      await expect(
        User.create({
          name: 'Duplicate User',
          email: 'modeltest@test.com',
          password: 'Test@123',
          phone: '+1111111111',
          role: 'employee'
        })
      ).rejects.toThrow();
    });

    it('should fail to create user without required fields', async () => {
      await expect(
        User.create({
          name: 'Incomplete User',
          email: 'incomplete@test.com'
        })
      ).rejects.toThrow();
    });

    it('should enforce role enum values', async () => {
      await expect(
        User.create({
          name: 'Invalid Role User',
          email: 'invalidrole@test.com',
          password: 'Test@123',
          phone: '+2222222222',
          role: 'invalid_role'
        })
      ).rejects.toThrow();
    });
  });

  describe('Order Model', () => {
    let testUser;
    let testOrder;

    beforeAll(async () => {
      testUser = await User.create({
        name: 'Order Test User',
        email: 'ordermodel@test.com',
        password: 'Test@123',
        phone: '+1234567890',
        role: 'admin'
      });
    });

    afterAll(async () => {
      if (testOrder) {
        await OrderHistory.destroy({ where: { orderId: testOrder.id } });
        await Order.destroy({ where: { id: testOrder.id } });
      }
      await User.destroy({ where: { id: testUser.id } });
    });

    it('should create a new order', async () => {
      testOrder = await Order.create({
        orderNumber: 'TEST-' + Date.now(),
        customerName: 'Test Customer',
        customerPhone: '+1234567890',
        customerEmail: 'customer@test.com',
        customerAddress: '123 Test St',
        latitude: 40.7128,
        longitude: -74.0060,
        serviceType: 'Installation',
        status: 'pending',
        priority: 'medium',
        description: 'Test order',
        assignedById: testUser.id
      });

      expect(testOrder).toHaveProperty('id');
      expect(testOrder.orderNumber).toContain('TEST-');
      expect(testOrder.status).toBe('pending');
      expect(testOrder.priority).toBe('medium');
    });

    it('should have default values', async () => {
      const order = await Order.create({
        orderNumber: 'TEST-DEFAULT-' + Date.now(),
        customerName: 'Default Test',
        customerPhone: '+1234567890',
        customerAddress: '456 Test Ave',
        serviceType: 'Repair'
      });

      expect(order.status).toBe('pending');
      expect(order.priority).toBe('medium');

      // Cleanup
      await Order.destroy({ where: { id: order.id } });
    });

    it('should enforce status enum values', async () => {
      await expect(
        Order.create({
          orderNumber: 'TEST-INVALID-' + Date.now(),
          customerName: 'Invalid Status',
          customerPhone: '+1234567890',
          customerAddress: '789 Test Blvd',
          serviceType: 'Maintenance',
          status: 'invalid_status'
        })
      ).rejects.toThrow();
    });

    it('should enforce priority enum values', async () => {
      await expect(
        Order.create({
          orderNumber: 'TEST-INVALID-PRI-' + Date.now(),
          customerName: 'Invalid Priority',
          customerPhone: '+1234567890',
          customerAddress: '789 Test Blvd',
          serviceType: 'Maintenance',
          priority: 'invalid_priority'
        })
      ).rejects.toThrow();
    });
  });

  describe('OrderHistory Model', () => {
    let testUser;
    let testOrder;
    let testHistory;

    beforeAll(async () => {
      testUser = await User.create({
        name: 'History Test User',
        email: 'historytest@test.com',
        password: 'Test@123',
        phone: '+1234567890',
        role: 'admin'
      });

      testOrder = await Order.create({
        orderNumber: 'HIST-' + Date.now(),
        customerName: 'History Customer',
        customerPhone: '+1234567890',
        customerAddress: '123 History St',
        serviceType: 'Installation',
        assignedById: testUser.id
      });
    });

    afterAll(async () => {
      if (testHistory) {
        await OrderHistory.destroy({ where: { id: testHistory.id } });
      }
      await Order.destroy({ where: { id: testOrder.id } });
      await User.destroy({ where: { id: testUser.id } });
    });

    it('should create order history', async () => {
      testHistory = await OrderHistory.create({
        orderId: testOrder.id,
        userId: testUser.id,
        action: 'Created',
        newStatus: 'pending',
        description: 'Order created'
      });

      expect(testHistory).toHaveProperty('id');
      expect(testHistory.orderId).toBe(testOrder.id);
      expect(testHistory.action).toBe('Created');
    });

    it('should store metadata as JSON', async () => {
      const history = await OrderHistory.create({
        orderId: testOrder.id,
        userId: testUser.id,
        action: 'Status Changed',
        oldStatus: 'pending',
        newStatus: 'assigned',
        metadata: { notes: 'Assigned to employee', priority: 'high' }
      });

      expect(history.metadata).toBeInstanceOf(Object);
      expect(history.metadata).toHaveProperty('notes');
      expect(history.metadata).toHaveProperty('priority', 'high');

      // Cleanup
      await OrderHistory.destroy({ where: { id: history.id } });
    });

    it('should require orderId', async () => {
      await expect(
        OrderHistory.create({
          userId: testUser.id,
          action: 'Test Action'
        })
      ).rejects.toThrow();
    });
  });

  describe('Model Associations', () => {
    let admin;
    let employee;
    let order;

    beforeAll(async () => {
      admin = await User.create({
        name: 'Association Admin',
        email: 'assoc.admin@test.com',
        password: 'Test@123',
        phone: '+1234567890',
        role: 'admin'
      });

      employee = await User.create({
        name: 'Association Employee',
        email: 'assoc.employee@test.com',
        password: 'Test@123',
        phone: '+9876543210',
        role: 'employee'
      });
    });

    afterAll(async () => {
      if (order) {
        await OrderHistory.destroy({ where: { orderId: order.id } });
        await Order.destroy({ where: { id: order.id } });
      }
      await User.destroy({ where: { id: [admin.id, employee.id] } });
    });

    it('should associate order with users', async () => {
      order = await Order.create({
        orderNumber: 'ASSOC-' + Date.now(),
        customerName: 'Association Customer',
        customerPhone: '+1234567890',
        customerAddress: '123 Assoc St',
        serviceType: 'Installation',
        assignedById: admin.id,
        assignedToId: employee.id
      });

      const orderWithUsers = await Order.findByPk(order.id, {
        include: [
          { model: User, as: 'assignedBy' },
          { model: User, as: 'assignedTo' }
        ]
      });

      expect(orderWithUsers.assignedBy.email).toBe('assoc.admin@test.com');
      expect(orderWithUsers.assignedTo.email).toBe('assoc.employee@test.com');
    });

    it('should get order history with associations', async () => {
      await OrderHistory.create({
        orderId: order.id,
        userId: admin.id,
        action: 'Assigned',
        newStatus: 'assigned',
        description: 'Assigned to employee'
      });

      const history = await OrderHistory.findAll({
        where: { orderId: order.id },
        include: [User, Order]
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].User.email).toBe('assoc.admin@test.com');
    });
  });
});
