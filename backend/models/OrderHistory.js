const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderHistory = sequelize.define('OrderHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g., Created, Assigned, Status Changed, Completed'
  },
  oldStatus: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  newStatus: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data in JSON format'
  }
}, {
  tableName: 'order_history',
  timestamps: true,
  updatedAt: false
});

module.exports = OrderHistory;
