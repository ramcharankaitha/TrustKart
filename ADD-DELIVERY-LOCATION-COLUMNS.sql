-- ADD DELIVERY LOCATION COLUMNS
-- This script adds pickup and delivery location fields to the deliveries table
-- Run this if you get errors about missing columns like pickup_address, pickup_latitude, etc.

-- ==============================================
-- ADD LOCATION FIELDS TO DELIVERIES TABLE
-- ==============================================
DO $$ 
BEGIN
    -- Add pickup location (shopkeeper address)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_latitude') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added pickup_latitude column to deliveries table';
    ELSE
        RAISE NOTICE 'pickup_latitude column already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_longitude') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added pickup_longitude column to deliveries table';
    ELSE
        RAISE NOTICE 'pickup_longitude column already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_address') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_address TEXT;
        RAISE NOTICE 'Added pickup_address column to deliveries table';
    ELSE
        RAISE NOTICE 'pickup_address column already exists';
    END IF;
    
    -- Add delivery location (customer address coordinates)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_latitude') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added delivery_latitude column to deliveries table';
    ELSE
        RAISE NOTICE 'delivery_latitude column already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_longitude') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added delivery_longitude column to deliveries table';
    ELSE
        RAISE NOTICE 'delivery_longitude column already exists';
    END IF;
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Delivery location columns added successfully!' as status;

-- Show all columns in deliveries table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
ORDER BY column_name;

