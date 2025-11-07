-- FIX ORDERS-USERS RELATIONSHIP
-- This script adds proper foreign key relationships between orders and users/shops
-- This is required for Supabase to properly join tables in queries

-- ==============================================
-- 1. ADD FOREIGN KEY CONSTRAINT: orders.customer_id -> users.id
-- ==============================================
DO $$ 
BEGIN
    -- Check if foreign key already exists
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
        -- Add foreign key constraint
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_customer_id 
        FOREIGN KEY (customer_id) 
        REFERENCES users(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: orders.customer_id -> users.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint orders.customer_id -> users.id already exists';
    END IF;
END $$;

-- ==============================================
-- 2. ADD FOREIGN KEY CONSTRAINT: orders.shop_id -> shops.id
-- ==============================================
DO $$ 
BEGIN
    -- Check if foreign key already exists
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
        -- Add foreign key constraint
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_shop_id 
        FOREIGN KEY (shop_id) 
        REFERENCES shops(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: orders.shop_id -> shops.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint orders.shop_id -> shops.id already exists';
    END IF;
END $$;

-- ==============================================
-- 3. ADD FOREIGN KEY CONSTRAINT: order_items.order_id -> orders.id
-- ==============================================
DO $$ 
BEGIN
    -- Check if foreign key already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'order_items' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'order_id'
            AND kcu.table_name = 'order_items'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE order_items 
        ADD CONSTRAINT fk_order_items_order_id 
        FOREIGN KEY (order_id) 
        REFERENCES orders(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: order_items.order_id -> orders.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint order_items.order_id -> orders.id already exists';
    END IF;
END $$;

-- ==============================================
-- 4. ADD FOREIGN KEY CONSTRAINT: order_items.product_id -> products.id
-- ==============================================
DO $$ 
BEGIN
    -- Check if foreign key already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'order_items' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'product_id'
            AND kcu.table_name = 'order_items'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE order_items 
        ADD CONSTRAINT fk_order_items_product_id 
        FOREIGN KEY (product_id) 
        REFERENCES products(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: order_items.product_id -> products.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint order_items.product_id -> products.id already exists';
    END IF;
END $$;

-- ==============================================
-- 5. ADD FOREIGN KEY CONSTRAINT: deliveries.order_id -> orders.id
-- ==============================================
DO $$ 
BEGIN
    -- Check if foreign key already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'deliveries' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'order_id'
            AND kcu.table_name = 'deliveries'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE deliveries 
        ADD CONSTRAINT fk_deliveries_order_id 
        FOREIGN KEY (order_id) 
        REFERENCES orders(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: deliveries.order_id -> orders.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint deliveries.order_id -> orders.id already exists';
    END IF;
END $$;

-- ==============================================
-- 6. ADD FOREIGN KEY CONSTRAINT: deliveries.delivery_agent_id -> delivery_agents.id
-- ==============================================
DO $$ 
BEGIN
    -- Check if foreign key already exists
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
        -- Add foreign key constraint (nullable since delivery_agent_id can be null)
        ALTER TABLE deliveries 
        ADD CONSTRAINT fk_deliveries_delivery_agent_id 
        FOREIGN KEY (delivery_agent_id) 
        REFERENCES delivery_agents(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: deliveries.delivery_agent_id -> delivery_agents.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint deliveries.delivery_agent_id -> delivery_agents.id already exists';
    END IF;
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Foreign key relationships added successfully!' as status;

-- Show all foreign key constraints on orders table
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'orders'
ORDER BY tc.constraint_name;

-- Show all foreign key constraints on deliveries table
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'deliveries'
ORDER BY tc.constraint_name;

