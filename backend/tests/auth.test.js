const request = require('supertest');
const app = require('../server');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

describe('Authentication Endpoints', () => {
  let adminToken;
  let testAdmin;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await bcrypt.hash('TestAdmin@123', 10);
    testAdmin = await User.create({
      name: 'Test Admin',
      email: 'testadmin@test.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      isActive: true
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.destroy({ where: { email: 'testadmin@test.com' } });
    await User.destroy({ where: { email: 'newuser@test.com' } });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@test.com',
          password: 'TestAdmin@123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'testadmin@test.com');
      expect(res.body.user).toHaveProperty('role', 'admin');
      expect(res.body.user).not.toHaveProperty('password');

      adminToken = res.body.token;
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestAdmin@123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@test.com',
          password: 'WrongPassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@test.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/register', () => {
    beforeAll(async () => {
      // Login to get admin token
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@test.com',
          password: 'TestAdmin@123'
        });
      adminToken = res.body.token;
    });

    it('should register new user with admin token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'NewUser@123',
          phone: '+9876543210',
          role: 'employee'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'newuser@test.com');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@test.com',
          password: 'Test@123',
          phone: '+1111111111',
          role: 'employee'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate User',
          email: 'newuser@test.com',
          password: 'Test@123',
          phone: '+2222222222',
          role: 'employee'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('email', 'testadmin@test.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/auth/update-password', () => {
    it('should update password with valid current password', async () => {
      const res = await request(app)
        .put('/api/auth/update-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'TestAdmin@123',
          newPassword: 'NewTestAdmin@123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Password updated successfully');

      // Reset password back
      await testAdmin.update({ 
        password: await bcrypt.hash('TestAdmin@123', 10) 
      });
    });

    it('should fail with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/auth/update-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewTestAdmin@123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Current password is incorrect');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .put('/api/auth/update-password')
        .send({
          currentPassword: 'TestAdmin@123',
          newPassword: 'NewTestAdmin@123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
