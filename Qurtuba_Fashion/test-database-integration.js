// Test script to verify database integration
const { databaseService } = require('./src/db/database.service');

async function testDatabaseIntegration() {
  console.log('🧪 Testing Database Integration...\n');

  try {
    // Test 1: Users operations
    console.log('1. Testing Users operations...');
    const users = await databaseService.getUsers();
    console.log(`✅ Users loaded: ${users.length} users`);
    
    // Test 2: Customers operations
    console.log('2. Testing Customers operations...');
    const customers = await databaseService.getCustomers();
    console.log(`✅ Customers loaded: ${customers.length} customers`);
    
    // Test 3: Orders operations
    console.log('3. Testing Orders operations...');
    const orders = await databaseService.getOrders();
    console.log(`✅ Orders loaded: ${orders.length} orders`);
    
    // Test 4: Invoices operations
    console.log('4. Testing Invoices operations...');
    const invoices = await databaseService.getInvoices();
    console.log(`✅ Invoices loaded: ${invoices.length} invoices`);
    
    // Test 5: Roles operations
    console.log('5. Testing Roles operations...');
    const roles = await databaseService.getRoles();
    console.log(`✅ Roles loaded: ${roles.length} roles`);
    
    // Test 6: Create a test customer
    console.log('6. Testing Customer creation...');
    const testCustomer = await databaseService.createCustomer({
      name: 'Test Customer',
      phone: '07700000000',
      address: 'Test Address',
      label: 'جديد',
      totalSpent: 0,
      lastOrder: null,
      measurements: {},
      notes: 'Test customer'
    });
    console.log(`✅ Customer created with ID: ${testCustomer.id}`);
    
    // Test 7: Create a test order
    console.log('7. Testing Order creation...');
    const testOrder = await databaseService.createOrder({
      customer_name: 'Test Customer',
      total: 100.00
    });
    console.log(`✅ Order created with ID: ${testOrder.id}`);
    
    // Test 8: Create a test invoice
    console.log('8. Testing Invoice creation...');
    const testInvoice = await databaseService.createInvoice({
      customer_name: 'Test Customer',
      customer_phone: '07700000000',
      customer_address: 'Test Address',
      total: 150.00,
      paid_amount: 50.00,
      status: 'جزئي',
      notes: 'Test invoice',
      items: [{
        item_name: 'Test Item',
        description: 'Test Description',
        quantity: 1,
        unit_price: 150.00,
        total_price: 150.00
      }]
    });
    console.log(`✅ Invoice created with ID: ${testInvoice.id}`);
    
    // Test 9: Test invoice items
    console.log('9. Testing Invoice Items...');
    const invoiceItems = await databaseService.getInvoiceItems(testInvoice.id);
    console.log(`✅ Invoice items loaded: ${invoiceItems.length} items`);
    
    // Test 10: Test customer measurements
    console.log('10. Testing Customer Measurements...');
    const measurements = await databaseService.getCustomerMeasurements(testCustomer.id);
    console.log(`✅ Customer measurements loaded: ${measurements.length} measurements`);
    
    // Test 11: Test data synchronization
    console.log('11. Testing Data Synchronization...');
    await databaseService.syncWithSupabase();
    console.log('✅ Data synchronization completed');
    
    console.log('\n🎉 All database operations completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Customers: ${customers.length + 1} (including test customer)`);
    console.log(`- Orders: ${orders.length + 1} (including test order)`);
    console.log(`- Invoices: ${invoices.length + 1} (including test invoice)`);
    console.log(`- Roles: ${roles.length}`);
    
  } catch (error) {
    console.error('❌ Database integration test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDatabaseIntegration();
