-- Fix Database Schema - Add Missing Columns
-- This script adds the missing password, phone, and aadhaar_number columns to the users table

-- Check if users table exists and show current structure
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'users';

-- Show current columns in users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add password column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
        RAISE NOTICE 'Added password column to users table';
    ELSE
        RAISE NOTICE 'password column already exists';
    END IF;

    -- Add phone column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column to users table';
    ELSE
        RAISE NOTICE 'phone column already exists';
    END IF;

    -- Add aadhaar_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'aadhaar_number'
    ) THEN
        ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR(12);
        RAISE NOTICE 'Added aadhaar_number column to users table';
    ELSE
        RAISE NOTICE 'aadhaar_number column already exists';
    END IF;
END $$;

-- Verify all columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Test insert with all fields
INSERT INTO users (email, name, role, password, phone, aadhaar_number, created_at, updated_at)
VALUES (
    'test@example.com',
    'Test User',
    'CUSTOMER',
    'testpassword',
    '9876543210',
    '123456789012',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verify the test insert worked
SELECT 
    id,
    email,
    name,
    role,
    password,
    phone,
    aadhaar_number,
    created_at
FROM users 
WHERE email = 'test@example.com';

