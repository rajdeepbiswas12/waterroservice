const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');
const { User } = require('../models');

// Mock the models
jest.mock('../models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('should fail if no token is provided', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail if token does not start with Bearer', async () => {
      req.headers.authorization = 'InvalidToken';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalidtoken';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail if user does not exist', async () => {
      const token = jwt.sign({ id: 999 }, process.env.JWT_SECRET || 'testsecret');
      req.headers.authorization = `Bearer ${token}`;
      User.findByPk.mockResolvedValue(null);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail if user account is inactive', async () => {
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'testsecret');
      req.headers.authorization = `Bearer ${token}`;
      User.findByPk.mockResolvedValue({
        id: 1,
        isActive: false,
        name: 'Test User'
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User account is inactive'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass if token is valid and user is active', async () => {
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'testsecret');
      req.headers.authorization = `Bearer ${token}`;
      const mockUser = {
        id: 1,
        isActive: true,
        name: 'Test User',
        role: 'admin'
      };
      User.findByPk.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should fail if user role is not authorized', () => {
      req.user = { role: 'employee' };
      const authMiddleware = authorize('admin');

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User role 'employee' is not authorized to access this route"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass if user has required role', () => {
      req.user = { role: 'admin' };
      const authMiddleware = authorize('admin');

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass if user has one of multiple required roles', () => {
      req.user = { role: 'employee' };
      const authMiddleware = authorize('admin', 'employee');

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
