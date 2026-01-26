const User = require('./User');
const Order = require('./Order');
const OrderHistory = require('./OrderHistory');

// Define relationships

// User - Order relationships
User.hasMany(Order, { 
  foreignKey: 'assignedToId', 
  as: 'assignedOrders' 
});

Order.belongsTo(User, { 
  foreignKey: 'assignedToId', 
  as: 'assignedTo' 
});

Order.belongsTo(User, { 
  foreignKey: 'assignedById', 
  as: 'assignedBy' 
});

// Order - OrderHistory relationships
Order.hasMany(OrderHistory, { 
  foreignKey: 'orderId', 
  as: 'history' 
});

OrderHistory.belongsTo(Order, { 
  foreignKey: 'orderId', 
  as: 'order' 
});

OrderHistory.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

module.exports = {
  User,
  Order,
  OrderHistory
};
