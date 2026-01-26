const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const { createIndexes, analyzeTables } = require('./config/indexes');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(async () => {
  // Create indexes for better performance
  await createIndexes();
  // Analyze tables periodically (every 24 hours)
  setInterval(analyzeTables, 24 * 60 * 60 * 1000);
});

// Initialize Redis cache (non-blocking)
require('./config/redis');

// Route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// Compression middleware for responses
app.use(compression());

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS with credentials
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:4200',
      'http://localhost:4200',
      'http://localhost:44307',
      // Add network URLs dynamically
      `http://${getNetworkIP()}:4200`,
      `http://${getNetworkIP()}:44307`
    ];
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Health check route with detailed status
app.get('/api/health', async (req, res) => {
  const { cacheService } = require('./config/redis');
  const { sequelize } = require('./config/database');
  
  const health = {
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      cache: 'unknown'
    }
  };

  // Check database connection
  try {
    await sequelize.authenticate();
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.success = false;
  }

  // Check Redis connection
  health.services.cache = cacheService.isAvailable() ? 'connected' : 'disconnected';

  res.status(health.success ? 200 : 503).json(health);
});

// Performance metrics endpoint
app.get('/api/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    success: true,
    metrics: {
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
const CLUSTER_MODE = process.env.CLUSTER_MODE === 'true';

// Get network IP address
function getNetworkIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Don't start server in test environment
if (process.env.NODE_ENV !== 'test') {
  if (CLUSTER_MODE && require('os').cpus().length > 1) {
    // Cluster mode for multi-core systems
    const cluster = require('cluster');
    const numCPUs = require('os').cpus().length;

    if (cluster.isMaster) {
      console.log(`Master process ${process.pid} is running`);
      console.log(`Starting ${numCPUs} worker processes...`);

      // Fork workers
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Starting new worker...`);
        cluster.fork();
      });
    } else {
      startServer();
      console.log(`Worker ${process.pid} started`);
    }
  } else {
    // Single process mode
    startServer();
  }
}

function startServer() {
  const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
  const server = app.listen(PORT, HOST, () => {
    const networkIP = getNetworkIP();
    logger.info(`
╔═══════════════════════════════════════════╗
║  RO Service Backend Server Running        ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
║  Port: ${PORT.toString().padEnd(34)}║
║  Local: http://localhost:${PORT.toString().padEnd(21)}║
║  Network: http://${networkIP}:${PORT.toString().padEnd(16)}║
║  Cluster: ${(CLUSTER_MODE ? 'Enabled' : 'Disabled').padEnd(30)}║
║  PID: ${process.pid.toString().padEnd(34)}║
╚═══════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    logger.info('Received shutdown signal. Starting graceful shutdown...');
    
    server.close(async () => {
      logger.info('HTTP server closed.');
      
      try {
        const { sequelize } = require('./config/database');
        await sequelize.close();
        logger.info('Database connection closed.');
        
        const { redis } = require('./config/redis');
        await redis.quit();
        logger.info('Redis connection closed.');
        
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

// Export app for testing
module.exports = app;
