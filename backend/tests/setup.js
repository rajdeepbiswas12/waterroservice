const { sequelize } = require('../config/database');

// Setup before all tests
beforeAll(async () => {
  try {
    // Disable foreign key checks to allow dropping tables in any order
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync database for testing - use force: true to drop and recreate tables
    // This ensures a clean slate for tests and avoids duplicate index errors
    await sequelize.sync({ force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Test database synchronized');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    process.exit(1);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
});

// Global test timeout
jest.setTimeout(30000);
