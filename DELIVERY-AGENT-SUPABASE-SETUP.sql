-- DELIVERY AGENT DATABASE SETUP FOR SUPABASE/POSTGRESQL
-- This script creates the delivery agent tables compatible with your existing database structure

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. UPDATE USERS TABLE TO SUPPORT DELIVERY_AGENT ROLE
-- ==============================================
DO $$ 
BEGIN
    -- Check if delivery_agent role exists in users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%role%' 
        AND check_clause LIKE '%DELIVERY_AGENT%'
    ) THEN
        -- Update the role constraint to include DELIVERY_AGENT
        -- Note: This might need to be adjusted based on your existing constraint
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('CUSTOMER', 'SHOPKEEPER', 'ADMIN', 'DELIVERY_AGENT'));
    END IF;
END $$;

-- ==============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON delivery_agents(status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_rating ON delivery_agents(rating);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id ON deliveries(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_at ON deliveries(assigned_at);

-- ==============================================
-- 5. INSERT SAMPLE DELIVERY AGENT FOR TESTING
-- ==============================================
INSERT INTO delivery_agents (
    id, 
    email, 
    name, 
    password, 
    phone, 
    vehicle_type, 
    address, 
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
    'APPROVED',
    true
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 6. CREATE SAMPLE DELIVERY FOR TESTING (if orders exist)
-- ==============================================
DO $$
DECLARE
    sample_order_id TEXT;
BEGIN
    -- Get a sample order if it exists
    SELECT id INTO sample_order_id FROM orders LIMIT 1;
    
    IF sample_order_id IS NOT NULL THEN
        INSERT INTO deliveries (
            id,
            order_id,
            delivery_agent_id,
            status,
            assigned_at,
            delivery_address,
            delivery_phone
        ) VALUES (
            'test_delivery_1',
            sample_order_id,
            'test_agent_1',
            'ASSIGNED',
            NOW(),
            '123 Test Street, Mumbai, Maharashtra 400001',
            '9876543210'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================
SELECT 'Delivery Agent Database Setup Completed!' as status;

-- Show table structures
SELECT 'Delivery Agents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'delivery_agents' 
ORDER BY ordinal_position;

SELECT 'Deliveries table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
ORDER BY ordinal_position;

-- Show sample data
SELECT 'Sample delivery agent created:' as info;
SELECT id, name, email, status, is_available FROM delivery_agents WHERE id = 'test_agent_1';

SELECT 'Sample delivery created:' as info;
SELECT id, order_id, status, delivery_address FROM deliveries WHERE id = 'test_delivery_1';

-- Show counts
SELECT 'Total delivery agents:' as info, COUNT(*) as count FROM delivery_agents;
SELECT 'Total deliveries:' as info, COUNT(*) as count FROM deliveries;
