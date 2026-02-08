const { AmcPlan, AmcSubscription, AmcVisit, Customer, User, Order } = require('../models');
const { Op } = require('sequelize');

// ========== AMC PLAN CONTROLLERS ==========

// Generate plan code
function generatePlanCode(serviceType) {
  const prefix = 'AMC';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${serviceType.substring(0, 3).toUpperCase()}-${random}`;
}

// Get all AMC plans
exports.getAllPlans = async (req, res) => {
  try {
    const isActive = req.query.isActive;
    const whereClause = {};
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const plans = await AmcPlan.findAll({
      where: whereClause,
      order: [['price', 'ASC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching AMC plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AMC plans',
      error: error.message
    });
  }
};

// Get plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await AmcPlan.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: AmcSubscription,
          as: 'subscriptions',
          where: { status: 'active' },
          required: false
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'AMC plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching AMC plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AMC plan',
      error: error.message
    });
  }
};

// Create AMC plan
exports.createPlan = async (req, res) => {
  try {
    const {
      planName,
      description,
      duration,
      serviceType,
      numberOfVisits,
      price,
      gst,
      features,
      isActive
    } = req.body;

    // Validate required fields
    if (!planName || !duration || !serviceType || !numberOfVisits || !price) {
      return res.status(400).json({
        success: false,
        message: 'Plan name, duration, service type, number of visits, and price are required'
      });
    }

    // Generate plan code
    const planCode = generatePlanCode(serviceType);

    const plan = await AmcPlan.create({
      planCode,
      planName,
      description,
      duration,
      serviceType,
      numberOfVisits,
      price,
      gst: gst || 18,
      features: features || [],
      isActive: isActive !== false,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'AMC plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error creating AMC plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating AMC plan',
      error: error.message
    });
  }
};

// Update AMC plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await AmcPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'AMC plan not found'
      });
    }

    await plan.update(req.body);

    res.json({
      success: true,
      message: 'AMC plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error updating AMC plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating AMC plan',
      error: error.message
    });
  }
};

// Delete AMC plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await AmcPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'AMC plan not found'
      });
    }

    // Check if plan has active subscriptions
    const activeSubCount = await AmcSubscription.count({
      where: { planId: plan.id, status: 'active' }
    });

    if (activeSubCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan with active subscriptions. Please deactivate instead.'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'AMC plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting AMC plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting AMC plan',
      error: error.message
    });
  }
};

// ========== AMC SUBSCRIPTION CONTROLLERS ==========

// Generate subscription number
function generateSubscriptionNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `AMC-SUB-${random}`;
}

// Get all subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const customerId = req.query.customerId;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;

    const { count, rows } = await AmcSubscription.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: AmcPlan,
          as: 'plan'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// Get subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await AmcSubscription.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: AmcPlan,
          as: 'plan'
        },
        {
          model: AmcVisit,
          as: 'visits',
          include: [
            {
              model: User,
              as: 'technician',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const {
      customerId,
      planId,
      startDate,
      paymentMode,
      transactionId,
      autoRenewal,
      notes
    } = req.body;

    // Validate required fields
    if (!customerId || !planId || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Customer, plan, and start date are required'
      });
    }

    // Check if customer already has an active subscription
    const existingSubscription = await AmcSubscription.findOne({
      where: {
        customerId,
        status: 'active'
      },
      include: [{
        model: AmcPlan,
        as: 'plan',
        attributes: ['planName', 'planCode']
      }]
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Customer already has an active AMC subscription',
        data: {
          subscriptionNumber: existingSubscription.subscriptionNumber,
          planName: existingSubscription.plan?.planName,
          endDate: existingSubscription.endDate
        }
      });
    }

    // Get plan details
    const plan = await AmcPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'AMC plan not found'
      });
    }

    // Calculate end date and total amount
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.duration);

    const subtotal = parseFloat(plan.price);
    const gstAmount = (subtotal * parseFloat(plan.gst)) / 100;
    const totalAmount = subtotal + gstAmount;

    // Generate subscription number
    const subscriptionNumber = generateSubscriptionNumber();

    const subscription = await AmcSubscription.create({
      subscriptionNumber,
      customerId,
      planId,
      startDate: start,
      endDate: end,
      status: 'active',
      totalAmount: totalAmount.toFixed(2),
      paidAmount: totalAmount.toFixed(2),
      balanceAmount: 0,
      paymentStatus: 'paid',
      paymentMode,
      transactionId,
      visitsUsed: 0,
      visitsRemaining: plan.numberOfVisits,
      autoRenewal: autoRenewal || false,
      notes,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'AMC subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await AmcSubscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.update(req.body);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await AmcSubscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.update({
      status: 'cancelled',
      cancelledDate: new Date(),
      cancellationReason: req.body.reason || 'Cancelled by user'
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// ========== AMC VISIT CONTROLLERS ==========

// Generate visit number
function generateVisitNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `AMC-VISIT-${random}`;
}

// Get all visits
exports.getAllVisits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const subscriptionId = req.query.subscriptionId;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (subscriptionId) whereClause.subscriptionId = subscriptionId;

    const { count, rows } = await AmcVisit.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['scheduledDate', 'DESC']],
      include: [
        {
          model: AmcSubscription,
          as: 'subscription',
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'name', 'phone']
            },
            {
              model: AmcPlan,
              as: 'plan',
              attributes: ['id', 'planName']
            }
          ]
        },
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Order,
          as: 'order'
        }
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visits',
      error: error.message
    });
  }
};

// Create visit
exports.createVisit = async (req, res) => {
  try {
    const {
      subscriptionId,
      scheduledDate,
      visitType,
      technicianId,
      notes
    } = req.body;

    // Validate subscription
    const subscription = await AmcSubscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active'
      });
    }

    if (subscription.visitsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No visits remaining in subscription'
      });
    }

    const visitNumber = generateVisitNumber();

    const visit = await AmcVisit.create({
      visitNumber,
      subscriptionId,
      scheduledDate,
      visitType: visitType || 'scheduled',
      status: 'scheduled',
      technicianId,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'AMC visit scheduled successfully',
      data: visit
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating visit',
      error: error.message
    });
  }
};

// Update visit
exports.updateVisit = async (req, res) => {
  try {
    const visit = await AmcVisit.findByPk(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // If completing visit, update subscription
    if (req.body.status === 'completed' && visit.status !== 'completed') {
      const subscription = await AmcSubscription.findByPk(visit.subscriptionId);
      await subscription.update({
        visitsUsed: subscription.visitsUsed + 1,
        visitsRemaining: subscription.visitsRemaining - 1,
        lastVisitDate: new Date()
      });
    }

    await visit.update(req.body);

    res.json({
      success: true,
      message: 'Visit updated successfully',
      data: visit
    });
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating visit',
      error: error.message
    });
  }
};

// Get AMC statistics
exports.getAmcStats = async (req, res) => {
  try {
    const totalSubscriptions = await AmcSubscription.count();
    const activeSubscriptions = await AmcSubscription.count({ where: { status: 'active' } });
    const expiredSubscriptions = await AmcSubscription.count({ where: { status: 'expired' } });
    
    const pendingVisits = await AmcVisit.count({ where: { status: 'scheduled' } });
    const completedVisits = await AmcVisit.count({ where: { status: 'completed' } });

    res.json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        pendingVisits,
        completedVisits
      }
    });
  } catch (error) {
    console.error('Error fetching AMC stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AMC statistics',
      error: error.message
    });
  }
};
