-- Create table for organic vegetables with admin approval system
-- This table stores vegetables that need admin approval before being visible

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS organic_vegetables CASCADE;

-- Create organic_vegetables table
CREATE TABLE IF NOT EXISTS organic_vegetables (
  id TEXT PRIMARY KEY DEFAULT 'veg_' || substr(md5(random()::text), 1, 8),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg', -- kg, piece, bundle, etc.
  category TEXT, -- e.g., 'Leafy Greens', 'Root Vegetables', 'Fruits', etc.
  image_url TEXT,
  nutritional_info JSONB, -- Store nutritional information as JSON
  origin TEXT, -- Farm location or origin
  certification TEXT, -- Organic certification details
  farmer_name TEXT, -- Name of the farmer/supplier
  farmer_contact TEXT, -- Contact information
  quantity_available DECIMAL(10, 2) DEFAULT 0,
  min_order_quantity DECIMAL(10, 2) DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by TEXT, -- User ID who submitted (can be shopkeeper or farmer)
  shop_id TEXT REFERENCES shops(id) ON DELETE SET NULL, -- Optional: link to shop
  rejection_reason TEXT,
  approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organic_vegetables_status ON organic_vegetables(status);
CREATE INDEX IF NOT EXISTS idx_organic_vegetables_submitted_by ON organic_vegetables(submitted_by);
CREATE INDEX IF NOT EXISTS idx_organic_vegetables_shop_id ON organic_vegetables(shop_id);
CREATE INDEX IF NOT EXISTS idx_organic_vegetables_category ON organic_vegetables(category);
CREATE INDEX IF NOT EXISTS idx_organic_vegetables_created_at ON organic_vegetables(created_at DESC);

-- Add comment to table
COMMENT ON TABLE organic_vegetables IS 'Organic vegetables submitted for approval. Only approved vegetables are visible to customers.';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organic_vegetables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organic_vegetables_updated_at
  BEFORE UPDATE ON organic_vegetables
  FOR EACH ROW
  EXECUTE FUNCTION update_organic_vegetables_updated_at();

-- Grant permissions (adjust based on your Supabase setup)
-- These are typically handled by Supabase RLS policies

SELECT 'Organic vegetables table created successfully!' as status;

