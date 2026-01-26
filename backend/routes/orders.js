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
  getDashboardStats
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard/stats', authorize('admin'), getDashboardStats);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.get('/:id/history', getOrderHistory);

router.post('/', authorize('admin'), createOrder);
router.put('/:id', authorize('admin'), updateOrder);
router.put('/:id/assign', authorize('admin'), assignOrder);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', authorize('admin'), deleteOrder);

module.exports = router;
