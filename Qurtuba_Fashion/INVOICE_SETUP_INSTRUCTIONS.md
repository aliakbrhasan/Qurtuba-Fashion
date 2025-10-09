# 🧾 Invoice Database Setup Instructions

## Quick Setup for Invoice System

### 1. Create Invoice Tables in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `dbjaogpesmyrqjwtzzwr`

2. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

3. **Copy and Run the SQL**
   - Copy the contents of `invoice-database-setup.sql`
   - Paste into the SQL Editor
   - Click **"Run"** button

### 2. What This Creates

- **invoices** table - Main invoice data
- **invoice_items** table - Invoice line items
- **Auto-numbering** - Invoices get unique numbers (INV0001, INV0002, etc.)
- **Sample data** - Test invoices and items
- **Indexes** - For better performance
- **Security** - Row Level Security enabled

### 3. Test the Invoice System

1. **Your app is running on**: http://localhost:3001/
2. **Go to Invoices page**
3. **Click "فاتورة جديدة" (New Invoice)**
4. **Fill in the form**:
   - Customer name and phone (required)
   - Add invoice items
   - Set payment information
   - Add measurements if needed
5. **Click "حفظ الفاتورة" (Save Invoice)**
6. **Verify the invoice appears in the list**

### 4. Expected Results

After running the SQL, you should see:
- ✅ "Invoice database tables created successfully!"
- ✅ `invoices` table with sample data
- ✅ `invoice_items` table with sample data
- ✅ Auto-numbering working
- ✅ All invoice forms working with database

### 5. Invoice Features

- **Create invoices** with customer details
- **Add multiple items** to each invoice
- **Track payments** (paid, partial, pending)
- **Auto-numbering** for invoice numbers
- **Measurements** for custom orders
- **Status tracking** (معلق, جزئي, مدفوع)
- **Print functionality** (ready for implementation)

### 6. Troubleshooting

If you encounter issues:
1. **Check Supabase connection** in browser console
2. **Verify tables are created** in Supabase Table Editor
3. **Check for errors** in the form validation
4. **Test with simple data** first

The invoice system will work with both Supabase and local fallback, ensuring your data is always accessible!


