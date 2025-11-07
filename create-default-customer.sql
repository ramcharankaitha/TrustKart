-- Create Default Customer Account for One-Click Login
-- Run this in Supabase Dashboard > SQL Editor to create the default customer account

-- Insert default customer user if it doesn't exist
INSERT INTO users (id, email, name, role, password_hash, is_active, email_verified, phone_verified) 
VALUES (
    'customer_001', 
    'customer@example.com', 
    'Jane Customer', 
    'CUSTOMER', 
    'hashed_customer123', -- Password: customer123
    true, 
    true,
    true
) ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    email_verified = true,
    phone_verified = true,
    name = 'Jane Customer',
    role = 'CUSTOMER',
    password_hash = 'hashed_customer123';

-- Verify the customer user was created/updated
SELECT id, email, name, role, is_active, email_verified, password_hash
FROM users 
WHERE email = 'customer@example.com';

-- Display success message
SELECT 'Default customer account created successfully!' as status;
