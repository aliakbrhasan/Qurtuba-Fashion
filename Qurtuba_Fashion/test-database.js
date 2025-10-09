// Simple test script to verify database integration
import { databaseService } from './src/db/database.service.js';

async function testDatabase() {
  console.log('Testing database integration...');
  
  try {
    // Test Supabase connection
    console.log('1. Testing Supabase connection...');
    const users = await databaseService.getUsers();
    console.log('✅ Users loaded:', users.length, 'users');
    
    // Test orders
    console.log('2. Testing orders...');
    const orders = await databaseService.getOrders();
    console.log('✅ Orders loaded:', orders.length, 'orders');
    
    // Test customers
    console.log('3. Testing customers...');
    const customers = await databaseService.getCustomers();
    console.log('✅ Customers loaded:', customers.length, 'customers');
    
    // Test roles
    console.log('4. Testing roles...');
    const roles = await databaseService.getRoles();
    console.log('✅ Roles loaded:', roles.length, 'roles');
    
    console.log('\n🎉 Database integration test completed successfully!');
    console.log('The application is ready to use with both Supabase and local fallback.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('The app will continue with local data only.');
  }
}

testDatabase();


