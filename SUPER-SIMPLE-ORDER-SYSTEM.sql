-- SUPER SIMPLE ORDER SYSTEM
-- This script just creates the order system without complex checks

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
-- 4. INSERT TEST DATA (SKIP USERS FOR NOW)
-- ==============================================

-- Insert test shop (using existing user ID)
INSERT INTO shops (id, owner_id, name, description, business_type, address, phone, email, status) VALUES
('test_shop_1', 'user_shopkeeper_1', 'Test Grocery Store', 'Fresh vegetables and groceries', 'grocery', '456 Shop Street', '9876543211', 'shop@test.com', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

-- Insert test products
INSERT INTO products (id, shop_id, name, description, price, final_price, stock_quantity) VALUES
('test_prod_1', 'test_shop_1', 'Fresh Tomatoes', 'Fresh red tomatoes', 50.00, 45.00, 100),
('test_prod_2', 'test_shop_1', 'Organic Spinach', 'Fresh organic spinach', 30.00, 30.00, 50)
ON CONFLICT (id) DO NOTHING;

-- Insert test order (using existing user ID)
INSERT INTO orders (id, customer_id, shop_id, status, total_amount, subtotal, delivery_address, delivery_phone, notes) VALUES
('test_order_1', 'user_customer_1', 'test_shop_1', 'PENDING_APPROVAL', 75.00, 70.00, '123 Test Street', '9876543210', 'Please deliver fresh vegetables')
ON CONFLICT (id) DO NOTHING;

-- Insert test order items
INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
('test_item_1', 'test_order_1', 'test_prod_1', 1, 45.00),
('test_item_2', 'test_order_1', 'test_prod_2', 1, 30.00)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Super simple order system setup completed!' as status;
SELECT 'Orders and order_items tables created!' as message;

-- Show what was created
SELECT 'Orders table:' as info;
SELECT COUNT(*) as order_count FROM orders;

SELECT 'Order items table:' as info;
SELECT COUNT(*) as item_count FROM order_items;

SELECT 'Test shops:' as info;
SELECT COUNT(*) as shop_count FROM shops WHERE id LIKE 'test_%';

SELECT 'Test products:' as info;
SELECT COUNT(*) as product_count FROM products WHERE id LIKE 'test_%';

