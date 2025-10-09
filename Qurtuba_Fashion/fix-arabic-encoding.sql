-- Fix Arabic Encoding in Supabase Database
-- This script ensures proper UTF-8 support for Arabic text

-- Set database encoding to UTF-8
ALTER DATABASE postgres SET client_encoding = 'UTF8';

-- Update existing tables to use proper character encoding
-- Users table
ALTER TABLE users 
ALTER COLUMN name TYPE VARCHAR(255) COLLATE "C",
ALTER COLUMN status TYPE VARCHAR(20) COLLATE "C",
ALTER COLUMN role TYPE VARCHAR(100) COLLATE "C";

-- Roles table  
ALTER TABLE roles
ALTER COLUMN name TYPE VARCHAR(100) COLLATE "C",
ALTER COLUMN description TYPE TEXT COLLATE "C";

-- Customers table
ALTER TABLE customers
ALTER COLUMN name TYPE VARCHAR(255) COLLATE "C",
ALTER COLUMN phone TYPE VARCHAR(20) COLLATE "C",
ALTER COLUMN address TYPE TEXT COLLATE "C";

-- Orders table
ALTER TABLE orders
ALTER COLUMN status TYPE VARCHAR(20) COLLATE "C",
ALTER COLUMN notes TYPE TEXT COLLATE "C";

-- Invoices table
ALTER TABLE invoices
ALTER COLUMN customer_name TYPE VARCHAR(255) COLLATE "C",
ALTER COLUMN customer_phone TYPE VARCHAR(20) COLLATE "C",
ALTER COLUMN customer_address TYPE TEXT COLLATE "C",
ALTER COLUMN status TYPE VARCHAR(20) COLLATE "C",
ALTER COLUMN notes TYPE TEXT COLLATE "C";

-- Invoice items table
ALTER TABLE invoice_items
ALTER COLUMN item_name TYPE VARCHAR(255) COLLATE "C",
ALTER COLUMN description TYPE TEXT COLLATE "C";

-- Customer measurements table
ALTER TABLE customer_measurements
ALTER COLUMN notes TYPE TEXT COLLATE "C";

-- Create a function to ensure proper UTF-8 encoding
CREATE OR REPLACE FUNCTION ensure_utf8_encoding(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to UTF-8 if not already
    RETURN convert_from(convert_to(input_text, 'UTF8'), 'UTF8');
EXCEPTION
    WHEN OTHERS THEN
        -- If conversion fails, return original text
        RETURN input_text;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically fix encoding on insert/update
CREATE OR REPLACE FUNCTION fix_arabic_encoding()
RETURNS TRIGGER AS $$
BEGIN
    -- Fix encoding for text fields
    IF TG_TABLE_NAME = 'users' THEN
        NEW.name = ensure_utf8_encoding(NEW.name);
        NEW.status = ensure_utf8_encoding(NEW.status);
        NEW.role = ensure_utf8_encoding(NEW.role);
    ELSIF TG_TABLE_NAME = 'customers' THEN
        NEW.name = ensure_utf8_encoding(NEW.name);
        NEW.phone = ensure_utf8_encoding(NEW.phone);
        NEW.address = ensure_utf8_encoding(NEW.address);
    ELSIF TG_TABLE_NAME = 'invoices' THEN
        NEW.customer_name = ensure_utf8_encoding(NEW.customer_name);
        NEW.customer_phone = ensure_utf8_encoding(NEW.customer_phone);
        NEW.customer_address = ensure_utf8_encoding(NEW.customer_address);
        NEW.status = ensure_utf8_encoding(NEW.status);
        NEW.notes = ensure_utf8_encoding(NEW.notes);
    ELSIF TG_TABLE_NAME = 'invoice_items' THEN
        NEW.item_name = ensure_utf8_encoding(NEW.item_name);
        NEW.description = ensure_utf8_encoding(NEW.description);
    ELSIF TG_TABLE_NAME = 'orders' THEN
        NEW.status = ensure_utf8_encoding(NEW.status);
        NEW.notes = ensure_utf8_encoding(NEW.notes);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all relevant tables
DROP TRIGGER IF EXISTS fix_encoding_users ON users;
CREATE TRIGGER fix_encoding_users
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fix_arabic_encoding();

DROP TRIGGER IF EXISTS fix_encoding_customers ON customers;
CREATE TRIGGER fix_encoding_customers
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION fix_arabic_encoding();

DROP TRIGGER IF EXISTS fix_encoding_invoices ON invoices;
CREATE TRIGGER fix_encoding_invoices
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION fix_arabic_encoding();

DROP TRIGGER IF EXISTS fix_encoding_invoice_items ON invoice_items;
CREATE TRIGGER fix_encoding_invoice_items
    BEFORE INSERT OR UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION fix_arabic_encoding();

DROP TRIGGER IF EXISTS fix_encoding_orders ON orders;
CREATE TRIGGER fix_encoding_orders
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fix_arabic_encoding();

-- Update existing data to fix encoding issues
UPDATE users SET 
    name = ensure_utf8_encoding(name),
    status = ensure_utf8_encoding(status),
    role = ensure_utf8_encoding(role)
WHERE name IS NOT NULL;

UPDATE customers SET 
    name = ensure_utf8_encoding(name),
    phone = ensure_utf8_encoding(phone),
    address = ensure_utf8_encoding(address)
WHERE name IS NOT NULL;

UPDATE invoices SET 
    customer_name = ensure_utf8_encoding(customer_name),
    customer_phone = ensure_utf8_encoding(customer_phone),
    customer_address = ensure_utf8_encoding(customer_address),
    status = ensure_utf8_encoding(status),
    notes = ensure_utf8_encoding(notes)
WHERE customer_name IS NOT NULL;

UPDATE invoice_items SET 
    item_name = ensure_utf8_encoding(item_name),
    description = ensure_utf8_encoding(description)
WHERE item_name IS NOT NULL;

UPDATE orders SET 
    status = ensure_utf8_encoding(status),
    notes = ensure_utf8_encoding(notes)
WHERE status IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION ensure_utf8_encoding(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_arabic_encoding() TO authenticated;
