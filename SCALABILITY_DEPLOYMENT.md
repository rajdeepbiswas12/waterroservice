# Scalable Deployment Guide - RO Service Application

## New Scalability Features ✨

This guide covers the deployment of the newly added scalability features.

### Backend Enhancements
- ✅ Redis caching layer (optional, graceful fallback)
- ✅ Rate limiting (auth, API, order creation)  
- ✅ Database connection pooling (5-20 connections, configurable up to 100)
- ✅ Pagination for all list endpoints
- ✅ Database indexes for performance
- ✅ Cluster mode for multi-core systems
- ✅ Security headers (Helmet.js)
- ✅ Response compression (Gzip)
- ✅ Winston logging with file rotation
- ✅ Graceful shutdown handling
- ✅ Health check & metrics endpoints (`/api/health`, `/api/metrics`)

---

## Quick Start (No Redis Required)

The application **works perfectly without Redis**. Redis is optional for caching.

### Start Backend
```bash
cd backend
npm install
npm start
```

If Redis is not installed:
- ⚠️ Warning appears in logs
- ✅ Application continues normally
- ✅ All features work
- ❌ Caching is skipped

### Install Redis (Optional, Recommended)
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

---

## Environment Configuration

### Development (.env)
```env
NODE_ENV=development
CLUSTER_MODE=false
DB_POOL_MAX=20
DB_POOL_MIN=5
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Production (.env.production)
```env
NODE_ENV=production
CLUSTER_MODE=true       # Multi-process mode
DB_POOL_MAX=50          # More connections
DB_POOL_MIN=10
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
LOG_LEVEL=info
```

---

## Pagination Usage

All list endpoints now support pagination:

```bash
# Get orders with pagination
GET /api/orders?page=1&limit=10&sortBy=createdAt&sortOrder=DESC

# Search with pagination
GET /api/orders?search=john&page=1&limit=20

# Filter with pagination
GET /api/orders?status=pending&priority=high&page=1&limit=10
```

Response format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Caching Strategy

### Cached Endpoints
- Dashboard stats: 5 minutes (300s)
- Monthly stats: 15 minutes (900s)
- Orders list: 2 minutes (120s)
- Single order: 5 minutes (300s)
- Users list: 5 minutes (300s)

### Cache Invalidation
Cache is automatically cleared when:
- Creating new order
- Updating order
- Deleting order
- Updating user
- Deleting user

---

## Rate Limiting

### Limits Applied
- **General API**: 100 requests per 15 minutes per IP
- **Authentication (login)**: 5 attempts per 15 minutes per IP
- **Order Creation**: 10 orders per hour per IP

### Response When Limited
```json
{
  "success": false,
  "message": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

---

## Monitoring Endpoints

### Health Check
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-26T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

### Performance Metrics
```bash
curl http://localhost:5000/api/metrics
```

Response:
```json
{
  "success": true,
  "metrics": {
    "uptime": 3600,
    "memory": {
      "rss": "150 MB",
      "heapTotal": "80 MB",
      "heapUsed": "60 MB"
    },
    "cpu": {...},
    "nodeVersion": "v18.19.1",
    "platform": "linux",
    "pid": 12345
  }
}
```

---

## Database Optimization

### Indexes Created Automatically
The application creates these indexes on startup:

**Users Table:**
- email, role, isActive, phone

**Orders Table:**
- status, priority, createdAt, completedDate
- assignedToId, assignedById, serviceType
- Composite: (status, createdAt), (assignedToId, status)

**OrderHistory Table:**
- orderId, changedById, createdAt

### Connection Pool
- Configured via environment variables
- Min: 5 connections (development), 10 (production)
- Max: 20 connections (development), 50+ (production)
- Auto-scaling based on load

---

## Production Deployment with PM2

### Install PM2
```bash
npm install -g pm2
```

### Start Backend (Cluster Mode)
```bash
cd backend
pm2 start server.js --name ro-service-api -i max
```

This will:
- Start one process per CPU core
- Auto-restart on crashes
- Load balance across processes
- Enable hot reload

### Monitor
```bash
pm2 monit              # Real-time dashboard
pm2 logs ro-service-api # View logs
pm2 describe ro-service-api # Details
```

### Save Configuration
```bash
pm2 save
pm2 startup  # Auto-start on boot
```

---

## Load Testing

### Apache Bench
```bash
ab -n 1000 -c 10 http://localhost:5000/api/health
```

### Artillery
```bash
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:5000/api/orders
```

---

## Scaling Strategies

### Horizontal Scaling (Multiple Servers)
1. Run multiple backend instances on different ports
2. Use Nginx for load balancing
3. Share Redis instance across all backends
4. Use same database for all instances

### Vertical Scaling (Single Server)
1. Enable `CLUSTER_MODE=true`
2. Increase `DB_POOL_MAX`
3. Add more RAM for Redis cache
4. Optimize MySQL configuration

---

## Troubleshooting

### Redis Connection Issues
- Check if Redis is running: `redis-cli ping`
- Verify REDIS_HOST and REDIS_PORT in .env
- Application continues without Redis (with warning)

### Database Connection Pool Exhausted
- Increase DB_POOL_MAX in .env
- Check for long-running queries
- Monitor connection usage in logs

### High Memory Usage
- Reduce cache TTL
- Decrease DB_POOL_MAX
- Check for memory leaks in PM2 dashboard

### Rate Limiting Blocking Users
- Adjust limits in `backend/middleware/rateLimiter.js`
- Whitelist specific IPs if needed
- Check if legitimate traffic is being blocked

---

## Logs

### Location
- Combined logs: `backend/logs/combined.log`
- Error logs: `backend/logs/error.log`

### Log Rotation
- Max size: 5MB per file
- Keep: 5 files
- Automatic rotation

### View Logs
```bash
# Tail logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# View with PM2
pm2 logs ro-service-api
```

---

## Security Checklist

- [x] Helmet.js security headers enabled
- [x] Rate limiting configured
- [x] CORS restricted to frontend URL
- [x] Request size limits (10MB)
- [x] Compression enabled
- [ ] Change JWT_SECRET in production
- [ ] Enable HTTPS
- [ ] Configure Redis password
- [ ] Set up firewall rules

---

## Next Steps

1. ✅ Backend scalability implemented
2. ✅ Database optimized with indexes
3. ✅ Caching layer added (optional)
4. ✅ Rate limiting configured
5. ⏳ Frontend pagination UI (update components)
6. ⏳ Lazy loading for Angular routes
7. ⏳ Production deployment

For complete documentation, see [SCALABILITY.md](./SCALABILITY.md)
