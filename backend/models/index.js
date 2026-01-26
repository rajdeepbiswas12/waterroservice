const User = require('./User');
const Order = require('./Order');
const OrderHistory = require('./OrderHistory');
const Customer = require('./Customer');
const AmcPlan = require('./AmcPlan');
const AmcSubscription = require('./AmcSubscription');
const AmcVisit = require('./AmcVisit');

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

// Customer - Order relationships
Customer.hasMany(Order, { 
  foreignKey: 'customerId', 
  as: 'orders' 
});

Order.belongsTo(Customer, { 
  foreignKey: 'customerId', 
  as: 'customer' 
});

// User - Customer relationships
User.hasMany(Customer, { 
  foreignKey: 'registeredBy', 
  as: 'registeredCustomers' 
});

Customer.belongsTo(User, { 
  foreignKey: 'registeredBy', 
  as: 'registeredByUser' 
});

// AmcPlan relationships
User.hasMany(AmcPlan, { 
  foreignKey: 'createdBy', 
  as: 'createdAmcPlans' 
});

AmcPlan.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

// Customer - AmcSubscription relationships
Customer.hasMany(AmcSubscription, { 
  foreignKey: 'customerId', 
  as: 'amcSubscriptions' 
});

AmcSubscription.belongsTo(Customer, { 
  foreignKey: 'customerId', 
  as: 'customer' 
});

// AmcPlan - AmcSubscription relationships
AmcPlan.hasMany(AmcSubscription, { 
  foreignKey: 'planId', 
  as: 'subscriptions' 
});

AmcSubscription.belongsTo(AmcPlan, { 
  foreignKey: 'planId', 
  as: 'plan' 
});

// User - AmcSubscription relationships
User.hasMany(AmcSubscription, { 
  foreignKey: 'createdBy', 
  as: 'createdSubscriptions' 
});

AmcSubscription.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

// AmcSubscription - AmcVisit relationships
AmcSubscription.hasMany(AmcVisit, { 
  foreignKey: 'subscriptionId', 
  as: 'visits' 
});

AmcVisit.belongsTo(AmcSubscription, { 
  foreignKey: 'subscriptionId', 
  as: 'subscription' 
});

// Order - AmcVisit relationships
Order.hasOne(AmcVisit, { 
  foreignKey: 'orderId', 
  as: 'amcVisit' 
});

AmcVisit.belongsTo(Order, { 
  foreignKey: 'orderId', 
  as: 'order' 
});

// User - AmcVisit relationships
User.hasMany(AmcVisit, { 
  foreignKey: 'technicianId', 
  as: 'amcVisits' 
});

AmcVisit.belongsTo(User, { 
  foreignKey: 'technicianId', 
  as: 'technician' 
});

module.exports = {
  User,
  Order,
  OrderHistory,
  Customer,
  AmcPlan,
  AmcSubscription,
  AmcVisit
};
