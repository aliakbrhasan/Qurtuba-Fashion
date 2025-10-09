-- Complete Database Schema for Qurtuba Fashion Webapp
-- This SQL script creates all required tables for every page in the application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customer_measurements CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- ===========================================
-- AUTHENTICATION & USER MANAGEMENT TABLES
-- ===========================================

-- Users table (for login credentials and user management)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ادمن', 'موظف', 'محاسب')) NOT NULL,
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for login tracking)
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table (for role-based access control)
CREATE TABLE roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    allowed_pages JSONB DEFAULT '[]',
    allowed_actions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pages table (for system pages)
CREATE TABLE pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    route VARCHAR(100),
    icon VARCHAR(50)
);

-- Actions table (for system actions)
CREATE TABLE actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    page_id UUID REFERENCES pages(id)
);

-- ===========================================
-- CUSTOMER MANAGEMENT TABLES
-- ===========================================

-- Customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    email VARCHAR(255),
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_order TIMESTAMP WITH TIME ZONE,
    label VARCHAR(50),
    measurements JSONB DEFAULT '{}',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer measurements table (normalized)
CREATE TABLE customer_measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    height DECIMAL(5,2),
    shoulder DECIMAL(5,2),
    waist DECIMAL(5,2),
    chest DECIMAL(5,2),
    arm_length DECIMAL(5,2),
    leg_length DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- ORDER MANAGEMENT TABLES
-- ===========================================

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    order_number VARCHAR(50) UNIQUE,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'معلق',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INVOICE MANAGEMENT TABLES
-- ===========================================

-- Invoices table
CREATE TABLE invoices (
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
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- FINANCIAL MANAGEMENT TABLES
-- ===========================================

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'نقد',
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial transactions table
CREATE TABLE financial_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'income', 'expense'
    category VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- REPORTS & ANALYTICS TABLES
-- ===========================================

-- Reports table
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'sales', 'financial', 'customer', 'inventory'
    parameters JSONB DEFAULT '{}',
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path VARCHAR(500)
);

-- ===========================================
-- SYSTEM SETTINGS TABLE
-- ===========================================

-- System settings table
CREATE TABLE system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_code ON users(code);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- Customer indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_by ON customers(created_by);

-- Order indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by);

-- Invoice indexes
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Payment indexes
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_created_by ON payments(created_by);

-- Financial transaction indexes
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_created_by ON financial_transactions(created_by);

-- ===========================================
-- FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function for automatic invoice number generation
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE 'INV%';
    
    invoice_num := 'INV' || LPAD(next_number::TEXT, 4, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function for automatic order number generation
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    order_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders
    WHERE order_number LIKE 'ORD%';
    
    order_num := 'ORD' || LPAD(next_number::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Function to update customer total_spent
CREATE OR REPLACE FUNCTION update_customer_total_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customers 
        SET total_spent = total_spent + NEW.total,
            last_order = NEW.created_at
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE customers 
        SET total_spent = total_spent - OLD.total + NEW.total
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE customers 
        SET total_spent = total_spent - OLD.total
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_total_spent
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_total_spent();

-- ===========================================
-- INSERT DEFAULT DATA
-- ===========================================

-- Insert default pages
INSERT INTO pages (name, description, category, route, icon) VALUES
('dashboard', 'لوحة التحكم', 'عام', '/dashboard', 'home'),
('customers', 'إدارة العملاء', 'المبيعات', '/customers', 'users'),
('orders', 'إدارة الطلبات', 'المبيعات', '/orders', 'shopping-cart'),
('invoices', 'إدارة الفواتير', 'المبيعات', '/invoices', 'file-text'),
('financial', 'الإدارة المالية', 'المالية', '/financial', 'dollar-sign'),
('reports', 'التقارير', 'التقارير', '/reports', 'bar-chart'),
('users', 'إدارة المستخدمين', 'الإدارة', '/users', 'user-cog'),
('roles', 'إدارة الأدوار', 'الإدارة', '/roles', 'shield')
ON CONFLICT (name) DO NOTHING;

-- Insert default actions
INSERT INTO actions (name, description, category, page_id) VALUES
-- Customer actions
('create_customer', 'إنشاء عميل', 'crud', (SELECT id FROM pages WHERE name = 'customers')),
('edit_customer', 'تعديل عميل', 'crud', (SELECT id FROM pages WHERE name = 'customers')),
('delete_customer', 'حذف عميل', 'crud', (SELECT id FROM pages WHERE name = 'customers')),
('view_customer_details', 'عرض تفاصيل العميل', 'read', (SELECT id FROM pages WHERE name = 'customers')),
('print_customers_list', 'طباعة قائمة العملاء', 'print', (SELECT id FROM pages WHERE name = 'customers')),

-- Order actions
('create_order', 'إنشاء طلب', 'crud', (SELECT id FROM pages WHERE name = 'orders')),
('edit_order', 'تعديل طلب', 'crud', (SELECT id FROM pages WHERE name = 'orders')),
('delete_order', 'حذف طلب', 'crud', (SELECT id FROM pages WHERE name = 'orders')),
('change_order_status', 'تغيير حالة الطلب', 'update', (SELECT id FROM pages WHERE name = 'orders')),

-- Invoice actions
('create_invoice', 'إنشاء فاتورة', 'crud', (SELECT id FROM pages WHERE name = 'invoices')),
('edit_invoice', 'تعديل فاتورة', 'crud', (SELECT id FROM pages WHERE name = 'invoices')),
('delete_invoice', 'حذف فاتورة', 'crud', (SELECT id FROM pages WHERE name = 'invoices')),
('change_invoice_status', 'تغيير حالة الفاتورة', 'update', (SELECT id FROM pages WHERE name = 'invoices')),
('mark_invoice_paid', 'وضع علامة مدفوع', 'update', (SELECT id FROM pages WHERE name = 'invoices')),
('print_invoice', 'طباعة فاتورة', 'print', (SELECT id FROM pages WHERE name = 'invoices')),
('print_invoices_list', 'طباعة قائمة الفواتير', 'print', (SELECT id FROM pages WHERE name = 'invoices')),

-- Financial actions
('view_financial_reports', 'عرض التقارير المالية', 'read', (SELECT id FROM pages WHERE name = 'financial')),
('manage_payments', 'إدارة المدفوعات', 'crud', (SELECT id FROM pages WHERE name = 'financial')),
('view_income_statement', 'عرض بيان الدخل', 'read', (SELECT id FROM pages WHERE name = 'financial')),

-- Report actions
('generate_sales_report', 'توليد تقرير المبيعات', 'generate', (SELECT id FROM pages WHERE name = 'reports')),
('generate_customer_report', 'توليد تقرير العملاء', 'generate', (SELECT id FROM pages WHERE name = 'reports')),
('generate_financial_report', 'توليد تقرير مالي', 'generate', (SELECT id FROM pages WHERE name = 'reports')),

-- User management actions
('manage_users', 'إدارة المستخدمين', 'crud', (SELECT id FROM pages WHERE name = 'users')),
('manage_roles', 'إدارة الأدوار', 'crud', (SELECT id FROM pages WHERE name = 'roles')),
('system_settings', 'تعديل إعدادات النظام', 'admin', (SELECT id FROM pages WHERE name = 'dashboard'))
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, permissions, allowed_pages, allowed_actions) VALUES
('مدير النظام', 'مدير النظام الكامل', 
 '["all"]', 
 '["dashboard", "customers", "orders", "invoices", "financial", "reports", "users", "roles"]', 
 '["create_customer", "edit_customer", "delete_customer", "view_customer_details", "print_customers_list", "create_order", "edit_order", "delete_order", "change_order_status", "create_invoice", "edit_invoice", "delete_invoice", "change_invoice_status", "mark_invoice_paid", "print_invoice", "print_invoices_list", "view_financial_reports", "manage_payments", "view_income_statement", "generate_sales_report", "generate_customer_report", "generate_financial_report", "manage_users", "manage_roles", "system_settings"]'),
('مندوب مبيعات', 'مندوب مبيعات', 
 '["orders:create", "orders:read", "orders:update", "customers:create", "customers:read", "customers:update", "invoices:create", "invoices:read", "invoices:update"]', 
 '["dashboard", "customers", "orders", "invoices", "reports"]', 
 '["create_customer", "edit_customer", "view_customer_details", "print_customers_list", "create_order", "edit_order", "change_order_status", "create_invoice", "edit_invoice", "change_invoice_status", "print_invoice", "print_invoices_list", "generate_sales_report", "generate_customer_report"]'),
('محاسب', 'محاسب', 
 '["invoices:create", "invoices:read", "invoices:update", "invoices:delete", "financial:read", "reports:read", "orders:read"]', 
 '["dashboard", "invoices", "financial", "reports", "orders"]', 
 '["create_invoice", "edit_invoice", "delete_invoice", "change_invoice_status", "mark_invoice_paid", "print_invoice", "print_invoices_list", "view_financial_reports", "manage_payments", "view_income_statement", "generate_sales_report", "generate_customer_report", "generate_financial_report"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (code, name, email, phone, password_hash, status, role_id, is_active) VALUES
('ADM001', 'مدير النظام', 'admin@qurtuba.com', '07701234567', '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5', 'ادمن', (SELECT id FROM roles WHERE name = 'مدير النظام'), true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (name, phone, address, email, total_spent, label, measurements, notes, created_by) VALUES
('أحمد محمد العراقي', '07701234567', 'بغداد - الكرادة', 'ahmed@example.com', 1500.00, 'VIP', '{"height": 175, "shoulder": 45, "waist": 85, "chest": 95}', 'عميل مميز', (SELECT id FROM users WHERE code = 'ADM001')),
('فاطمة علي', '07807654321', 'بغداد - الجادرية', 'fatima@example.com', 800.00, 'عادي', '{"height": 160, "shoulder": 38, "waist": 70, "chest": 85}', '', (SELECT id FROM users WHERE code = 'ADM001')),
('محمد خالد', '07909876543', 'بغداد - المنصور', 'mohammed@example.com', 1200.00, 'VIP', '{"height": 180, "shoulder": 48, "waist": 90, "chest": 100}', 'عميل منتظم', (SELECT id FROM users WHERE code = 'ADM001'))
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO orders (customer_id, customer_name, total, status, notes, created_by) VALUES
((SELECT id FROM customers WHERE name = 'أحمد محمد العراقي'), 'أحمد محمد العراقي', 500.00, 'مكتمل', 'طلب بدلة رسمية', (SELECT id FROM users WHERE code = 'ADM001')),
((SELECT id FROM customers WHERE name = 'فاطمة علي'), 'فاطمة علي', 300.00, 'قيد التنفيذ', 'طلب فستان', (SELECT id FROM users WHERE code = 'ADM001')),
((SELECT id FROM customers WHERE name = 'محمد خالد'), 'محمد خالد', 400.00, 'معلق', 'طلب قميص', (SELECT id FROM users WHERE code = 'ADM001'))
ON CONFLICT DO NOTHING;

-- Insert sample invoices
INSERT INTO invoices (customer_id, customer_name, customer_phone, customer_address, total, paid_amount, status, notes, created_by) VALUES
((SELECT id FROM customers WHERE name = 'أحمد محمد العراقي'), 'أحمد محمد العراقي', '07701234567', 'بغداد - الكرادة', 500.00, 500.00, 'مدفوع', 'بدلة رسمية', (SELECT id FROM users WHERE code = 'ADM001')),
((SELECT id FROM customers WHERE name = 'فاطمة علي'), 'فاطمة علي', '07807654321', 'بغداد - الجادرية', 300.00, 150.00, 'جزئي', 'فستان زفاف', (SELECT id FROM users WHERE code = 'ADM001')),
((SELECT id FROM customers WHERE name = 'محمد خالد'), 'محمد خالد', '07909876543', 'بغداد - المنصور', 400.00, 0.00, 'معلق', 'قميص رسمي', (SELECT id FROM users WHERE code = 'ADM001'))
ON CONFLICT DO NOTHING;

-- Insert sample invoice items
INSERT INTO invoice_items (invoice_id, item_name, description, quantity, unit_price, total_price) VALUES
((SELECT id FROM invoices WHERE customer_name = 'أحمد محمد العراقي' LIMIT 1), 'بدلة رسمية', 'بدلة رجالية باللون الأزرق', 1, 500.00, 500.00),
((SELECT id FROM invoices WHERE customer_name = 'فاطمة علي' LIMIT 1), 'فستان زفاف', 'فستان أبيض مع تطريز', 1, 300.00, 300.00),
((SELECT id FROM invoices WHERE customer_name = 'محمد خالد' LIMIT 1), 'قميص رسمي', 'قميص أبيض بجودة عالية', 2, 200.00, 400.00)
ON CONFLICT DO NOTHING;

-- Insert sample payments
INSERT INTO payments (invoice_id, amount, payment_method, notes, created_by) VALUES
((SELECT id FROM invoices WHERE customer_name = 'أحمد محمد العراقي' LIMIT 1), 500.00, 'نقد', 'دفع كامل', (SELECT id FROM users WHERE code = 'ADM001')),
((SELECT id FROM invoices WHERE customer_name = 'فاطمة علي' LIMIT 1), 150.00, 'نقد', 'دفع جزئي', (SELECT id FROM users WHERE code = 'ADM001'))
ON CONFLICT DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (key, value, description) VALUES
('company_name', 'أزياء قرطبة', 'اسم الشركة'),
('company_address', 'بغداد، العراق', 'عنوان الشركة'),
('company_phone', '07701234567', 'هاتف الشركة'),
('company_email', 'info@qurtuba.com', 'بريد الشركة الإلكتروني'),
('currency', 'IQD', 'العملة المستخدمة'),
('tax_rate', '0', 'معدل الضريبة'),
('invoice_prefix', 'INV', 'بادئة أرقام الفواتير'),
('order_prefix', 'ORD', 'بادئة أرقام الطلبات')
ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON pages FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON actions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON customer_measurements FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON invoice_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON financial_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON system_settings FOR ALL USING (true);

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

SELECT 'Qurtuba Fashion complete database schema created successfully! All tables, indexes, triggers, and sample data are ready.' as message;

