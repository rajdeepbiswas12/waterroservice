const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AmcPlan = sequelize.define('AmcPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  planCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'AMC-BASIC, AMC-PREMIUM, etc.'
  },
  planName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in months (6, 12, 24, etc.)'
  },
  serviceType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'RO Maintenance, Water Purifier, etc.'
  },
  numberOfVisits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Number of free service visits included'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  gst: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18.00,
    comment: 'GST percentage'
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of features included in the plan'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'amc_plans',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['planCode']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['serviceType']
    }
  ]
});

module.exports = AmcPlan;
