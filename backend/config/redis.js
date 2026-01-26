const Redis = require('ioredis');
require('dotenv').config();

// Redis configuration with fallback
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
};

// Create Redis client
const redis = new Redis(redisConfig);

// Event handlers
redis.on('connect', () => {
  console.log('✓ Redis client connected');
});

redis.on('ready', () => {
  console.log('✓ Redis client ready');
});

redis.on('error', (err) => {
  console.warn('⚠ Redis connection error (app will work without caching):', err.message);
});

redis.on('close', () => {
  console.log('✗ Redis connection closed');
});

// Connect to Redis (non-blocking)
redis.connect().catch(err => {
  console.warn('⚠ Redis not available, caching disabled:', err.message);
});

// Cache wrapper with fallback
const cacheService = {
  // Get cached data
  async get(key) {
    try {
      if (redis.status !== 'ready') return null;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  },

  // Set cached data with expiration
  async set(key, value, expirationInSeconds = 300) {
    try {
      if (redis.status !== 'ready') return false;
      await redis.setex(key, expirationInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Cache set error:', error.message);
      return false;
    }
  },

  // Delete cached data
  async del(key) {
    try {
      if (redis.status !== 'ready') return false;
      await redis.del(key);
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error.message);
      return false;
    }
  },

  // Delete keys by pattern
  async delPattern(pattern) {
    try {
      if (redis.status !== 'ready') return false;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.warn('Cache delete pattern error:', error.message);
      return false;
    }
  },

  // Flush all cache
  async flushAll() {
    try {
      if (redis.status !== 'ready') return false;
      await redis.flushall();
      return true;
    } catch (error) {
      console.warn('Cache flush error:', error.message);
      return false;
    }
  },

  // Check if Redis is available
  isAvailable() {
    return redis.status === 'ready';
  }
};

module.exports = { redis, cacheService };
