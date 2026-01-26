#!/bin/bash

# Database Migration Script
# This script handles database migrations for the RO Service application

set -e  # Exit on any error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║        RO Service - Database Migration Script        ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
  echo -e "${BLUE}→ Loading environment variables from .env...${NC}"
  set -a
  source .env
  set +a
  echo -e "${GREEN}✓ Environment loaded${NC}"
else
  echo -e "${YELLOW}⚠ .env file not found, using default configuration${NC}"
fi
echo ""

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_NAME=${DB_NAME:-ro_service}
MIGRATIONS_DIR="migrations"
MIGRATION_TABLE="schema_migrations"

echo -e "${BLUE}Database Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if MySQL is accessible
echo -e "${BLUE}→ Checking database connection...${NC}"
if mysql -h "$DB_HOST" -u "$DB_USER" -p"${DB_PASSWORD}" -e "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
else
  echo -e "${RED}✗ Cannot connect to database${NC}"
  echo -e "${YELLOW}Please check your database credentials${NC}"
  exit 1
fi
echo ""

# Create database if it doesn't exist
echo -e "${BLUE}→ Ensuring database exists...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"${DB_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Create migrations table if it doesn't exist
echo -e "${BLUE}→ Initializing migration tracking...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"${DB_PASSWORD}" "$DB_NAME" << EOF
CREATE TABLE IF NOT EXISTS $MIGRATION_TABLE (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_migration_name (migration_name)
);
EOF
echo -e "${GREEN}✓ Migration table ready${NC}"
echo ""

# Run Sequelize sync to create/update tables
echo -e "${BLUE}→ Running Sequelize model sync...${NC}"
node << 'NODESCRIPT'
const { sequelize } = require('./models');

(async () => {
  try {
    // Sync all models with database
    await sequelize.sync({ alter: true });
    console.log('\x1b[32m✓ All models synchronized with database\x1b[0m');
    
    // Test connection
    await sequelize.authenticate();
    console.log('\x1b[32m✓ Database connection verified\x1b[0m');
    
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m✗ Migration failed:\x1b[0m', error.message);
    process.exit(1);
  }
})();
NODESCRIPT

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database schema synchronized${NC}"
else
  echo -e "${RED}✗ Schema synchronization failed${NC}"
  exit 1
fi
echo ""

# Run seed data if needed
echo -e "${BLUE}→ Checking for seed data...${NC}"
if [ -f "seeders/seed.js" ]; then
  echo -e "${BLUE}Running seed data...${NC}"
  node seeders/seed.js
  echo -e "${GREEN}✓ Seed data applied${NC}"
else
  echo -e "${YELLOW}⚠ No seed file found (seeders/seed.js)${NC}"
fi
echo ""

# Display migration summary
echo -e "${BLUE}→ Migration Summary:${NC}"
MIGRATION_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"${DB_PASSWORD}" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM $MIGRATION_TABLE;")
echo -e "  Total migrations recorded: ${GREEN}$MIGRATION_COUNT${NC}"
echo ""

# Show recent migrations
if [ "$MIGRATION_COUNT" -gt 0 ]; then
  echo -e "${BLUE}Recent migrations:${NC}"
  mysql -h "$DB_HOST" -u "$DB_USER" -p"${DB_PASSWORD}" "$DB_NAME" -e "SELECT migration_name, executed_at FROM $MIGRATION_TABLE ORDER BY executed_at DESC LIMIT 5;" || true
  echo ""
fi

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Database Migration Completed Successfully      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  • Verify tables: mysql -u $DB_USER -p $DB_NAME -e 'SHOW TABLES;'"
echo "  • Start backend: node server.js"
echo ""
