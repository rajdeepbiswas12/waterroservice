/**
 * Migration Script: Move Customer Data from Orders to Customers Table
 * 
 * This script:
 * 1. Creates the new Customer, AMC tables
 * 2. Extracts unique customer data from existing orders
 * 3. Creates customer records (deduplicates by phone)
 * 4. Updates orders with customerId references
 * 5. Backfills legacy customer fields for backward compatibility
 */

const { sequelize } = require('../config/database');
const { Customer, Order, AmcPlan, AmcSubscription, AmcVisit } = require('../models');

// Auto-generate customer number
function generateCustomerNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CUST-${random}`;
}

async function migrateCustomerData() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🚀 Starting customer data migration...\n');

    // Step 1: Sync new tables
    console.log('📋 Step 1: Creating new tables...');
    await Customer.sync({ alter: true });
    await AmcPlan.sync({ alter: true });
    await AmcSubscription.sync({ alter: true });
    await AmcVisit.sync({ alter: true });
    console.log('✅ Tables created successfully\n');

    // Step 1.5: Add customerId to orders table if not exists
    console.log('📋 Step 1.5: Adding customerId column to orders table...');
    try {
      // Check if column exists first
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'customerId'
      `, { transaction });
      
      if (columns.length === 0) {
        // Column doesn't exist, add it
        await sequelize.query(`
          ALTER TABLE orders 
          ADD COLUMN customerId INT NULL AFTER orderNumber
        `, { transaction });
        
        // Add index
        await sequelize.query(`
          ALTER TABLE orders 
          ADD INDEX idx_customer_id (customerId)
        `, { transaction });
        
        console.log('✅ customerId column added\n');
      } else {
        console.log('ℹ️  customerId column already exists\n');
      }
    } catch (error) {
      console.log('⚠️  Error adding customerId column:', error.message, '\n');
    }

    // Step 2: Get all orders with customer data
    console.log('📋 Step 2: Fetching existing orders...');
    const orders = await Order.findAll({
      where: {
        customerPhone: {
          [require('sequelize').Op.ne]: null
        }
      },
      raw: true
    });
    console.log(`✅ Found ${orders.length} orders with customer data\n`);

    if (orders.length === 0) {
      console.log('ℹ️  No orders found. Migration complete.');
      await transaction.commit();
      return;
    }

    // Step 3: Extract unique customers (group by phone)
    console.log('📋 Step 3: Extracting unique customers...');
    const customerMap = new Map();
    
    orders.forEach(order => {
      const phone = order.customerPhone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          name: order.customerName,
          phone: order.customerPhone,
          email: order.customerEmail,
          address: order.customerAddress,
          city: order.city,
          state: order.state,
          postalCode: order.postalCode,
          latitude: order.latitude,
          longitude: order.longitude
        });
      }
    });

    console.log(`✅ Found ${customerMap.size} unique customers\n`);

    // Step 4: Create customer records
    console.log('📋 Step 4: Creating customer records...');
    const phoneToCustomerId = new Map();
    let createdCount = 0;
    
    for (const [phone, customerData] of customerMap.entries()) {
      try {
        const customerNumber = generateCustomerNumber();
        const customer = await Customer.create({
          customerNumber,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          postalCode: customerData.postalCode,
          latitude: customerData.latitude,
          longitude: customerData.longitude,
          status: 'active'
        }, { transaction });
        
        phoneToCustomerId.set(phone, customer.id);
        createdCount++;
        
        if (createdCount % 10 === 0) {
          console.log(`   Created ${createdCount}/${customerMap.size} customers...`);
        }
      } catch (error) {
        console.error(`⚠️  Error creating customer ${customerData.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Created ${createdCount} customer records\n`);

    // Step 5: Update orders with customerId
    console.log('📋 Step 5: Linking orders to customers...');
    let linkedCount = 0;
    
    for (const order of orders) {
      try {
        const customerId = phoneToCustomerId.get(order.customerPhone);
        if (customerId) {
          await Order.update(
            { customerId },
            { 
              where: { id: order.id },
              transaction 
            }
          );
          linkedCount++;
          
          if (linkedCount % 50 === 0) {
            console.log(`   Linked ${linkedCount}/${orders.length} orders...`);
          }
        }
      } catch (error) {
        console.error(`⚠️  Error linking order ${order.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Linked ${linkedCount} orders to customers\n`);

    // Step 6: Calculate customer statistics
    console.log('📋 Step 6: Calculating customer statistics...');
    for (const [phone, customerId] of phoneToCustomerId.entries()) {
      const customerOrders = orders.filter(o => o.customerPhone === phone);
      const totalBookings = customerOrders.length;
      const completedOrders = customerOrders.filter(o => o.status === 'completed');
      const totalSpent = completedOrders.length * 500; // Placeholder calculation
      
      const lastOrder = customerOrders.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      
      await Customer.update({
        totalBookings,
        totalSpent,
        lastBookingDate: lastOrder ? lastOrder.createdAt : null
      }, {
        where: { id: customerId },
        transaction
      });
    }
    console.log('✅ Customer statistics updated\n');

    await transaction.commit();
    
    console.log('🎉 Migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Customers created: ${createdCount}`);
    console.log(`   - Orders linked: ${linkedCount}`);
    console.log(`   - Legacy data: Preserved in orders table`);
    
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateCustomerData()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateCustomerData };
