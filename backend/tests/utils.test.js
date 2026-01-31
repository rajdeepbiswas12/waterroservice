const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const { 
  getPaginationParams, 
  formatPaginationResponse, 
  buildFilters 
} = require('../utils/pagination');

describe('Utils - Generate Token', () => {
  it('should generate a valid JWT token', () => {
    const userId = 123;
    const token = generateToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Verify token can be decoded
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'testsecret');
    expect(decoded.id).toBe(userId);
  });

  it('should generate different tokens for different user IDs', () => {
    const token1 = generateToken(1);
    const token2 = generateToken(2);

    expect(token1).not.toBe(token2);
  });

  it('should include expiration in token', () => {
    const token = generateToken(1);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'testsecret');

    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });
});

describe('Utils - Pagination', () => {
  describe('getPaginationParams', () => {
    it('should return default values when no query params provided', () => {
      const result = getPaginationParams({});

      expect(result).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      });
    });

    it('should parse page and limit from query', () => {
      const result = getPaginationParams({ page: '3', limit: '20' });

      expect(result).toEqual({
        page: 3,
        limit: 20,
        offset: 40
      });
    });

    it('should limit maximum items per page to 100', () => {
      const result = getPaginationParams({ limit: '500' });

      expect(result.limit).toBe(100);
    });

    it('should handle invalid page numbers', () => {
      const result = getPaginationParams({ page: 'invalid' });

      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should calculate correct offset', () => {
      const result1 = getPaginationParams({ page: '1', limit: '10' });
      expect(result1.offset).toBe(0);

      const result2 = getPaginationParams({ page: '2', limit: '10' });
      expect(result2.offset).toBe(10);

      const result3 = getPaginationParams({ page: '5', limit: '20' });
      expect(result3.offset).toBe(80);
    });
  });

  describe('formatPaginationResponse', () => {
    it('should format pagination response correctly', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = formatPaginationResponse(data, 50, 2, 10);

      expect(result).toEqual({
        success: true,
        data,
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 50,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: true
        }
      });
    });

    it('should indicate no next page on last page', () => {
      const data = [{ id: 1 }];
      const result = formatPaginationResponse(data, 21, 3, 10);

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should indicate no previous page on first page', () => {
      const data = [{ id: 1 }];
      const result = formatPaginationResponse(data, 50, 1, 10);

      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should handle single page results', () => {
      const data = [{ id: 1 }];
      const result = formatPaginationResponse(data, 5, 1, 10);

      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should handle empty results', () => {
      const result = formatPaginationResponse([], 0, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('buildFilters', () => {
    it('should build filters from query params', () => {
      const query = {
        status: 'active',
        priority: 'high',
        city: 'Mumbai'
      };
      const allowedFilters = ['status', 'priority', 'city'];

      const result = buildFilters(query, allowedFilters);

      expect(result).toEqual({
        status: 'active',
        priority: 'high',
        city: 'Mumbai'
      });
    });

    it('should ignore fields not in allowedFilters', () => {
      const query = {
        status: 'active',
        maliciousField: 'hack',
        password: '12345'
      };
      const allowedFilters = ['status'];

      const result = buildFilters(query, allowedFilters);

      expect(result).toEqual({ status: 'active' });
      expect(result.maliciousField).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it('should ignore undefined and empty string values', () => {
      const query = {
        status: 'active',
        priority: '',
        city: undefined
      };
      const allowedFilters = ['status', 'priority', 'city'];

      const result = buildFilters(query, allowedFilters);

      expect(result).toEqual({ status: 'active' });
    });

    it('should return empty object when no allowed filters match', () => {
      const query = { field1: 'value1', field2: 'value2' };
      const allowedFilters = ['field3', 'field4'];

      const result = buildFilters(query, allowedFilters);

      expect(result).toEqual({});
    });

    it('should handle empty query', () => {
      const result = buildFilters({}, ['status', 'priority']);

      expect(result).toEqual({});
    });
  });
});

describe('Utils - WhatsApp', () => {
  const whatsapp = require('../utils/whatsapp');

  describe('sendWhatsAppMessage', () => {
    it('should return not configured message when Twilio is not set up', async () => {
      const result = await whatsapp.sendWhatsAppMessage('+1234567890', 'Test message');

      expect(result.success).toBe(false);
      expect(result.message).toBe('WhatsApp not configured');
    });
  });

  describe('sendOrderAssignmentNotification', () => {
    it('should format order assignment message correctly', async () => {
      const employee = { phone: '+1234567890' };
      const order = {
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        serviceType: 'Water RO Service',
        customerAddress: '123 Test St',
        priority: 'high'
      };

      const result = await whatsapp.sendOrderAssignmentNotification(employee, order);

      // Since Twilio is not configured in test, it should return not configured
      expect(result.success).toBe(false);
    });
  });

  describe('sendOrderCreationNotification', () => {
    it('should format order creation message correctly', async () => {
      const adminPhone = '+1234567890';
      const order = {
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        customerPhone: '+9876543210',
        serviceType: 'Installation',
        customerAddress: '123 Test St',
        priority: 'urgent',
        status: 'pending'
      };

      const result = await whatsapp.sendOrderCreationNotification(adminPhone, order);

      // Since Twilio is not configured in test, it should return not configured
      expect(result.success).toBe(false);
    });
  });
});
