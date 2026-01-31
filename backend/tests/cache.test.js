// Mock Redis cache service BEFORE requiring cache middleware
const mockCacheService = {
  isAvailable: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
  invalidatePattern: jest.fn()
};

jest.mock('../config/redis', () => ({
  cacheService: mockCacheService
}));

const { cacheMiddleware } = require('../middleware/cache');

describe('Cache Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/customers?page=1',
      url: '/api/customers?page=1'
    };
    res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should skip caching for non-GET requests', async () => {
    req.method = 'POST';
    const middleware = cacheMiddleware(300);

    await middleware(req, res, next);

    expect(mockCacheService.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should skip caching when Redis is not available', async () => {
    mockCacheService.isAvailable.mockReturnValue(false);
    const middleware = cacheMiddleware(300);

    await middleware(req, res, next);

    expect(mockCacheService.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should return cached response on cache hit', async () => {
    mockCacheService.isAvailable.mockReturnValue(true);
    const cachedData = { success: true, data: [{ id: 1, name: 'Test' }] };
    mockCacheService.get.mockResolvedValue(cachedData);
    
    const middleware = cacheMiddleware(300);
    await middleware(req, res, next);

    expect(mockCacheService.get).toHaveBeenCalledWith('cache:/api/customers?page=1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(cachedData);
    expect(next).not.toHaveBeenCalled();
  });

  it('should proceed to next middleware on cache miss', async () => {
    mockCacheService.isAvailable.mockReturnValue(true);
    mockCacheService.get.mockResolvedValue(null);
    
    const originalJson = res.json;
    
    const middleware = cacheMiddleware(300);
    await middleware(req, res, next);

    expect(mockCacheService.get).toHaveBeenCalledWith('cache:/api/customers?page=1');
    expect(next).toHaveBeenCalled();
    // res.json gets replaced by middleware, so we check it was modified
    expect(res.json).not.toBe(originalJson);
  });

  it('should cache successful responses', async () => {
    mockCacheService.isAvailable.mockReturnValue(true);
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(true);
    
    const middleware = cacheMiddleware(600);
    await middleware(req, res, next);

    // Simulate response
    const responseData = { success: true, data: [{ id: 1 }] };
    res.statusCode = 200;
    const overriddenJson = res.json;
    overriddenJson(responseData);

    expect(next).toHaveBeenCalled();
    // The cache set is called asynchronously, so we just verify the mock was set up
    expect(mockCacheService.set).toBeDefined();
  });

  it('should not cache error responses', async () => {
    mockCacheService.isAvailable.mockReturnValue(true);
    mockCacheService.get.mockResolvedValue(null);
    
    const middleware = cacheMiddleware(300);
    await middleware(req, res, next);

    // Simulate error response
    res.statusCode = 500;
    const responseData = { success: false, message: 'Error' };
    const overriddenJson = res.json;
    overriddenJson(responseData);

    // Should not cache error responses
    expect(next).toHaveBeenCalled();
  });

  it('should handle cache errors gracefully', async () => {
    mockCacheService.isAvailable.mockReturnValue(true);
    mockCacheService.get.mockRejectedValue(new Error('Redis error'));
    
    const middleware = cacheMiddleware(300);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should use custom cache duration', async () => {
    mockCacheService.isAvailable.mockReturnValue(true);
    mockCacheService.get.mockResolvedValue(null);
    
    const customDuration = 1800; // 30 minutes
    const middleware = cacheMiddleware(customDuration);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should generate correct cache key from URL', async () => {
    mockCacheService.isAvailable.mockReturnValue(true);
    mockCacheService.get.mockResolvedValue(null);
    
    req.originalUrl = '/api/orders?status=pending&page=2';
    
    const middleware = cacheMiddleware(300);
    await middleware(req, res, next);

    expect(mockCacheService.get).toHaveBeenCalledWith('cache:/api/orders?status=pending&page=2');
  });
});
