-- ADD ORDER CANCELLATION SUPPORT
-- This script adds cancellation_reason field to orders table

-- ==============================================
-- 1. ADD CANCELLATION_REASON COLUMN
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
        RAISE NOTICE 'Added cancellation_reason column to orders table';
    ELSE
        RAISE NOTICE 'cancellation_reason column already exists';
    END IF;
END $$;

-- ==============================================
-- 2. ADD CANCELLED_BY COLUMN (Optional - track who cancelled)
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancelled_by TEXT;
        RAISE NOTICE 'Added cancelled_by column to orders table';
    ELSE
        RAISE NOTICE 'cancelled_by column already exists';
    END IF;
END $$;

-- ==============================================
-- 3. ADD CANCELLED_AT COLUMN (Optional - track when cancelled)
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added cancelled_at column to orders table';
    ELSE
        RAISE NOTICE 'cancelled_at column already exists';
    END IF;
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Order cancellation fields added successfully!' as status;
SELECT 'Orders can now be cancelled with reasons!' as message;

-- Show table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('cancellation_reason', 'cancelled_by', 'cancelled_at')
ORDER BY ordinal_position;

