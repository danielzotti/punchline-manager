-- Add color column to collection_items table
ALTER TABLE collection_items ADD COLUMN IF NOT EXISTS color VARCHAR(30);
