const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AmcSubscription = sequelize.define('AmcSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subscriptionNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'AMC-SUB-XXXXXX'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'amc_plans',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled', 'suspended'),
    defaultValue: 'active'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  balanceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'partial', 'paid'),
    defaultValue: 'pending'
  },
  paymentMode: {
    type: DataTypes.ENUM('cash', 'online', 'card', 'upi', 'cheque'),
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  visitsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  visitsRemaining: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lastVisitDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextVisitDue: {
    type: DataTypes.DATE,
    allowNull: true
  },
  autoRenewal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  renewalReminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelledDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'amc_subscriptions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['subscriptionNumber']
    },
    {
      fields: ['customerId']
    },
    {
      fields: ['planId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['startDate', 'endDate']
    },
    {
      fields: ['nextVisitDue']
    }
  ]
});

module.exports = AmcSubscription;
