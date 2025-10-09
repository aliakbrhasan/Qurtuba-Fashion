-- Qurtuba Fashion Database Tables
-- Copy and paste this entire script into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) CHECK (status IN ('ادمن', 'موظف', 'محاسب')) NOT NULL,
    role VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255)
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    allowed_pages JSONB DEFAULT '[]',
    allowed_actions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50)
);

-- Actions table
CREATE TABLE IF NOT EXISTS actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_order TIMESTAMP WITH TIME ZONE,
    label VARCHAR(50),
    measurements JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer measurements table
CREATE TABLE IF NOT EXISTS customer_measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    height DECIMAL(5,2),
    shoulder DECIMAL(5,2),
    waist DECIMAL(5,2),
    chest DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'معلق',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_address TEXT,
    total DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'معلق',
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_code ON users(code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Insert default data
INSERT INTO roles (name, description, permissions, allowed_pages, allowed_actions) VALUES
('مدير النظام', 'مدير النظام الكامل', 
 '["all"]', 
 '["dashboard", "customers", "orders", "invoices", "reports", "users", "roles"]', 
 '["create", "read", "update", "delete", "export", "print"]'),
('مندوب مبيعات', 'مندوب مبيعات', 
 '["orders:create", "orders:read", "orders:update", "customers:create", "customers:read", "customers:update"]', 
 '["dashboard", "customers", "orders"]', 
 '["create", "read", "update"]'),
('محاسب', 'محاسب', 
 '["invoices:create", "invoices:read", "invoices:update", "invoices:delete", "reports:read", "orders:read"]', 
 '["dashboard", "invoices", "reports", "orders"]', 
 '["create", "read", "update", "delete", "export", "print"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pages (name, description, category) VALUES
('dashboard', 'لوحة التحكم', 'main'),
('customers', 'إدارة العملاء', 'management'),
('orders', 'إدارة الطلبات', 'management'),
('invoices', 'إدارة الفواتير', 'management'),
('reports', 'التقارير', 'reports'),
('users', 'إدارة المستخدمين', 'admin'),
('roles', 'إدارة الأدوار', 'admin')
ON CONFLICT (name) DO NOTHING;

INSERT INTO actions (name, description, category) VALUES
('create', 'إنشاء', 'crud'),
('read', 'قراءة', 'crud'),
('update', 'تحديث', 'crud'),
('delete', 'حذف', 'crud'),
('export', 'تصدير', 'data'),
('print', 'طباعة', 'data')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (code, name, email, phone, status, role, is_active) VALUES
('ADM001', 'مدير النظام', 'admin@qurtuba.com', '07701234567', 'ادمن', 'مدير النظام', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO customers (name, phone, address, total_spent, label, measurements, notes) VALUES
('أحمد محمد العراقي', '07701234567', 'بغداد - الكرادة', 1500.00, 'VIP', '{"height": 175, "shoulder": 45, "waist": 85, "chest": 95}', 'عميل مميز'),
('فاطمة علي', '07807654321', 'بغداد - الجادرية', 800.00, 'عادي', '{"height": 160, "shoulder": 38, "waist": 70, "chest": 85}', ''),
('محمد خالد', '07909876543', 'بغداد - المنصور', 1200.00, 'VIP', '{"height": 180, "shoulder": 48, "waist": 90, "chest": 100}', 'عميل منتظم')
ON CONFLICT DO NOTHING;

INSERT INTO orders (customer_name, total, status, notes) VALUES
('أحمد محمد العراقي', 500.00, 'مكتمل', 'طلب بدلة رسمية'),
('فاطمة علي', 300.00, 'قيد التنفيذ', 'طلب فستان'),
('محمد خالد', 400.00, 'معلق', 'طلب قميص')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_measurements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON invoice_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON customer_measurements FOR ALL USING (true);

-- Success message
SELECT 'Qurtuba Fashion database tables created successfully!' as message;


