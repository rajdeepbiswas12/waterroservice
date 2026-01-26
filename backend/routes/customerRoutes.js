const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Customer routes
router.get('/', customerController.getAllCustomers);
router.get('/stats', customerController.getCustomerStats);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
