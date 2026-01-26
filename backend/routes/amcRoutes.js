const express = require('express');
const router = express.Router();
const amcController = require('../controllers/amcController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// AMC Plan routes (admin only for create/update/delete)
router.get('/plans', amcController.getAllPlans);
router.get('/plans/:id', amcController.getPlanById);
router.post('/plans', authorize('admin'), amcController.createPlan);
router.put('/plans/:id', authorize('admin'), amcController.updatePlan);
router.delete('/plans/:id', authorize('admin'), amcController.deletePlan);

// AMC Subscription routes
router.get('/subscriptions', amcController.getAllSubscriptions);
router.get('/subscriptions/:id', amcController.getSubscriptionById);
router.post('/subscriptions', amcController.createSubscription);
router.put('/subscriptions/:id', amcController.updateSubscription);
router.post('/subscriptions/:id/cancel', amcController.cancelSubscription);

// AMC Visit routes
router.get('/visits', amcController.getAllVisits);
router.post('/visits', amcController.createVisit);
router.put('/visits/:id', amcController.updateVisit);

// AMC Statistics
router.get('/stats', amcController.getAmcStats);

module.exports = router;
