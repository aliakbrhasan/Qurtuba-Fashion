-- Add fabric image column to invoices table
-- This script adds support for storing fabric images in invoices

-- Add fabric_image_url column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS fabric_image_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN invoices.fabric_image_url IS 'URL of the fabric image uploaded with the invoice';

-- Create index for better performance when searching by image
CREATE INDEX IF NOT EXISTS idx_invoices_fabric_image 
ON invoices(fabric_image_url) 
WHERE fabric_image_url IS NOT NULL;

-- Update existing invoices to have NULL fabric_image_url if not set
UPDATE invoices 
SET fabric_image_url = NULL 
WHERE fabric_image_url = '';

-- Grant permissions for the new column
GRANT SELECT, INSERT, UPDATE ON invoices TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
