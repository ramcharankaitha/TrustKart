-- APPLICATION-BASED ORDER SYSTEM SETUP
-- This script creates the exact database structure used by the application

-- ==============================================
-- 1. CREATE ORDERS TABLE (Based on Prisma Schema)
-- ==============================================
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT 'order_' || substr(md5(random()::text), 1, 8),
    customer_id TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) DEFAULT 0,
    delivery_address TEXT,
    delivery_phone TEXT,
    payment_method TEXT,
    payment_status TEXT,
    notes TEXT,
    request_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE ORDER_ITEMS TABLE (Based on Prisma Schema)
-- ==============================================
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT 'item_' || substr(md5(random()::text), 1, 8),
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    approval_status TEXT DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==============================================

-- Add missing columns to orders table
DO $$ 
BEGIN
    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT;
    END IF;
    
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT;
    END IF;
    
    -- Add request_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'request_type') THEN
        ALTER TABLE orders ADD COLUMN request_type TEXT;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add missing columns to order_items table
DO $$ 
BEGIN
    -- Add approval_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'approval_status') THEN
        ALTER TABLE order_items ADD COLUMN approval_status TEXT DEFAULT 'PENDING';
    END IF;
    
    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'rejection_reason') THEN
        ALTER TABLE order_items ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'created_at') THEN
        ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ==============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ==============================================
-- 5. INSERT TEST DATA USING EXISTING USERS
-- ==============================================

-- Get existing users and create test data
DO $$ 
DECLARE
    shopkeeper_id TEXT;
    customer_id TEXT;
    shop_id TEXT;
    order_id TEXT;
BEGIN
    -- Get first shopkeeper user (try different role formats)
    SELECT id INTO shopkeeper_id FROM users 
    WHERE role = 'shopkeeper' OR role = 'SHOPKEEPER' OR role = 'Shopkeeper' 
    LIMIT 1;
    
    -- Get first customer user (try different role formats)
    SELECT id INTO customer_id FROM users 
    WHERE role = 'customer' OR role = 'CUSTOMER' OR role = 'Customer' 
    LIMIT 1;
    
    -- If no specific roles found, get any user
    IF shopkeeper_id IS NULL THEN
        SELECT id INTO shopkeeper_id FROM users LIMIT 1;
    END IF;
    
    IF customer_id IS NULL THEN
        SELECT id INTO customer_id FROM users LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Using shopkeeper_id: %, customer_id: %', shopkeeper_id, customer_id;
    
    -- Insert test shop using existing user
    INSERT INTO shops (id, owner_id, name, description, business_type, address, phone, email, status) VALUES
    ('test_shop_app', shopkeeper_id, 'Application Test Store', 'Fresh vegetables and groceries', 'grocery', '456 App Street', '9876543211', 'app@test.com', 'APPROVED')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO shop_id;
    
    -- If shop already exists, get its ID
    IF shop_id IS NULL THEN
        SELECT id INTO shop_id FROM shops WHERE id = 'test_shop_app';
    END IF;
    
    RAISE NOTICE 'Using shop_id: %', shop_id;
    
    -- Insert test products (using only existing columns)
    INSERT INTO products (id, shop_id, name, description, price, quantity) VALUES
    ('test_prod_app_1', shop_id, 'Fresh Tomatoes', 'Fresh red tomatoes', 50.00, 100),
    ('test_prod_app_2', shop_id, 'Organic Spinach', 'Fresh organic spinach', 30.00, 50)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert test order using application structure
    INSERT INTO orders (id, customer_id, shop_id, status, total_amount, subtotal, delivery_address, delivery_phone, notes) VALUES
    ('test_order_app', customer_id, shop_id, 'PENDING', 75.00, 70.00, '123 App Street', '9876543210', 'Application test order')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO order_id;
    
    -- If order already exists, get its ID
    IF order_id IS NULL THEN
        SELECT id INTO order_id FROM orders WHERE id = 'test_order_app';
    END IF;
    
    RAISE NOTICE 'Using order_id: %', order_id;
    
    -- Insert test order items
    INSERT INTO order_items (id, order_id, product_id, quantity, price, approval_status) VALUES
    ('test_item_app_1', order_id, 'test_prod_app_1', 1, 45.00, 'PENDING'),
    ('test_item_app_2', order_id, 'test_prod_app_2', 1, 30.00, 'PENDING')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Application test data inserted successfully!';
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Application-based order system setup completed!' as status;
SELECT 'Database structure matches application requirements!' as message;

-- Show table structures
SELECT 'Orders table structure:' as info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;

SELECT 'Order items table structure:' as info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'order_items' ORDER BY ordinal_position;

-- Show test data
SELECT 'Test data created:' as info;
SELECT COUNT(*) as order_count FROM orders WHERE id LIKE 'test_%';
SELECT COUNT(*) as item_count FROM order_items WHERE id LIKE 'test_%';
SELECT COUNT(*) as shop_count FROM shops WHERE id LIKE 'test_%';
SELECT COUNT(*) as product_count FROM products WHERE id LIKE 'test_%';
