-- ==============================================
-- COMPLETE DELIVERY AGENT DATABASE SETUP
-- This script ensures all tables and columns exist for delivery agent mapping
-- Run this script to fix delivery agent connection issues
-- ==============================================

-- ==============================================
-- 1. CREATE DELIVERY_AGENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS delivery_agents (
    id TEXT PRIMARY KEY DEFAULT 'agent_' || substr(md5(random()::text), 1, 8),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT,
    vehicle_number TEXT,
    license_number TEXT,
    aadhaar_number TEXT,
    address TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    is_available BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    latitude DECIMAL(10, 8), -- Agent current location
    longitude DECIMAL(11, 8), -- Agent current location
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE DELIVERIES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY DEFAULT 'delivery_' || substr(md5(random()::text), 1, 8),
    order_id TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_agent_id TEXT REFERENCES delivery_agents(id),
    status TEXT DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    assigned_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_address TEXT NOT NULL,
    delivery_phone TEXT,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    -- Location fields for pickup (shop)
    pickup_address TEXT,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    -- Location fields for delivery (customer)
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    -- Agent location tracking
    agent_latitude DECIMAL(10, 8),
    agent_longitude DECIMAL(11, 8),
    -- Delivery proof photo
    delivery_photo_url TEXT,
    delivery_photo_uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. ADD LOCATION COLUMNS TO ORDERS TABLE
-- ==============================================
DO $$ 
BEGIN
    -- Add customer location fields to orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_latitude') THEN
        ALTER TABLE orders ADD COLUMN customer_latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added customer_latitude column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_longitude') THEN
        ALTER TABLE orders ADD COLUMN customer_longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added customer_longitude column to orders table';
    END IF;
    
    -- Add shop location fields to orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shop_latitude') THEN
        ALTER TABLE orders ADD COLUMN shop_latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added shop_latitude column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shop_longitude') THEN
        ALTER TABLE orders ADD COLUMN shop_longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added shop_longitude column to orders table';
    END IF;
END $$;

-- ==============================================
-- 4. ADD LOCATION COLUMNS TO SHOPS TABLE
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'latitude') THEN
        ALTER TABLE shops ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column to shops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'longitude') THEN
        ALTER TABLE shops ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column to shops table';
    END IF;
END $$;

-- ==============================================
-- 5. ADD LOCATION COLUMNS TO USERS TABLE
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'latitude') THEN
        ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longitude') THEN
        ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column to users table';
    END IF;
END $$;

-- ==============================================
-- 6. ADD LOCATION COLUMNS TO DELIVERY_AGENTS TABLE
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_agents' AND column_name = 'latitude') THEN
        ALTER TABLE delivery_agents ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column to delivery_agents table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_agents' AND column_name = 'longitude') THEN
        ALTER TABLE delivery_agents ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column to delivery_agents table';
    END IF;
END $$;

-- ==============================================
-- 7. ENSURE ORDERS TABLE HAS ALL REQUIRED COLUMNS
-- ==============================================
DO $$ 
BEGIN
    -- Add payment_method if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT;
        RAISE NOTICE 'Added payment_method column to orders table';
    END IF;
    
    -- Add payment_status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT;
        RAISE NOTICE 'Added payment_status column to orders table';
    END IF;
    
    -- Add subtotal if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added subtotal column to orders table';
    END IF;
    
    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to orders table';
    END IF;
END $$;

-- ==============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON delivery_agents(status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_location ON delivery_agents(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id ON deliveries(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_pickup_location ON deliveries(pickup_latitude, pickup_longitude);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_location ON deliveries(delivery_latitude, delivery_longitude);
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(customer_latitude, customer_longitude, shop_latitude, shop_longitude);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);

-- ==============================================
-- 9. INSERT SAMPLE DELIVERY AGENT FOR TESTING
-- ==============================================
INSERT INTO delivery_agents (
    id, 
    email, 
    name, 
    password, 
    phone, 
    vehicle_type, 
    address,
    latitude,
    longitude,
    status, 
    is_available
) VALUES (
    'test_agent_1',
    'delivery@test.com',
    'Test Delivery Agent',
    '$2b$10$test_hash_for_delivery_agent_password',
    '9876543212',
    'bike',
    '789 Delivery Street, Mumbai, Maharashtra 400003',
    19.0760, -- Mumbai latitude
    72.8777, -- Mumbai longitude
    'APPROVED',
    true
) ON CONFLICT (id) DO UPDATE SET
    status = 'APPROVED',
    is_available = true,
    latitude = 19.0760,
    longitude = 72.8777;

-- ==============================================
-- 10. ADD FOREIGN KEY RELATIONSHIPS
-- ==============================================
-- These are REQUIRED for Supabase to recognize relationships in queries
-- Without these, nested selects (shop:shops(...)) will fail

-- Add foreign key: orders.customer_id -> users.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'customer_id'
            AND kcu.table_name = 'orders'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_customer_id 
        FOREIGN KEY (customer_id) 
        REFERENCES users(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key: orders.customer_id -> users.id';
    ELSE
        RAISE NOTICE 'Foreign key orders.customer_id -> users.id already exists';
    END IF;
END $$;

-- Add foreign key: orders.shop_id -> shops.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'shop_id'
            AND kcu.table_name = 'orders'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_shop_id 
        FOREIGN KEY (shop_id) 
        REFERENCES shops(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key: orders.shop_id -> shops.id';
    ELSE
        RAISE NOTICE 'Foreign key orders.shop_id -> shops.id already exists';
    END IF;
END $$;

-- Add foreign key: deliveries.delivery_agent_id -> delivery_agents.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'deliveries' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'delivery_agent_id'
            AND kcu.table_name = 'deliveries'
    ) THEN
        ALTER TABLE deliveries 
        ADD CONSTRAINT fk_deliveries_delivery_agent_id 
        FOREIGN KEY (delivery_agent_id) 
        REFERENCES delivery_agents(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key: deliveries.delivery_agent_id -> delivery_agents.id';
    ELSE
        RAISE NOTICE 'Foreign key deliveries.delivery_agent_id -> delivery_agents.id already exists';
    END IF;
END $$;

-- Note: deliveries.order_id foreign key is already created in the table definition above

-- ==============================================
-- 11. ADD DELIVERY PHOTO COLUMNS (IF MISSING)
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_photo_url') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_photo_url TEXT;
        RAISE NOTICE 'Added delivery_photo_url column to deliveries table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_photo_uploaded_at') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_photo_uploaded_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added delivery_photo_uploaded_at column to deliveries table';
    END IF;
END $$;

-- ==============================================
-- 12. VERIFICATION QUERIES
-- ==============================================
SELECT '✅ Complete Delivery Agent Database Setup Completed!' as status;

-- Show table structures
SELECT 'Delivery Agents table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'delivery_agents' 
ORDER BY ordinal_position;

SELECT 'Deliveries table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
ORDER BY ordinal_position;

SELECT 'Orders table location columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('customer_latitude', 'customer_longitude', 'shop_latitude', 'shop_longitude')
ORDER BY ordinal_position;

-- Show sample delivery agent
SELECT 'Sample delivery agent:' as info;
SELECT id, name, email, status, is_available, latitude, longitude 
FROM delivery_agents 
WHERE id = 'test_agent_1';

-- Show counts
SELECT 'Total delivery agents:' as info, COUNT(*) as count FROM delivery_agents;
SELECT 'Total deliveries:' as info, COUNT(*) as count FROM deliveries;
SELECT 'Available delivery agents:' as info, COUNT(*) as count FROM delivery_agents WHERE is_available = true AND status = 'APPROVED';

