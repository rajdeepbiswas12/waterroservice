const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  assignOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderHistory,
  getDashboardStats,
  getMonthlyStats,
  getEmployeeDashboardStats
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const { createOrderLimiter } = require('../middleware/rateLimiter');

router.use(protect);

// Employee dashboard stats
router.get('/employee/dashboard-stats', authorize('employee', 'admin'), cacheMiddleware(120), getEmployeeDashboardStats);

// Dashboard stats with caching (5 minutes)
router.get('/dashboard/stats', authorize('admin'), cacheMiddleware(300), getDashboardStats);

// Monthly stats with caching (15 minutes)
router.get('/dashboard/monthly-stats', authorize('admin'), cacheMiddleware(900), getMonthlyStats);

// Get all orders with caching (2 minutes)
router.get('/', cacheMiddleware(120), getOrders);

// Get single order with caching (5 minutes)
router.get('/:id', cacheMiddleware(300), getOrder);

// Get order history with caching (5 minutes)
router.get('/:id/history', cacheMiddleware(300), getOrderHistory);

// Create order with rate limiting and cache clearing
router.post('/', authorize('admin'), createOrderLimiter, clearCache('/api/orders*'), createOrder);

// Update order and clear cache
router.put('/:id', authorize('admin'), clearCache('/api/orders*'), updateOrder);

// Assign order and clear cache
router.put('/:id/assign', authorize('admin'), clearCache('/api/orders*'), assignOrder);

// Update status and clear cache
router.put('/:id/status', clearCache('/api/orders*'), updateOrderStatus);

// Delete order and clear cache
router.delete('/:id', authorize('admin'), clearCache('/api/orders*'), deleteOrder);

module.exports = router;
