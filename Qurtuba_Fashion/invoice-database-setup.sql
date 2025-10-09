-- Invoice Database Setup for Qurtuba Fashion
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Invoices table
CREATE TABLE invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID,
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

-- Create indexes for better performance
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Create function for automatic invoice number generation
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

-- Create trigger to auto-generate invoice numbers
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

-- Insert sample invoice data
INSERT INTO invoices (customer_name, customer_phone, customer_address, total, paid_amount, status, notes) VALUES
('أحمد محمد العراقي', '07701234567', 'بغداد - الكرادة', 500.00, 500.00, 'مدفوع', 'بدلة رسمية'),
('فاطمة علي', '07807654321', 'بغداد - الجادرية', 300.00, 150.00, 'جزئي', 'فستان زفاف'),
('محمد خالد', '07909876543', 'بغداد - المنصور', 400.00, 0.00, 'معلق', 'قميص رسمي')
ON CONFLICT DO NOTHING;

-- Insert sample invoice items
INSERT INTO invoice_items (invoice_id, item_name, description, quantity, unit_price, total_price) VALUES
((SELECT id FROM invoices WHERE customer_name = 'أحمد محمد العراقي' LIMIT 1), 'بدلة رسمية', 'بدلة رجالية باللون الأزرق', 1, 500.00, 500.00),
((SELECT id FROM invoices WHERE customer_name = 'فاطمة علي' LIMIT 1), 'فستان زفاف', 'فستان أبيض مع تطريز', 1, 300.00, 300.00),
((SELECT id FROM invoices WHERE customer_name = 'محمد خالد' LIMIT 1), 'قميص رسمي', 'قميص أبيض بجودة عالية', 2, 200.00, 400.00)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON invoice_items FOR ALL USING (true);

-- Success message
SELECT 'Invoice database tables created successfully!' as message;


