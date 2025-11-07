-- SAFE DATABASE SETUP FOR ORDERS
-- This script checks existing columns before inserting data

-- ==============================================
-- 1. CREATE ORDERS TABLE IF IT DOESN'T EXIST
-- ==============================================
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT 'order_' || substr(md5(random()::text), 1, 8),
    customer_id TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_APPROVAL',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_address TEXT,
    delivery_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE ORDER_ITEMS TABLE IF IT DOESN'T EXIST
-- ==============================================
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT 'item_' || substr(md5(random()::text), 1, 8),
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. ADD ESSENTIAL COLUMNS TO ORDERS TABLE
-- ==============================================
DO $$ 
BEGIN
    -- Add approval_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'approval_status') THEN
        ALTER TABLE orders ADD COLUMN approval_status TEXT DEFAULT 'PENDING';
    END IF;
    
    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'rejection_reason') THEN
        ALTER TABLE orders ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Add order_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') THEN
        ALTER TABLE orders ADD COLUMN order_number TEXT DEFAULT 'ORD-' || substr(md5(random()::text), 1, 8);
    END IF;
END $$;

-- ==============================================
-- 4. ADD ESSENTIAL COLUMNS TO ORDER_ITEMS TABLE
-- ==============================================
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
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'updated_at') THEN
        ALTER TABLE order_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ==============================================
-- 5. CREATE BASIC INDEXES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ==============================================
-- 6. SAFE SAMPLE DATA INSERTION
-- ==============================================

-- Check what columns exist in users table and insert accordingly
DO $$ 
DECLARE
    has_city BOOLEAN;
    has_state BOOLEAN;
    has_pincode BOOLEAN;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'city'
    ) INTO has_city;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'state'
    ) INTO has_state;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'pincode'
    ) INTO has_pincode;
    
    -- Insert sample users with only existing columns
    IF has_city AND has_state AND has_pincode THEN
        INSERT INTO users (id, email, name, password_hash, role, phone, address, city, state, pincode) VALUES
        ('user_customer_1', 'customer@example.com', 'John Customer', '$2b$10$example_hash', 'customer', '9876543210', '123 Main St', 'Mumbai', 'Maharashtra', '400001'),
        ('user_shopkeeper_1', 'shopkeeper@example.com', 'Jane Shopkeeper', '$2b$10$example_hash', 'shopkeeper', '9876543211', '456 Shop St', 'Mumbai', 'Maharashtra', '400002')
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO users (id, email, name, password_hash, role, phone, address) VALUES
        ('user_customer_1', 'customer@example.com', 'John Customer', '$2b$10$example_hash', 'customer', '9876543210', '123 Main St'),
        ('user_shopkeeper_1', 'shopkeeper@example.com', 'Jane Shopkeeper', '$2b$10$example_hash', 'shopkeeper', '9876543211', '456 Shop St')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Insert sample shop if it doesn't exist
INSERT INTO shops (id, owner_id, name, description, business_type, address, phone, email, status) VALUES
('shop_1', 'user_shopkeeper_1', 'Fresh Grocery Store', 'Fresh vegetables and groceries', 'grocery', '456 Shop St', '9876543211', 'shop@example.com', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products if they don't exist
INSERT INTO products (id, shop_id, name, description, price, final_price, stock_quantity) VALUES
('prod_1', 'shop_1', 'Fresh Tomatoes', 'Fresh red tomatoes', 50.00, 45.00, 100),
('prod_2', 'shop_1', 'Organic Spinach', 'Fresh organic spinach', 30.00, 30.00, 50)
ON CONFLICT (id) DO NOTHING;

-- Insert sample order if it doesn't exist
INSERT INTO orders (id, customer_id, shop_id, status, total_amount, subtotal, delivery_address, delivery_phone, notes) VALUES
('order_1', 'user_customer_1', 'shop_1', 'PENDING_APPROVAL', 75.00, 70.00, '123 Main St', '9876543210', 'Please deliver fresh vegetables')
ON CONFLICT (id) DO NOTHING;

-- Insert sample order items if they don't exist
INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
('item_1', 'order_1', 'prod_1', 1, 45.00),
('item_2', 'order_1', 'prod_2', 1, 30.00)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Safe database setup completed!' as status;
SELECT 'Orders and order_items tables are ready!' as message;

-- Show table structures
SELECT 'Users table structure:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name;

SELECT 'Orders table structure:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY column_name;

SELECT 'Order_items table structure:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items' ORDER BY column_name;
