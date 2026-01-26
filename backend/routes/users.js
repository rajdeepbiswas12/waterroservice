const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAvailableEmployees
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

router.use(protect);
router.use(authorize('admin'));

// Get all users with caching (5 minutes)
router.get('/', cacheMiddleware(300), getUsers);

// Get available employees with caching (2 minutes)
router.get('/available-employees', cacheMiddleware(120), getAvailableEmployees);

// Get single user with caching (5 minutes)
router.get('/:id', cacheMiddleware(300), getUser);

// Update user and clear cache
router.put('/:id', clearCache('/api/users*'), updateUser);

// Delete user and clear cache
router.delete('/:id', clearCache('/api/users*'), deleteUser);

module.exports = router;
