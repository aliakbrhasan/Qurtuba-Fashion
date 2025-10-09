-- إعداد قاعدة البيانات لنظام إدارة الأدوار
-- Qurtuba Fashion - Roles Management System

-- إنشاء جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    allowed_pages TEXT[] DEFAULT '{}',
    allowed_actions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الصفحات
CREATE TABLE IF NOT EXISTS pages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الإجراءات
CREATE TABLE IF NOT EXISTS actions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج الصفحات الافتراضية
INSERT INTO pages (id, name, description, category) VALUES
('dashboard', 'الصفحة الرئيسية', 'لوحة التحكم الرئيسية', 'عام'),
('invoices', 'الفواتير', 'إدارة الفواتير', 'المبيعات'),
('customers', 'الزبائن', 'إدارة العملاء', 'المبيعات'),
('financial', 'المالية', 'الإدارة المالية', 'المالية'),
('reports', 'التقارير', 'تقارير النظام', 'التقارير'),
('users', 'إدارة المستخدمين', 'إدارة المستخدمين والأدوار', 'الإدارة')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = NOW();

-- إدراج الإجراءات الافتراضية
INSERT INTO actions (id, name, description, category) VALUES
-- إجراءات الفواتير
('create_invoice', 'إنشاء فاتورة جديدة', 'إضافة فاتورة جديدة', 'الفواتير'),
('edit_invoice', 'تعديل الفاتورة', 'تعديل بيانات الفاتورة', 'الفواتير'),
('delete_invoice', 'حذف الفاتورة', 'حذف الفاتورة', 'الفواتير'),
('change_invoice_status', 'تغيير حالة الفاتورة', 'تعديل حالة الفاتورة', 'الفواتير'),
('mark_invoice_paid', 'تسجيل دفع الفاتورة', 'تسجيل دفع الفاتورة', 'الفواتير'),
('print_invoice', 'طباعة الفاتورة', 'طباعة الفاتورة', 'الفواتير'),
('print_invoices_list', 'طباعة قائمة الفواتير', 'طباعة قائمة الفواتير', 'الفواتير'),

-- إجراءات العملاء
('create_customer', 'إضافة زبون جديد', 'إضافة عميل جديد', 'العملاء'),
('edit_customer', 'تعديل بيانات الزبون', 'تعديل بيانات العميل', 'العملاء'),
('delete_customer', 'حذف الزبون', 'حذف العميل', 'العملاء'),
('view_customer_details', 'عرض تفاصيل الزبون', 'عرض تفاصيل العميل', 'العملاء'),
('print_customers_list', 'طباعة قائمة الزبائن', 'طباعة قائمة العملاء', 'العملاء'),

-- إجراءات المالية
('view_financial_reports', 'عرض التقارير المالية', 'عرض التقارير المالية', 'المالية'),
('manage_payments', 'إدارة المدفوعات', 'إدارة المدفوعات', 'المالية'),
('view_income_statement', 'عرض قائمة الدخل', 'عرض قائمة الدخل', 'المالية'),

-- إجراءات التقارير
('generate_sales_report', 'تقرير المبيعات', 'توليد تقرير المبيعات', 'التقارير'),
('generate_customer_report', 'تقرير العملاء', 'توليد تقرير العملاء', 'التقارير'),
('generate_financial_report', 'تقرير مالي', 'توليد تقرير مالي', 'التقارير'),

-- إجراءات الإدارة
('manage_users', 'إدارة المستخدمين', 'إدارة المستخدمين', 'الإدارة'),
('manage_roles', 'إدارة الأدوار', 'إدارة الأدوار والصلاحيات', 'الإدارة'),
('system_settings', 'إعدادات النظام', 'تعديل إعدادات النظام', 'الإدارة')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = NOW();

-- إدراج الأدوار الافتراضية
INSERT INTO roles (id, name, description, permissions, allowed_pages, allowed_actions) VALUES
('1', 'مدير النظام', 'صلاحيات كاملة في النظام', 
 ARRAY['إدارة المستخدمين', 'إدارة الفواتير', 'إدارة العملاء', 'التقارير', 'الإعدادات'],
 ARRAY['dashboard', 'invoices', 'customers', 'financial', 'reports', 'users'],
 ARRAY['create_invoice', 'edit_invoice', 'delete_invoice', 'change_invoice_status', 'mark_invoice_paid', 'print_invoice', 'print_invoices_list', 'create_customer', 'edit_customer', 'delete_customer', 'view_customer_details', 'print_customers_list', 'view_financial_reports', 'manage_payments', 'view_income_statement', 'generate_sales_report', 'generate_customer_report', 'generate_financial_report', 'manage_users', 'manage_roles', 'system_settings']),

('2', 'مندوب مبيعات', 'إدارة المبيعات والعملاء',
 ARRAY['إدارة العملاء', 'إنشاء الفواتير', 'عرض التقارير'],
 ARRAY['dashboard', 'invoices', 'customers', 'reports'],
 ARRAY['create_invoice', 'edit_invoice', 'change_invoice_status', 'print_invoice', 'print_invoices_list', 'create_customer', 'edit_customer', 'view_customer_details', 'print_customers_list', 'generate_sales_report', 'generate_customer_report']),

('3', 'محاسب رئيسي', 'إدارة الحسابات والمالية',
 ARRAY['إدارة الفواتير', 'التقارير المالية', 'إدارة المدفوعات'],
 ARRAY['dashboard', 'invoices', 'financial', 'reports'],
 ARRAY['create_invoice', 'edit_invoice', 'delete_invoice', 'change_invoice_status', 'mark_invoice_paid', 'print_invoice', 'print_invoices_list', 'view_financial_reports', 'manage_payments', 'view_income_statement', 'generate_sales_report', 'generate_financial_report'])
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    allowed_pages = EXCLUDED.allowed_pages,
    allowed_actions = EXCLUDED.allowed_actions,
    updated_at = NOW();

-- تحديث جدول المستخدمين لإضافة ربط بالأدوار
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- تحديث المستخدمين الافتراضيين لربطهم بالأدوار
UPDATE users SET role_id = '1' WHERE email = 'admin@qurtuba.com';
UPDATE users SET role_id = '2' WHERE email LIKE '%sales%' OR status = 'موظف';
UPDATE users SET role_id = '3' WHERE email LIKE '%accountant%' OR status = 'محاسب';

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_pages_is_active ON pages(is_active);
CREATE INDEX IF NOT EXISTS idx_actions_is_active ON actions(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at تلقائياً
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_actions_updated_at ON actions;
CREATE TRIGGER update_actions_updated_at
    BEFORE UPDATE ON actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- إنشاء Row Level Security (RLS)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للقراءة فقط (يمكن تخصيصها حسب الحاجة)
CREATE POLICY "Allow read access to all roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Allow read access to all pages" ON pages FOR SELECT USING (true);
CREATE POLICY "Allow read access to all actions" ON actions FOR SELECT USING (true);

-- سياسات للكتابة (يمكن تخصيصها حسب الحاجة)
CREATE POLICY "Allow insert access to roles" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to roles" ON roles FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to roles" ON roles FOR DELETE USING (true);

-- رسالة نجاح
SELECT 'تم إنشاء نظام إدارة الأدوار بنجاح!' as message;
