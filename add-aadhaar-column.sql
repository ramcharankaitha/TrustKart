
-- Add Aadhaar Number Column to Users Table
-- This script adds the aadhaar_number column to the users table

-- Check if users table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'users';

-- Check current columns in users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Add aadhaar_number column if it doesn't exist
DO $$
BEGIN
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

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'aadhaar_number';

-- Update existing user with sample Aadhaar number (replace with actual)
UPDATE users 
SET aadhaar_number = '123456789012'  -- Replace with actual Aadhaar number
WHERE email = '99830040588@klu.ac.in'
AND role = 'SHOPKEEPER';

-- Verify the update
SELECT 
    id,
    email,
    name,
    phone,
    aadhaar_number,
    created_at
FROM users 
WHERE email = '99830040588@klu.ac.in'
AND role = 'SHOPKEEPER';
