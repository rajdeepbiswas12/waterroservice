const { Order, OrderHistory, User, Customer } = require('../models');
const { Op } = require('sequelize');
const { sendOrderAssignmentNotification, sendOrderStatusNotification } = require('../utils/whatsapp');
const { getPaginationParams, formatPaginationResponse, buildSort } = require('../utils/pagination');

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
      customerId,
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
      assignedToId,
      notes
    } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required'
      });
    }

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Service type is required'
      });
    }

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      latitude,
      longitude,
      serviceType,
      priority: priority || 'medium',
      description,
      notes,
      scheduledDate,
      assignedToId,
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
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, priority, assignedToId, startDate, endDate, search } = req.query;
    
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
    
    // Search across multiple fields
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { customerPhone: { [Op.like]: `%${search}%` } },
        { customerEmail: { [Op.like]: `%${search}%` } },
        { customerAddress: { [Op.like]: `%${search}%` } }
      ];
    }

    // If employee, only show their orders
    if (req.user.role === 'employee') {
      where.assignedToId = req.user.id;
    }

    // Build sort options
    const order = buildSort(req.query, 'createdAt');

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order,
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
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerNumber', 'name', 'phone', 'email', 'address', 'city']
        }
      ]
    });

    res.status(200).json(formatPaginationResponse(rows, count, page, limit));
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
          model: Customer,
          as: 'customer'
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

// Get monthly statistics for reports
exports.getMonthlyStats = async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { months = 6 } = req.query; // Default to last 6 months

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Get orders per month
    const ordersPerMonth = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Get completed orders per month
    const completedPerMonth = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('completedDate'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        status: 'completed',
        completedDate: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
          [Op.ne]: null
        }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('completedDate'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('completedDate'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Get orders by service type per month
    const serviceTypePerMonth = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        'serviceType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      group: [
        sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'),
        'serviceType'
      ],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Get revenue per month (assuming estimatedCost field)
    const revenuePerMonth = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('SUM', sequelize.col('estimatedCost')), 'revenue'],
        [sequelize.fn('AVG', sequelize.col('estimatedCost')), 'avgCost']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        },
        estimatedCost: {
          [Op.ne]: null
        }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Get orders by status per month
    const statusPerMonth = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      group: [
        sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'),
        'status'
      ],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Get employee performance per month
    const employeePerformance = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('Order.completedDate'), '%Y-%m'), 'month'],
        'assignedToId',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'completedCount']
      ],
      where: {
        status: 'completed',
        completedDate: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
          [Op.ne]: null
        },
        assignedToId: {
          [Op.ne]: null
        }
      },
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name']
        }
      ],
      group: [
        sequelize.fn('DATE_FORMAT', sequelize.col('Order.completedDate'), '%Y-%m'),
        'assignedToId'
      ],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('Order.completedDate'), '%Y-%m'), 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        ordersPerMonth,
        completedPerMonth,
        serviceTypePerMonth,
        revenuePerMonth,
        statusPerMonth,
        employeePerformance,
        dateRange: {
          start: startDate,
          end: endDate,
          months: parseInt(months)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get employee dashboard statistics
// @route   GET /api/orders/employee/dashboard-stats
// @access  Private/Employee
exports.getEmployeeDashboardStats = async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { Op } = require('sequelize');
    const employeeId = req.user.id;

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This month's date range
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // Daily assignments (today)
    const dailyAssignments = await Order.count({
      where: {
        assignedToId: employeeId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Daily completed (today)
    const dailyCompleted = await Order.count({
      where: {
        assignedToId: employeeId,
        status: 'completed',
        completedDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Monthly assignments
    const monthlyAssignments = await Order.count({
      where: {
        assignedToId: employeeId,
        createdAt: {
          [Op.gte]: firstDayOfMonth
        }
      }
    });

    // Monthly completed
    const monthlyCompleted = await Order.count({
      where: {
        assignedToId: employeeId,
        status: 'completed',
        completedDate: {
          [Op.gte]: firstDayOfMonth
        }
      }
    });

    // Current active orders
    const activeOrders = await Order.count({
      where: {
        assignedToId: employeeId,
        status: ['assigned', 'in-progress']
      }
    });

    // Orders by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        assignedToId: employeeId
      },
      group: ['status'],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        daily: {
          assignments: dailyAssignments,
          completed: dailyCompleted
        },
        monthly: {
          assignments: monthlyAssignments,
          completed: monthlyCompleted
        },
        current: {
          active: activeOrders
        },
        ordersByStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
