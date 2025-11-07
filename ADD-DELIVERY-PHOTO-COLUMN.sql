-- ==============================================
-- ADD DELIVERY PHOTO COLUMN
-- This script adds a column to store delivery proof photos
-- Delivery agents must upload a photo before marking delivery as complete
-- ==============================================

-- Add delivery_photo_url column to deliveries table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliveries' 
        AND column_name = 'delivery_photo_url'
    ) THEN
        ALTER TABLE deliveries 
        ADD COLUMN delivery_photo_url TEXT;
        
        RAISE NOTICE '✅ Added delivery_photo_url column to deliveries table';
    ELSE
        RAISE NOTICE 'ℹ️ delivery_photo_url column already exists in deliveries table';
    END IF;
END $$;

-- Add delivery_photo_uploaded_at timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliveries' 
        AND column_name = 'delivery_photo_uploaded_at'
    ) THEN
        ALTER TABLE deliveries 
        ADD COLUMN delivery_photo_uploaded_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Added delivery_photo_uploaded_at column to deliveries table';
    ELSE
        RAISE NOTICE 'ℹ️ delivery_photo_uploaded_at column already exists in deliveries table';
    END IF;
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT '✅ Delivery photo columns added successfully!' as status;

-- Show delivery photo columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
AND column_name IN ('delivery_photo_url', 'delivery_photo_uploaded_at')
ORDER BY column_name;

