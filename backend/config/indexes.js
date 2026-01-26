const { sequelize } = require('../config/database');

/**
 * Create database indexes for better query performance
 */
async function createIndexes() {
  try {
    console.log('Creating database indexes for scalability...');

    // Helper function to create index if it doesn't exist
    const createIndexIfNotExists = async (tableName, indexName, columns) => {
      try {
        const [indexes] = await sequelize.query(`SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}'`);
        if (indexes.length === 0) {
          await sequelize.query(`CREATE INDEX ${indexName} ON ${tableName}(${columns})`);
          console.log(`  ✓ Created index: ${indexName}`);
        }
      } catch (error) {
        console.log(`  ℹ Index ${indexName} may already exist or error: ${error.message}`);
      }
    };

    // Indexes for Users table
    await createIndexIfNotExists('users', 'idx_users_email', 'email');
    await createIndexIfNotExists('users', 'idx_users_role', 'role');
    await createIndexIfNotExists('users', 'idx_users_active', 'isActive');
    await createIndexIfNotExists('users', 'idx_users_phone', 'phone');

    // Indexes for Orders table
    await createIndexIfNotExists('orders', 'idx_orders_status', 'status');
    await createIndexIfNotExists('orders', 'idx_orders_priority', 'priority');
    await createIndexIfNotExists('orders', 'idx_orders_created_at', 'createdAt');
    await createIndexIfNotExists('orders', 'idx_orders_completed_date', 'completedDate');
    await createIndexIfNotExists('orders', 'idx_orders_assigned_to', 'assignedToId');
    await createIndexIfNotExists('orders', 'idx_orders_assigned_by', 'assignedById');
    await createIndexIfNotExists('orders', 'idx_orders_service_type', 'serviceType');
    
    // Composite indexes for common queries
    await createIndexIfNotExists('orders', 'idx_orders_status_created', 'status, createdAt');
    await createIndexIfNotExists('orders', 'idx_orders_assigned_status', 'assignedToId, status');

    // Indexes for OrderHistory table  
    await createIndexIfNotExists('order_history', 'idx_order_history_order_id', 'orderId');
    await createIndexIfNotExists('order_history', 'idx_order_history_changed_by', 'changedById');
    await createIndexIfNotExists('order_history', 'idx_order_history_created', 'createdAt');

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
