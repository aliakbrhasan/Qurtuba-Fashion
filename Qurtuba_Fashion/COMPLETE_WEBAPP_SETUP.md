# 🎯 Complete Qurtuba Fashion Webapp Database Setup

## 📋 Overview

This guide sets up the complete database for your Qurtuba Fashion webapp, including all pages and functionality.

## 🗄️ Database Tables Created

### **Authentication & User Management**
- `users` - User accounts with login credentials
- `user_sessions` - Login session tracking
- `roles` - Role-based access control
- `pages` - System pages and navigation
- `actions` - System actions and permissions

### **Customer Management**
- `customers` - Customer information and profiles
- `customer_measurements` - Body measurements for custom orders

### **Order Management**
- `orders` - Order tracking and management
- Auto-numbering: ORD0001, ORD0002, etc.

### **Invoice System**
- `invoices` - Invoice management with auto-numbering
- `invoice_items` - Invoice line items
- Auto-numbering: INV0001, INV0002, etc.

### **Financial Management**
- `payments` - Payment tracking
- `financial_transactions` - Financial records

### **Reports & Analytics**
- `reports` - Generated reports storage
- `system_settings` - Application settings

## 🔐 Login Credentials

### **Default Admin User**
- **Email**: admin@qurtuba.com
- **Password**: admin123
- **Role**: مدير النظام (System Administrator)
- **Permissions**: Full access to all features

### **User Roles Created**
1. **مدير النظام** - Full system access
2. **مندوب مبيعات** - Sales and customer management
3. **محاسب** - Financial and invoice management

## 📱 Pages & Features

### **1. Dashboard Page**
- Overview statistics
- Recent activities
- Quick actions

### **2. Customer Management**
- Customer profiles with measurements
- Contact information
- Order history
- Total spending tracking

### **3. Order Management**
- Create and track orders
- Status management (معلق, قيد التنفيذ, مكتمل)
- Customer linking
- Auto-numbering

### **4. Invoice System**
- Create invoices with line items
- Payment tracking (مدفوع, جزئي, معلق)
- Auto-numbering
- Print functionality

### **5. Financial Management**
- Payment processing
- Financial transactions
- Income statements
- Cash flow tracking

### **6. Reports & Analytics**
- Sales reports
- Customer analytics
- Financial reports
- Custom report generation

### **7. User Management**
- User accounts
- Role assignments
- Permission management
- Session tracking

### **8. Role Management**
- Role creation and editing
- Permission assignments
- Page access control
- Action permissions

## 🚀 Setup Instructions

### **Step 1: Create Database Tables**

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `dbjaogpesmyrqjwtzzwr`

2. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

3. **Run the Complete Schema**
   - Copy the contents of `complete-webapp-database.sql`
   - Paste into the SQL Editor
   - Click **"Run"** button

### **Step 2: Verify Tables Created**

Go to **"Table Editor"** in Supabase and verify these tables exist:
- ✅ users
- ✅ user_sessions
- ✅ roles
- ✅ pages
- ✅ actions
- ✅ customers
- ✅ customer_measurements
- ✅ orders
- ✅ invoices
- ✅ invoice_items
- ✅ payments
- ✅ financial_transactions
- ✅ reports
- ✅ system_settings

### **Step 3: Test the Application**

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Open the application**
   - Go to: http://localhost:3001/
   - Login with: admin@qurtuba.com / admin123

3. **Test all pages**
   - Dashboard
   - Customer Management
   - Order Management
   - Invoice System
   - Financial Management
   - Reports
   - User Management
   - Role Management

## 🧪 Sample Data Included

### **Users**
- Admin user with full permissions
- Sample sales representative
- Sample accountant

### **Customers**
- 3 sample customers with measurements
- Different customer types (VIP, regular)
- Complete contact information

### **Orders**
- Sample orders with different statuses
- Linked to customers
- Auto-generated order numbers

### **Invoices**
- Sample invoices with line items
- Different payment statuses
- Auto-generated invoice numbers

### **Payments**
- Sample payment records
- Different payment methods
- Linked to invoices

## 🔧 Key Features

### **Auto-Numbering**
- Invoices: INV0001, INV0002, etc.
- Orders: ORD0001, ORD0002, etc.

### **Role-Based Access**
- Different permission levels
- Page access control
- Action restrictions

### **Data Relationships**
- Customers linked to orders and invoices
- Orders linked to invoices
- Users linked to all created records

### **Financial Tracking**
- Customer total spending
- Payment history
- Financial transactions

### **Security**
- Row Level Security enabled
- Session management
- Password hashing

## 🎉 Expected Results

After running the SQL schema, you should see:
- ✅ "Qurtuba Fashion complete database schema created successfully!"
- ✅ All 14 tables created with proper relationships
- ✅ Sample data inserted
- ✅ Auto-numbering functions working
- ✅ All pages functional with database integration
- ✅ Login system working
- ✅ Role-based access control active

## 🚨 Troubleshooting

### **Common Issues**

1. **Login not working**
   - Check email: admin@qurtuba.com
   - Check password: admin123
   - Verify user table has data

2. **Tables not created**
   - Check Supabase connection
   - Verify SQL ran without errors
   - Check Table Editor for tables

3. **Auto-numbering not working**
   - Check triggers are created
   - Verify functions exist
   - Test with new records

4. **Permissions not working**
   - Check roles table has data
   - Verify user role assignments
   - Check RLS policies

### **Debug Steps**

1. **Check database connection**
   - Look for errors in browser console
   - Verify Supabase credentials

2. **Test individual features**
   - Try creating a customer
   - Try creating an order
   - Try creating an invoice

3. **Check data relationships**
   - Verify foreign keys work
   - Test data linking

The complete webapp is now ready with full database integration for all pages and features!

