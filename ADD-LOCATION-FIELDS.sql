-- ADD LOCATION FIELDS FOR DELIVERY MAPPING
-- This script adds latitude/longitude fields to support accurate delivery location mapping

-- ==============================================
-- 1. ADD LOCATION FIELDS TO ORDERS TABLE
-- ==============================================
DO $$ 
BEGIN
    -- Add customer location fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_latitude') THEN
        ALTER TABLE orders ADD COLUMN customer_latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_longitude') THEN
        ALTER TABLE orders ADD COLUMN customer_longitude DECIMAL(11, 8);
    END IF;
    
    -- Add shopkeeper location fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shop_latitude') THEN
        ALTER TABLE orders ADD COLUMN shop_latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shop_longitude') THEN
        ALTER TABLE orders ADD COLUMN shop_longitude DECIMAL(11, 8);
    END IF;
END $$;

-- ==============================================
-- 2. ADD LOCATION FIELDS TO DELIVERIES TABLE
-- ==============================================
DO $$ 
BEGIN
    -- Add pickup location (shopkeeper address)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_latitude') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_longitude') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_longitude DECIMAL(11, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pickup_address') THEN
        ALTER TABLE deliveries ADD COLUMN pickup_address TEXT;
    END IF;
    
    -- Add delivery location (customer address)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_latitude') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_longitude') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_longitude DECIMAL(11, 8);
    END IF;
    
    -- Add current delivery agent location (for tracking)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'agent_latitude') THEN
        ALTER TABLE deliveries ADD COLUMN agent_latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'agent_longitude') THEN
        ALTER TABLE deliveries ADD COLUMN agent_longitude DECIMAL(11, 8);
    END IF;
END $$;

-- ==============================================
-- 3. ADD LOCATION FIELDS TO SHOPS TABLE
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'latitude') THEN
        ALTER TABLE shops ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'longitude') THEN
        ALTER TABLE shops ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
END $$;

-- ==============================================
-- 4. ADD LOCATION FIELDS TO USERS TABLE (CUSTOMER ADDRESSES)
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'latitude') THEN
        ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longitude') THEN
        ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
END $$;

-- ==============================================
-- 5. CREATE INDEXES FOR LOCATION QUERIES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_deliveries_pickup_location ON deliveries(pickup_latitude, pickup_longitude);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_location ON deliveries(delivery_latitude, delivery_longitude);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Location fields added successfully!' as status;
SELECT 'Orders, Deliveries, Shops, and Users tables now support location tracking!' as message;

