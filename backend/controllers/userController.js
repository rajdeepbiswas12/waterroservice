const { User, Order } = require('../models');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Order,
          as: 'assignedOrders',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, address, isActive } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (address) user.address = address;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Check if user has assigned orders
    const assignedOrders = await Order.count({
      where: { assignedToId: user.id, status: ['assigned', 'in-progress'] }
    });

    if (assignedOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user. They have ${assignedOrders} active orders assigned.`
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get employees for assignment
// @route   GET /api/users/employees/available
// @access  Private/Admin
exports.getAvailableEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { 
        role: 'employee',
        isActive: true
      },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Order,
          as: 'assignedOrders',
          where: { status: ['assigned', 'in-progress'] },
          required: false
        }
      ]
    });

    // Calculate workload
    const employeesWithWorkload = employees.map(emp => {
      const empData = emp.toJSON();
      empData.activeOrdersCount = empData.assignedOrders ? empData.assignedOrders.length : 0;
      delete empData.assignedOrders;
      return empData;
    });

    // Sort by workload (least busy first)
    employeesWithWorkload.sort((a, b) => a.activeOrdersCount - b.activeOrdersCount);

    res.status(200).json({
      success: true,
      count: employeesWithWorkload.length,
      data: employeesWithWorkload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
