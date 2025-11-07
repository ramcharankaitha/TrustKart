-- ADD LOCATION FIELDS TO DELIVERY_AGENTS TABLE
-- This script adds latitude and longitude fields to the delivery_agents table
-- Run this if you want to store delivery agent locations in the database

-- ==============================================
-- ADD LOCATION FIELDS TO DELIVERY_AGENTS TABLE
-- ==============================================
DO $$ 
BEGIN
    -- Add latitude field for delivery agent location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_agents' AND column_name = 'latitude') THEN
        ALTER TABLE delivery_agents ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column to delivery_agents table';
    ELSE
        RAISE NOTICE 'latitude column already exists';
    END IF;
    
    -- Add longitude field for delivery agent location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_agents' AND column_name = 'longitude') THEN
        ALTER TABLE delivery_agents ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column to delivery_agents table';
    ELSE
        RAISE NOTICE 'longitude column already exists';
    END IF;
    
    -- Add last_location_update timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_agents' AND column_name = 'last_location_update') THEN
        ALTER TABLE delivery_agents ADD COLUMN last_location_update TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_location_update column to delivery_agents table';
    ELSE
        RAISE NOTICE 'last_location_update column already exists';
    END IF;
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Delivery agent location columns added successfully!' as status;

-- Show all columns in delivery_agents table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_agents' 
ORDER BY column_name;

