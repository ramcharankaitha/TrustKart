-- WORKING ORDER SYSTEM WITH EXISTING DATA
-- This script creates the order system using existing users

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
-- 4. CHECK EXISTING USERS AND SHOPS
-- ==============================================
SELECT 'Existing users:' as info;
SELECT id, email, name, role FROM users LIMIT 5;

SELECT 'Existing shops:' as info;
SELECT id, owner_id, name, status FROM shops LIMIT 5;

-- ==============================================
-- 5. INSERT TEST DATA USING EXISTING USERS
-- ==============================================

-- Get the first shopkeeper user ID
DO $$ 
DECLARE
    shopkeeper_id TEXT;
    customer_id TEXT;
    shop_id TEXT;
BEGIN
    -- Get first shopkeeper user
    SELECT id INTO shopkeeper_id FROM users WHERE role = 'shopkeeper' OR role = 'SHOPKEEPER' LIMIT 1;
    
    -- Get first customer user
    SELECT id INTO customer_id FROM users WHERE role = 'customer' OR role = 'CUSTOMER' LIMIT 1;
    
    -- If no shopkeeper found, get any user
    IF shopkeeper_id IS NULL THEN
        SELECT id INTO shopkeeper_id FROM users LIMIT 1;
    END IF;
    
    -- If no customer found, get any user
    IF customer_id IS NULL THEN
        SELECT id INTO customer_id FROM users LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Using shopkeeper_id: %, customer_id: %', shopkeeper_id, customer_id;
    
    -- Insert test shop using existing user
    INSERT INTO shops (id, owner_id, name, description, business_type, address, phone, email, status) VALUES
    ('test_shop_1', shopkeeper_id, 'Test Grocery Store', 'Fresh vegetables and groceries', 'grocery', '456 Shop Street', '9876543211', 'shop@test.com', 'APPROVED')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO shop_id;
    
    -- If shop already exists, get its ID
    IF shop_id IS NULL THEN
        SELECT id INTO shop_id FROM shops WHERE id = 'test_shop_1';
    END IF;
    
    RAISE NOTICE 'Using shop_id: %', shop_id;
    
    -- Insert test products
    INSERT INTO products (id, shop_id, name, description, price, final_price, stock_quantity) VALUES
    ('test_prod_1', shop_id, 'Fresh Tomatoes', 'Fresh red tomatoes', 50.00, 45.00, 100),
    ('test_prod_2', shop_id, 'Organic Spinach', 'Fresh organic spinach', 30.00, 30.00, 50)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert test order using existing users
    INSERT INTO orders (id, customer_id, shop_id, status, total_amount, subtotal, delivery_address, delivery_phone, notes) VALUES
    ('test_order_1', customer_id, shop_id, 'PENDING_APPROVAL', 75.00, 70.00, '123 Test Street', '9876543210', 'Please deliver fresh vegetables')
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert test order items
    INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
    ('test_item_1', 'test_order_1', 'test_prod_1', 1, 45.00),
    ('test_item_2', 'test_order_1', 'test_prod_2', 1, 30.00)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test data inserted successfully!';
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Order system setup completed!' as status;
SELECT 'Test data inserted using existing users!' as message;

-- Show what was created
SELECT 'Orders table:' as info;
SELECT COUNT(*) as order_count FROM orders;

SELECT 'Order items table:' as info;
SELECT COUNT(*) as item_count FROM order_items;

SELECT 'Test shops:' as info;
SELECT COUNT(*) as shop_count FROM shops WHERE id LIKE 'test_%';

SELECT 'Test products:' as info;
SELECT COUNT(*) as product_count FROM products WHERE id LIKE 'test_%';

