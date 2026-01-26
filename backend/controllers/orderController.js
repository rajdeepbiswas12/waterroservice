const { Order, OrderHistory, User } = require('../models');
const { Op } = require('sequelize');
const { sendOrderAssignmentNotification, sendOrderStatusNotification } = require('../utils/whatsapp');

// Generate unique order number
const generateOrderNumber = () => {
  const prefix = 'RO';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Create order history entry
const createOrderHistory = async (orderId, userId, action, oldStatus, newStatus, description) => {
  await OrderHistory.create({
    orderId,
    userId,
    action,
    oldStatus,
    newStatus,
    description
  });
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Admin
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      latitude,
      longitude,
      serviceType,
      priority,
      description,
      scheduledDate
    } = req.body;

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      latitude,
      longitude,
      serviceType,
      priority: priority || 'medium',
      description,
      scheduledDate,
      status: 'pending'
    });

    // Create history entry
    await createOrderHistory(
      order.id,
      req.user.id,
      'Order Created',
      null,
      'pending',
      'Order created by admin'
    );

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { status, priority, assignedToId, startDate, endDate } = req.query;
    
    const where = {};
    
    // Filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // If employee, only show their orders
    if (req.user.role === 'employee') {
      where.assignedToId = req.user.id;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'name']
        },
        {
          model: OrderHistory,
          as: 'history',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'role']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if employee is accessing their own order
    if (req.user.role === 'employee' && order.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private/Admin
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      latitude,
      longitude,
      serviceType,
      priority,
      description,
      scheduledDate,
      notes
    } = req.body;

    // Update fields
    if (customerName) order.customerName = customerName;
    if (customerPhone) order.customerPhone = customerPhone;
    if (customerEmail !== undefined) order.customerEmail = customerEmail;
    if (customerAddress) order.customerAddress = customerAddress;
    if (latitude !== undefined) order.latitude = latitude;
    if (longitude !== undefined) order.longitude = longitude;
    if (serviceType) order.serviceType = serviceType;
    if (priority) order.priority = priority;
    if (description !== undefined) order.description = description;
    if (scheduledDate !== undefined) order.scheduledDate = scheduledDate;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    // Create history entry
    await createOrderHistory(
      order.id,
      req.user.id,
      'Order Updated',
      null,
      null,
      'Order details updated'
    );

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign order to employee
// @route   PUT /api/orders/:id/assign
// @access  Private/Admin
exports.assignOrder = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if employee exists
    const employee = await User.findByPk(employeeId);

    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Employee is inactive'
      });
    }

    const oldStatus = order.status;
    const oldEmployeeId = order.assignedToId;

    order.assignedToId = employeeId;
    order.assignedById = req.user.id;
    order.status = 'assigned';

    await order.save();

    // Create history entry
    await createOrderHistory(
      order.id,
      req.user.id,
      'Order Assigned',
      oldStatus,
      'assigned',
      `Order assigned to ${employee.name}`
    );

    // Send WhatsApp notification to employee
    await sendOrderAssignmentNotification(employee, order);

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'phone', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order assigned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if employee is updating their own order
    if (req.user.role === 'employee' && order.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    if (notes) {
      order.notes = notes;
    }

    if (status === 'completed') {
      order.completedDate = new Date();
    }

    await order.save();

    // Create history entry
    await createOrderHistory(
      order.id,
      req.user.id,
      'Status Changed',
      oldStatus,
      status,
      notes || `Status changed from ${oldStatus} to ${status}`
    );

    // Send WhatsApp notification to customer
    await sendOrderStatusNotification(order.customerPhone, order);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Delete related history
    await OrderHistory.destroy({ where: { orderId: order.id } });

    await order.destroy();

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order history
// @route   GET /api/orders/:id/history
// @access  Private
exports.getOrderHistory = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if employee is accessing their own order
    if (req.user.role === 'employee' && order.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    const history = await OrderHistory.findAll({
      where: { orderId: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/orders/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const { sequelize } = require('../config/database');

    // Total orders
    const totalOrders = await Order.count();

    // Orders by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Orders by priority
    const ordersByPriority = await Order.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priority']
    });

    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // Completed orders this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const completedThisMonth = await Order.count({
      where: {
        status: 'completed',
        completedDate: {
          [Op.gte]: firstDayOfMonth
        }
      }
    });

    // Active employees
    const activeEmployees = await User.count({
      where: {
        role: 'employee',
        isActive: true
      }
    });

    // Busiest employees
    const busiestEmployees = await Order.findAll({
      attributes: [
        'assignedToId',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount']
      ],
      where: {
        status: ['assigned', 'in-progress']
      },
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'phone']
        }
      ],
      group: ['assignedToId'],
      order: [[sequelize.literal('orderCount'), 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus,
        ordersByPriority,
        recentOrders,
        completedThisMonth,
        activeEmployees,
        busiestEmployees
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
