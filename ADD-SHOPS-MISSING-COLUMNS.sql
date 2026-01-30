-- =====================================================
-- ADD MISSING COLUMNS TO SHOPS TABLE
-- This script adds all columns that are referenced in the code
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add missing columns to shops table
DO $$ 
BEGIN
    -- Add city column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'city') THEN
        ALTER TABLE shops ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to shops table';
    END IF;
    
    -- Add state column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'state') THEN
        ALTER TABLE shops ADD COLUMN state TEXT;
        RAISE NOTICE 'Added state column to shops table';
    END IF;
    
    -- Add pincode column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'pincode') THEN
        ALTER TABLE shops ADD COLUMN pincode TEXT;
        RAISE NOTICE 'Added pincode column to shops table';
    END IF;
    
    -- Add business_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'business_type') THEN
        ALTER TABLE shops ADD COLUMN business_type TEXT;
        RAISE NOTICE 'Added business_type column to shops table';
    END IF;
    
    -- Add rating column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'rating') THEN
        ALTER TABLE shops ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
        RAISE NOTICE 'Added rating column to shops table';
    END IF;
    
    -- Add delivery_time_minutes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'delivery_time_minutes') THEN
        ALTER TABLE shops ADD COLUMN delivery_time_minutes INTEGER DEFAULT 30;
        RAISE NOTICE 'Added delivery_time_minutes column to shops table';
    END IF;
    
    -- Add delivery_fee column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'delivery_fee') THEN
        ALTER TABLE shops ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Added delivery_fee column to shops table';
    END IF;
    
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'image_url') THEN
        ALTER TABLE shops ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to shops table';
    END IF;
    
    -- Add image_hint column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'image_hint') THEN
        ALTER TABLE shops ADD COLUMN image_hint TEXT;
        RAISE NOTICE 'Added image_hint column to shops table';
    END IF;
    
    -- Add registration_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'registration_date') THEN
        ALTER TABLE shops ADD COLUMN registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added registration_date column to shops table';
    END IF;
    
    -- Add approval_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'approval_date') THEN
        ALTER TABLE shops ADD COLUMN approval_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added approval_date column to shops table';
    END IF;
    
    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'rejection_reason') THEN
        ALTER TABLE shops ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column to shops table';
    END IF;
    
    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'approved_by') THEN
        ALTER TABLE shops ADD COLUMN approved_by TEXT REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added approved_by column to shops table';
    END IF;
    
    -- Add rejected_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'rejected_by') THEN
        ALTER TABLE shops ADD COLUMN rejected_by TEXT REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added rejected_by column to shops table';
    END IF;
    
    -- Update registration_date for existing shops if null
    UPDATE shops SET registration_date = created_at WHERE registration_date IS NULL;
    
    RAISE NOTICE '✅ All missing columns added successfully!';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_state ON shops(state);
CREATE INDEX IF NOT EXISTS idx_shops_business_type ON shops(business_type);
CREATE INDEX IF NOT EXISTS idx_shops_rating ON shops(rating DESC);
CREATE INDEX IF NOT EXISTS idx_shops_registration_date ON shops(registration_date DESC);

-- Add comments for documentation
COMMENT ON COLUMN shops.city IS 'City where the shop is located';
COMMENT ON COLUMN shops.state IS 'State where the shop is located';
COMMENT ON COLUMN shops.pincode IS 'Postal code of the shop location';
COMMENT ON COLUMN shops.business_type IS 'Type of business (e.g., grocery, restaurant, pharmacy)';
COMMENT ON COLUMN shops.rating IS 'Average customer rating (0-5 scale)';
COMMENT ON COLUMN shops.delivery_time_minutes IS 'Estimated delivery time in minutes';
COMMENT ON COLUMN shops.delivery_fee IS 'Delivery fee charged by the shop';
COMMENT ON COLUMN shops.image_url IS 'URL of the shop image';
COMMENT ON COLUMN shops.image_hint IS 'Alt text or description for the shop image';
COMMENT ON COLUMN shops.registration_date IS 'Date when shop was registered';
COMMENT ON COLUMN shops.approval_date IS 'Date when shop was approved by admin';
COMMENT ON COLUMN shops.rejection_reason IS 'Reason for rejection if shop was rejected';

-- Verify columns were added
SELECT 
    '✅ Shops table columns verification' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'shops') as total_columns,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'shops' 
     AND column_name IN ('city', 'state', 'pincode', 'business_type', 'rating', 
                         'delivery_time_minutes', 'delivery_fee', 'image_url', 
                         'image_hint', 'registration_date', 'approval_date', 
                         'rejection_reason', 'approved_by', 'rejected_by')) as added_columns;

-- Show all shops table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shops'
ORDER BY ordinal_position;

