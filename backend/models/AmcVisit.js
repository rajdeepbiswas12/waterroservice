const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AmcVisit = sequelize.define('AmcVisit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  visitNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'AMC-VISIT-XXXXXX'
  },
  subscriptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'amc_subscriptions',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    comment: 'Link to booking/order if created'
  },
  visitType: {
    type: DataTypes.ENUM('scheduled', 'emergency', 'callback'),
    defaultValue: 'scheduled'
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled'),
    defaultValue: 'scheduled'
  },
  servicePerformed: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of services performed'
  },
  partsReplaced: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of parts replaced during visit'
  },
  additionalCharges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Extra charges beyond AMC'
  },
  technicianId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  customerRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  customerFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of image URLs'
  }
}, {
  tableName: 'amc_visits',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['visitNumber']
    },
    {
      fields: ['subscriptionId']
    },
    {
      fields: ['orderId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['scheduledDate']
    },
    {
      fields: ['technicianId']
    }
  ]
});

module.exports = AmcVisit;
