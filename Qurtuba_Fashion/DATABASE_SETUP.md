# Database Setup Instructions

This document explains how to set up the database for the Qurtuba Fashion application.

## Supabase Setup

### 1. Create Supabase Tables

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` into the SQL editor
4. Run the SQL script to create all necessary tables

### 2. Environment Variables

The `.env` file has been created with your Supabase credentials:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Database Features

### Hybrid Database System

The application uses a hybrid approach:
- **Primary**: Supabase (cloud database)
- **Fallback**: Local storage (when Supabase is unavailable)

### Tables Created

1. **users** - User management
2. **roles** - User roles and permissions
3. **customers** - Customer information
4. **orders** - Order management
5. **invoices** - Invoice system
6. **invoice_items** - Invoice line items
7. **customer_measurements** - Customer body measurements
8. **pages** - System pages
9. **actions** - System actions

### Default Data

The schema includes default data:
- Admin user (admin@qurtuba.com)
- Default roles (مدير النظام, مندوب مبيعات, محاسب)
- System pages and actions

## Database Service

The `DatabaseService` class handles:
- Automatic fallback to local data when Supabase is unavailable
- Data synchronization between local and cloud
- CRUD operations for all entities
- Error handling and logging

## Usage

The database is automatically initialized when the app starts. All components use the database service through adapters:

- `ordersAdapter` - Order operations
- `usersAdapter` - User management
- `customersAdapter` - Customer management

## Troubleshooting

### Supabase Connection Issues

If you see "Supabase error, using local data" in the console:
1. Check your internet connection
2. Verify Supabase credentials in `.env`
3. Ensure tables are created in Supabase
4. Check Supabase project status

### Local Data

When Supabase is unavailable, the app automatically uses local data stored in memory. This ensures the app continues to work offline.

## Security

- Row Level Security (RLS) is enabled on all tables
- Default policies allow all operations for authenticated users
- You can customize RLS policies based on your security requirements

## Next Steps

1. Run the SQL schema in Supabase
2. Test the application
3. Customize RLS policies if needed
4. Add additional data as required
