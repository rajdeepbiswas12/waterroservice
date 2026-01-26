const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Auto-generated customer ID: CUST-XXXXXX'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  alternatePhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  customerType: {
    type: DataTypes.ENUM('residential', 'commercial', 'industrial'),
    defaultValue: 'residential'
  },
  gstNumber: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'GST number for business customers'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blocked'),
    defaultValue: 'active'
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalBookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  lastBookingDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  registeredBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['customerNumber']
    },
    {
      unique: true,
      fields: ['phone']
    },
    {
      fields: ['email']
    },
    {
      fields: ['status']
    },
    {
      fields: ['city']
    }
  ]
});

module.exports = Customer;
