-- SIMPLE WORKING ORDER SYSTEM
-- This script creates the order system with correct role values

-- ==============================================
-- 1. CREATE ORDERS TABLE
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
    approval_status TEXT DEFAULT 'PENDING',
    rejection_reason TEXT,
    order_number TEXT DEFAULT 'ORD-' || substr(md5(random()::text), 1, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE ORDER_ITEMS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT 'item_' || substr(md5(random()::text), 1, 8),
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    approval_status TEXT DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. CREATE INDEXES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ==============================================
-- 4. CHECK WHAT ROLE VALUES ARE ALLOWED
-- ==============================================
SELECT 'Checking allowed role values:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname LIKE '%role%';

-- ==============================================
-- 5. INSERT TEST DATA WITH CORRECT ROLES
-- ==============================================

-- Try different role values to see which ones work
DO $$ 
BEGIN
    -- Try with uppercase roles first
    BEGIN
        INSERT INTO users (id, email, name, password_hash, role, phone, address) VALUES
        ('test_customer_1', 'customer@test.com', 'Test Customer', '$2b$10$test_hash', 'CUSTOMER', '9876543210', '123 Test Street'),
        ('test_shopkeeper_1', 'shopkeeper@test.com', 'Test Shopkeeper', '$2b$10$test_hash', 'SHOPKEEPER', '9876543211', '456 Shop Street')
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Users inserted with CUSTOMER/SHOPKEEPER roles';
    EXCEPTION WHEN check_violation THEN
        -- Try with lowercase roles
        BEGIN
            INSERT INTO users (id, email, name, password_hash, role, phone, address) VALUES
            ('test_customer_1', 'customer@test.com', 'Test Customer', '$2b$10$test_hash', 'customer', '9876543210', '123 Test Street'),
            ('test_shopkeeper_1', 'shopkeeper@test.com', 'Test Shopkeeper', '$2b$10$test_hash', 'shopkeeper', '9876543211', '456 Shop Street')
            ON CONFLICT (id) DO NOTHING;
            RAISE NOTICE 'Users inserted with customer/shopkeeper roles';
        EXCEPTION WHEN check_violation THEN
            -- Try with different role names
            BEGIN
                INSERT INTO users (id, email, name, password_hash, role, phone, address) VALUES
                ('test_customer_1', 'customer@test.com', 'Test Customer', '$2b$10$test_hash', 'user', '9876543210', '123 Test Street'),
                ('test_shopkeeper_1', 'shopkeeper@test.com', 'Test Shopkeeper', '$2b$10$test_hash', 'admin', '9876543211', '456 Shop Street')
                ON CONFLICT (id) DO NOTHING;
                RAISE NOTICE 'Users inserted with user/admin roles';
            EXCEPTION WHEN check_violation THEN
                RAISE NOTICE 'Could not insert users - check constraint violation. Please check allowed role values.';
            END;
        END;
    END;
END $$;

-- Insert test shop
INSERT INTO shops (id, owner_id, name, description, business_type, address, phone, email, status) VALUES
('test_shop_1', 'test_shopkeeper_1', 'Test Grocery Store', 'Fresh vegetables and groceries', 'grocery', '456 Shop Street', '9876543211', 'shop@test.com', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

-- Insert test products
INSERT INTO products (id, shop_id, name, description, price, final_price, stock_quantity) VALUES
('test_prod_1', 'test_shop_1', 'Fresh Tomatoes', 'Fresh red tomatoes', 50.00, 45.00, 100),
('test_prod_2', 'test_shop_1', 'Organic Spinach', 'Fresh organic spinach', 30.00, 30.00, 50)
ON CONFLICT (id) DO NOTHING;

-- Insert test order
INSERT INTO orders (id, customer_id, shop_id, status, total_amount, subtotal, delivery_address, delivery_phone, notes) VALUES
('test_order_1', 'test_customer_1', 'test_shop_1', 'PENDING_APPROVAL', 75.00, 70.00, '123 Test Street', '9876543210', 'Please deliver fresh vegetables')
ON CONFLICT (id) DO NOTHING;

-- Insert test order items
INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
('test_item_1', 'test_order_1', 'test_prod_1', 1, 45.00),
('test_item_2', 'test_order_1', 'test_prod_2', 1, 30.00)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Order system setup completed!' as status;
SELECT 'Test data inserted!' as message;

-- Show what was created
SELECT 'Orders table:' as info;
SELECT COUNT(*) as order_count FROM orders;

SELECT 'Order items table:' as info;
SELECT COUNT(*) as item_count FROM order_items;

SELECT 'Test users:' as info;
SELECT COUNT(*) as user_count FROM users WHERE id LIKE 'test_%';

SELECT 'Test shops:' as info;
SELECT COUNT(*) as shop_count FROM shops WHERE id LIKE 'test_%';
