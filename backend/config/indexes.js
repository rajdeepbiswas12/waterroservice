const { sequelize } = require('../config/database');

/**
 * Create database indexes for better query performance
 */
async function createIndexes() {
  try {
    console.log('Creating database indexes for scalability...');

    // Indexes for Users table
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    `);

    // Indexes for Orders table
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(createdAt);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_completed_date ON orders(completedDate);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assignedToId);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_assigned_by ON orders(assignedById);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(serviceType);
    `);
    
    // Composite indexes for common queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, createdAt);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_assigned_status ON orders(assignedToId, status);
    `);

    // Indexes for OrderHistory table
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(orderId);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_changed_by ON order_history(changedById);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_created ON order_history(createdAt);
    `);

    console.log('✓ Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
}

/**
 * Analyze tables for query optimization
 */
async function analyzeTables() {
  try {
    console.log('Analyzing tables for optimization...');
    
    await sequelize.query('ANALYZE TABLE users');
    await sequelize.query('ANALYZE TABLE orders');
    await sequelize.query('ANALYZE TABLE order_history');
    
    console.log('✓ Tables analyzed successfully');
  } catch (error) {
    console.error('Error analyzing tables:', error.message);
  }
}

module.exports = {
  createIndexes,
  analyzeTables
};
