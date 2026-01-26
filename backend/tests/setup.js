const { sequelize } = require('../config/database');

// Setup before all tests
beforeAll(async () => {
  try {
    // Sync database for testing - use force: true to drop and recreate tables
    // This ensures a clean slate for tests and avoids duplicate index errors
    await sequelize.sync({ force: true });
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
