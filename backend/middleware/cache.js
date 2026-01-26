const { cacheService } = require('../config/redis');

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 */
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis is not available
    if (!cacheService.isAvailable()) {
      return next();
    }

    try {
      // Generate cache key from URL and query params
      const cacheKey = `cache:${req.originalUrl || req.url}`;
      
      // Try to get cached response
      const cachedResponse = await cacheService.get(cacheKey);
      
      if (cachedResponse) {
        console.log(`Cache HIT: ${cacheKey}`);
        return res.status(200).json(cachedResponse);
      }

      console.log(`Cache MISS: ${cacheKey}`);
      
      // Store original res.json function
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode === 200 && body.success !== false) {
          cacheService.set(cacheKey, body, duration).catch(err => {
            console.warn('Cache set error:', err.message);
          });
        }
        return originalJson(body);
      };
      
      next();
    } catch (error) {
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Clear cache by pattern
 */
const clearCache = (pattern = '*') => {
  return async (req, res, next) => {
    try {
      if (cacheService.isAvailable()) {
        await cacheService.delPattern(`cache:${pattern}`);
        console.log(`Cache cleared: ${pattern}`);
      }
    } catch (error) {
      console.warn('Clear cache error:', error.message);
    }
    next();
  };
};

module.exports = {
  cacheMiddleware,
  clearCache
};
