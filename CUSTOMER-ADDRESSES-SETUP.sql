-- CUSTOMER ADDRESSES SETUP
-- This script creates a table for managing multiple customer addresses
-- Customers can add, edit, delete addresses and set a default address

-- ==============================================
-- 1. CREATE CUSTOMER_ADDRESSES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY DEFAULT 'addr_' || substr(md5(random()::text), 1, 8),
    customer_id TEXT NOT NULL,
    label TEXT, -- Home, Work, Office, etc.
    full_name TEXT,
    phone TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_customer_addresses_user 
        FOREIGN KEY (customer_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- ==============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_location ON customer_addresses(latitude, longitude);

-- ==============================================
-- 3. CREATE FUNCTION TO ENSURE ONLY ONE DEFAULT ADDRESS
-- ==============================================
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If this address is being set as default, unset all other defaults for this customer
    IF NEW.is_default = TRUE THEN
        UPDATE customer_addresses
        SET is_default = FALSE
        WHERE customer_id = NEW.customer_id
          AND id != NEW.id
          AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically handle default address
CREATE TRIGGER trigger_ensure_single_default_address
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();

-- ==============================================
-- 4. ADD LOCATION COLUMNS IF THEY DON'T EXIST
-- ==============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_addresses' AND column_name = 'latitude') THEN
        ALTER TABLE customer_addresses ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_addresses' AND column_name = 'longitude') THEN
        ALTER TABLE customer_addresses ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT 'Customer addresses table created successfully!' as status;
SELECT 'You can now add multiple addresses per customer with default address support!' as message;

-- Show table structure
SELECT 'Customer_addresses table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customer_addresses' 
ORDER BY ordinal_position;

