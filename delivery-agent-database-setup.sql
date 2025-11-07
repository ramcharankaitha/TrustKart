-- Create delivery agents table
CREATE TABLE IF NOT EXISTS delivery_agents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- Add delivery_agent role to users table if it doesn't exist
-- Note: This assumes the users table already exists
-- You may need to run this separately if the users table doesn't have the role column yet

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON delivery_agents(status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id ON deliveries(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Insert a sample delivery agent for testing (optional)
-- INSERT INTO delivery_agents (email, name, password, phone, vehicle_type, address, status, is_available)
-- VALUES ('delivery@test.com', 'Test Delivery Agent', '$2a$10$hashedpassword', '9876543210', 'bike', 'Test Address', 'APPROVED', true)
-- ON CONFLICT (email) DO NOTHING;
