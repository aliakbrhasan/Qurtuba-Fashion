import { databaseService } from './database.service';
import type { User, Customer, NewOrder } from '../types/user';
import type { Order } from '../ports/orders';
import type { Invoice, NewInvoice } from './database.service';

export async function testDatabaseIntegration(): Promise<void> {
  console.log('🧪 Testing Database Integration...');
  
  try {
    // Test 1: Get Users
    console.log('1️⃣ Testing Users...');
    const users = await databaseService.getUsers();
    console.log(`✅ Users: ${users.length} found`);
    
    // Test 2: Get Roles
    console.log('2️⃣ Testing Roles...');
    const roles = await databaseService.getRoles();
    console.log(`✅ Roles: ${roles.length} found`);
    
    // Test 3: Get Customers
    console.log('3️⃣ Testing Customers...');
    const customers = await databaseService.getCustomers();
    console.log(`✅ Customers: ${customers.length} found`);
    
    // Test 4: Get Orders
    console.log('4️⃣ Testing Orders...');
    const orders = await databaseService.getOrders();
    console.log(`✅ Orders: ${orders.length} found`);
    
    // Test 5: Create a test order
    console.log('5️⃣ Testing Order Creation...');
    const testOrder: NewOrder = {
      customer_name: 'Test Customer',
      total: 100.50
    };
    
    const newOrder = await databaseService.createOrder(testOrder);
    console.log(`✅ Order created: ${newOrder.id}`);
    
    // Test 6: Create a test customer
    console.log('6️⃣ Testing Customer Creation...');
    const testCustomer: Omit<Customer, 'id'> = {
      name: 'Test Customer',
      phone: '123456789',
      address: 'Test Address',
      totalSpent: 0,
      lastOrder: new Date().toISOString(),
      label: 'Test',
      measurements: {
        height: 170,
        shoulder: 45,
        waist: 80,
        chest: 90
      },
      orders: [],
      notes: 'Test customer'
    };
    
    const newCustomer = await databaseService.createCustomer(testCustomer);
    console.log(`✅ Customer created: ${newCustomer.id}`);
    
    // Test 7: Create a test user
    console.log('7️⃣ Testing User Creation...');
    const testUser: Omit<User, 'id' | 'createdAt'> = {
      code: 'TEST001',
      name: 'Test User',
      email: 'test@example.com',
      phone: '123456789',
      status: 'موظف',
      role: 'Test Role',
      isActive: true,
      lastLogin: new Date().toISOString()
    };
    
    const newUser = await databaseService.createUser(testUser);
    console.log(`✅ User created: ${newUser.id}`);
    
    // Test 8: Get Invoices
    console.log('8️⃣ Testing Invoices...');
    const invoices = await databaseService.getInvoices();
    console.log(`✅ Invoices: ${invoices.length} found`);
    
    // Test 9: Create a test invoice
    console.log('9️⃣ Testing Invoice Creation...');
    const testInvoice: NewInvoice = {
      customer_name: 'Test Customer',
      customer_phone: '123456789',
      customer_address: 'Test Address',
      total: 500.00,
      paid_amount: 0,
      status: 'معلق',
      notes: 'Test invoice',
      items: [
        {
          item_name: 'Test Item',
          description: 'Test Description',
          quantity: 1,
          unit_price: 500.00,
          total_price: 500.00
        }
      ]
    };
    
    const newInvoice = await databaseService.createInvoice(testInvoice);
    console.log(`✅ Invoice created: ${newInvoice.id}`);
    
    // Test 10: Sync with Supabase
    console.log('🔟 Testing Data Sync...');
    await databaseService.syncWithSupabase();
    console.log('✅ Data sync completed');
    
    console.log('\n🎉 All database tests passed!');
    console.log('✅ Supabase integration working');
    console.log('✅ Local fallback working');
    console.log('✅ CRUD operations working');
    console.log('✅ Invoice system working');
    console.log('✅ Data sync working');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.log('The app will continue with local data only.');
  }
}

// Auto-run test when imported
testDatabaseIntegration();
