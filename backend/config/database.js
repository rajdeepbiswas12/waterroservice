const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Connection pool configuration for scalability
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum connections
      min: parseInt(process.env.DB_POOL_MIN) || 5,  // Minimum connections
      acquire: 30000, // Maximum time to acquire connection
      idle: 10000,    // Maximum time connection can be idle
      evict: 1000     // Check for idle connections every second
    },
    
    // Retry configuration
    retry: {
      max: 3
    },
    
    // Query optimization
    dialectOptions: {
      connectTimeout: 10000,
      // Enable multiple statements for migrations
      multipleStatements: true
    },
    
    // Define hooks for monitoring
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    
    // Enable query benchmarking in development
    benchmark: process.env.NODE_ENV === 'development'
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database connected successfully');
    
    // Sync all models with database (without alter to avoid blocking)
    await sequelize.sync({ alter: false });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
