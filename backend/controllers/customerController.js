const { Customer, Order, User, AmcSubscription } = require('../models');
const { Op } = require('sequelize');

// Generate customer number
function generateCustomerNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CUST-${random}`;
}

// Get all customers with pagination and search
exports.getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { customerNumber: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'registeredByUser',
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
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'assignedTo',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: AmcSubscription,
          as: 'amcSubscriptions',
          include: ['plan']
        },
        {
          model: User,
          as: 'registeredByUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      alternatePhone,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      customerType,
      gstNumber,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and address are required'
      });
    }

    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Check if phone already exists
    const existingCustomer = await Customer.findOne({ where: { phone } });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }

    // Check if email already exists (only if email is provided)
    if (email && email.trim() !== '') {
      const existingEmail = await Customer.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists'
        });
      }
    }

    // Generate customer number
    const customerNumber = generateCustomerNumber();

    // Create customer - set email to null if empty
    const customer = await Customer.create({
      customerNumber,
      name,
      phone,
      email: email && email.trim() !== '' ? email : null,
      alternatePhone: alternatePhone && alternatePhone.trim() !== '' ? alternatePhone : null,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      customerType: customerType || 'residential',
      gstNumber: gstNumber && gstNumber.trim() !== '' ? gstNumber : null,
      notes,
      status: 'active',
      registeredBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const {
      name,
      phone,
      email,
      alternatePhone,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      customerType,
      gstNumber,
      status,
      notes
    } = req.body;

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({ where: { phone } });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use'
        });
      }
    }

    // Check if email is being changed and if it's already taken
    if (email && email.trim() !== '' && email !== customer.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      
      const existingEmail = await Customer.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    await customer.update({
      name: name || customer.name,
      phone: phone || customer.phone,
      email: email !== undefined ? (email && email.trim() !== '' ? email : null) : customer.email,
      alternatePhone: alternatePhone !== undefined ? (alternatePhone && alternatePhone.trim() !== '' ? alternatePhone : null) : customer.alternatePhone,
      address: address || customer.address,
      city: city !== undefined ? city : customer.city,
      state: state !== undefined ? state : customer.state,
      postalCode: postalCode !== undefined ? postalCode : customer.postalCode,
      latitude: latitude !== undefined ? latitude : customer.latitude,
      longitude: longitude !== undefined ? longitude : customer.longitude,
      customerType: customerType || customer.customerType,
      gstNumber: gstNumber !== undefined ? (gstNumber && gstNumber.trim() !== '' ? gstNumber : null) : customer.gstNumber,
      status: status || customer.status,
      notes: notes !== undefined ? notes : customer.notes
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has orders
    const orderCount = await Order.count({ where: { customerId: customer.id } });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders. Please deactivate instead.'
      });
    }

    await customer.destroy();

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.count();
    const activeCustomers = await Customer.count({ where: { status: 'active' } });
    const inactiveCustomers = await Customer.count({ where: { status: 'inactive' } });
    
    const topCustomers = await Customer.findAll({
      limit: 10,
      order: [['totalSpent', 'DESC']],
      attributes: ['id', 'name', 'phone', 'totalBookings', 'totalSpent']
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer statistics',
      error: error.message
    });
  }
};
