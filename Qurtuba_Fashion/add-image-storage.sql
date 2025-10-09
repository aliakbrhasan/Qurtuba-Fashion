-- Add image storage support to existing tables
-- Run this after the main database schema

-- Add image columns to existing tables
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fabric_image TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS design_image TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sample_image TEXT;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_image TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference_image TEXT;

-- Create images table for centralized image storage
CREATE TABLE IF NOT EXISTS images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    data_url TEXT NOT NULL,
    thumbnail_url TEXT,
    entity_type VARCHAR(50), -- 'invoice', 'customer', 'order'
    entity_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for images table
CREATE INDEX IF NOT EXISTS idx_images_entity_type ON images(entity_type);
CREATE INDEX IF NOT EXISTS idx_images_entity_id ON images(entity_id);
CREATE INDEX IF NOT EXISTS idx_images_created_by ON images(created_by);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- Enable RLS for images table
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for images
CREATE POLICY "Allow all operations for authenticated users" ON images FOR ALL USING (true);

-- Function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM images 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND entity_id IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get image by entity
CREATE OR REPLACE FUNCTION get_entity_images(
    p_entity_type VARCHAR(50),
    p_entity_id UUID
)
RETURNS TABLE (
    id UUID,
    filename VARCHAR(255),
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size INTEGER,
    width INTEGER,
    height INTEGER,
    data_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.filename,
        i.original_name,
        i.mime_type,
        i.size,
        i.width,
        i.height,
        i.data_url,
        i.thumbnail_url,
        i.created_at
    FROM images i
    WHERE i.entity_type = p_entity_type
    AND i.entity_id = p_entity_id
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Image storage support added successfully!' as message;
