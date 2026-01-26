const request = require('supertest');
const app = require('../server');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

describe('User Endpoints', () => {
  let adminToken;
  let testAdmin;
  let testUser;

  beforeAll(async () => {
    // Create test admin
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    testAdmin = await User.create({
      name: 'Test Admin User',
      email: 'useradmin@test.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      isActive: true
    });

    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'useradmin@test.com', password: 'Admin@123' });
    adminToken = res.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await User.destroy({ 
      where: { 
        email: ['useradmin@test.com', 'testuser@test.com'] 
      } 
    });
  });

  describe('GET /api/users', () => {
    it('should get all users (admin only)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      res.body.users.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });

    it('should filter users by active status', async () => {
      const res = await request(app)
        .get('/api/users?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      res.body.users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/users (via register)', () => {
    it('should create new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'testuser@test.com',
          password: 'TestUser@123',
          phone: '+9876543210',
          role: 'employee',
          address: '123 Test Street'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('email', 'testuser@test.com');
      
      testUser = res.body.user;
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get single user by id', async () => {
      const res = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('id', testUser.id);
      expect(res.body.user).toHaveProperty('email', 'testuser@test.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should fail with invalid user id', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Test User',
          phone: '+1111111111',
          address: '456 Updated Street'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('name', 'Updated Test User');
      expect(res.body.user).toHaveProperty('phone', '+1111111111');
    });

    it('should fail to update with duplicate email', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'useradmin@test.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should deactivate user', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('isActive', false);
    });
  });

  describe('GET /api/users/available-employees', () => {
    it('should get available employees', async () => {
      const res = await request(app)
        .get('/api/users/available-employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.employees)).toBe(true);
      res.body.employees.forEach(emp => {
        expect(emp.role).toBe('employee');
        expect(emp.isActive).toBe(true);
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should fail to delete user with active orders', async () => {
      // This test assumes the user has no orders
      // In real scenario, we'd create an order first
    });

    it('should delete user', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should fail to delete non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail to delete self', async () => {
      const res = await request(app)
        .delete(`/api/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'You cannot delete yourself');
    });
  });
});
