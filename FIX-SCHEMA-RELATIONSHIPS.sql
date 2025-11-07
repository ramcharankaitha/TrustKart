-- ==============================================
-- FIX SCHEMA RELATIONSHIPS FOR SUPABASE
-- This script ensures all foreign key relationships are properly set up
-- Run this AFTER running COMPLETE-DELIVERY-AGENT-SETUP.sql
-- ==============================================

-- ==============================================
-- 1. ADD FOREIGN KEY: orders.customer_id -> users.id
-- ==============================================
DO $$ 
BEGIN
    -- Drop existing constraint if it exists with wrong name
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_customer_id;
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
    
    -- Add foreign key constraint
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'customer_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_customer_id 
        FOREIGN KEY (customer_id) 
        REFERENCES users(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        RAISE NOTICE '✅ Added foreign key: orders.customer_id -> users.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key orders.customer_id -> users.id already exists';
    END IF;
END $$;

-- ==============================================
-- 2. ADD FOREIGN KEY: orders.shop_id -> shops.id
-- ==============================================
DO $$ 
BEGIN
    -- Drop existing constraint if it exists with wrong name
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_shop_id;
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shop_id_fkey;
    
    -- Add foreign key constraint
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'shop_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_shop_id 
        FOREIGN KEY (shop_id) 
        REFERENCES shops(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
        RAISE NOTICE '✅ Added foreign key: orders.shop_id -> shops.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key orders.shop_id -> shops.id already exists';
    END IF;
END $$;

-- ==============================================
-- 3. VERIFY FOREIGN KEYS EXIST
-- ==============================================
SELECT '✅ Foreign Key Relationships Verification' as status;

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
ORDER BY kcu.column_name;

-- ==============================================
-- 4. IMPORTANT: REFRESH SUPABASE SCHEMA CACHE
-- ==============================================
-- After running this script, you may need to:
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Click "Reload schema" or wait a few minutes for auto-refresh
-- 3. The relationships should now work in nested selects

SELECT '⚠️ IMPORTANT: Refresh Supabase schema cache in Dashboard > Settings > API' as reminder;

