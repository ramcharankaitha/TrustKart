-- ENHANCED DELIVERY AGENT DATABASE SETUP FOR SUPABASE/POSTGRESQL
-- This script creates the delivery agent tables with document support and admin review functionality

-- ==============================================
-- 1. CREATE DELIVERY_AGENTS TABLE (ENHANCED)
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
    rejection_reason TEXT, -- Reason for rejection if status is REJECTED
    reviewed_by TEXT, -- Admin who reviewed the application
    reviewed_at TIMESTAMP WITH TIME ZONE, -- When the application was reviewed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE DELIVERY_AGENT_DOCUMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS delivery_agent_documents (
    id TEXT PRIMARY KEY DEFAULT 'doc_' || substr(md5(random()::text), 1, 8),
    delivery_agent_id TEXT NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('driving_license', 'aadhaar_card', 'vehicle_rc', 'pan_card', 'profile_photo')),
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL, -- URL or path to the uploaded document
    file_size INTEGER, -- File size in bytes
    file_type TEXT, -- MIME type (image/jpeg, application/pdf, etc.)
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false, -- Admin verification status
    verification_notes TEXT -- Admin notes about the document
);

-- ==============================================
-- 3. CREATE DELIVERIES TABLE
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
-- 4. UPDATE USERS TABLE TO SUPPORT DELIVERY_AGENT ROLE
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
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('CUSTOMER', 'SHOPKEEPER', 'ADMIN', 'DELIVERY_AGENT'));
    END IF;
END $$;

-- ==============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON delivery_agents(status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_rating ON delivery_agents(rating);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_created_at ON delivery_agents(created_at);

CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_agent_id ON delivery_agent_documents(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_type ON delivery_agent_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_verified ON delivery_agent_documents(is_verified);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id ON deliveries(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_at ON deliveries(assigned_at);

-- ==============================================
-- 6. INSERT SAMPLE DELIVERY AGENT FOR TESTING
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
    'PENDING',
    false
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 7. INSERT SAMPLE DOCUMENTS FOR TESTING
-- ==============================================
INSERT INTO delivery_agent_documents (
    id,
    delivery_agent_id,
    document_type,
    document_name,
    document_url,
    file_size,
    file_type,
    is_verified
) VALUES 
(
    'doc_test_1',
    'test_agent_1',
    'driving_license',
    'DL123456789.pdf',
    '/uploads/documents/test_agent_1/driving_license.pdf',
    1024000,
    'application/pdf',
    false
),
(
    'doc_test_2',
    'test_agent_1',
    'aadhaar_card',
    'Aadhaar_Front.jpg',
    '/uploads/documents/test_agent_1/aadhaar_front.jpg',
    512000,
    'image/jpeg',
    false
),
(
    'doc_test_3',
    'test_agent_1',
    'vehicle_rc',
    'RC_ABC1234.pdf',
    '/uploads/documents/test_agent_1/vehicle_rc.pdf',
    768000,
    'application/pdf',
    false
),
(
    'doc_test_4',
    'test_agent_1',
    'pan_card',
    'PAN_ABCDE1234F.pdf',
    '/uploads/documents/test_agent_1/pan_card.pdf',
    256000,
    'application/pdf',
    false
),
(
    'doc_test_5',
    'test_agent_1',
    'profile_photo',
    'Profile_Photo.jpg',
    '/uploads/documents/test_agent_1/profile_photo.jpg',
    384000,
    'image/jpeg',
    false
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 8. CREATE SAMPLE DELIVERY FOR TESTING (if orders exist)
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
-- 9. VERIFICATION QUERIES
-- ==============================================
SELECT 'Enhanced Delivery Agent Database Setup Completed!' as status;

-- Show table structures
SELECT 'Delivery Agents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'delivery_agents' 
ORDER BY ordinal_position;

SELECT 'Delivery Agent Documents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'delivery_agent_documents' 
ORDER BY ordinal_position;

SELECT 'Deliveries table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
ORDER BY ordinal_position;

-- Show sample data
SELECT 'Sample delivery agent created:' as info;
SELECT id, name, email, status, is_available FROM delivery_agents WHERE id = 'test_agent_1';

SELECT 'Sample documents created:' as info;
SELECT id, document_type, document_name, is_verified FROM delivery_agent_documents WHERE delivery_agent_id = 'test_agent_1';

SELECT 'Sample delivery created:' as info;
SELECT id, order_id, status, delivery_address FROM deliveries WHERE id = 'test_delivery_1';

-- Show counts
SELECT 'Total delivery agents:' as info, COUNT(*) as count FROM delivery_agents;
SELECT 'Total documents:' as info, COUNT(*) as count FROM delivery_agent_documents;
SELECT 'Total deliveries:' as info, COUNT(*) as count FROM deliveries;
