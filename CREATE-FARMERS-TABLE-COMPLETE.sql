-- =====================================================
-- COMPLETE FARMERS TABLE SETUP
-- This script creates the farmers table and all related structures
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure users table exists (required for foreign key)
-- If users table doesn't exist, create a minimal version
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT 'user_' || substr(md5(random()::text), 1, 8),
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'CUSTOMER',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created users table';
  ELSE
    RAISE NOTICE 'Users table already exists';
  END IF;
END $$;

-- Step 2: Drop existing farmers table if exists (CASCADE to remove dependencies)
DROP TABLE IF EXISTS farmer_documents CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;

-- Step 3: Create farmers table with all required fields
CREATE TABLE farmers (
  id TEXT PRIMARY KEY DEFAULT 'farmer_' || substr(md5(random()::text), 1, 8),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT NOT NULL,
  aadhaar_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  farm_name TEXT,
  farm_address TEXT,
  farm_size TEXT, -- e.g., "5 acres", "2 hectares"
  crops_grown TEXT[], -- Array of crops
  organic_certification TEXT, -- Certification details
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  is_active BOOLEAN DEFAULT false, -- Active only when approved
  rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_vegetables_submitted INT DEFAULT 0,
  total_vegetables_approved INT DEFAULT 0,
  rejection_reason TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_farmers_email ON farmers(email);
CREATE INDEX IF NOT EXISTS idx_farmers_status ON farmers(status);
CREATE INDEX IF NOT EXISTS idx_farmers_city ON farmers(city);
CREATE INDEX IF NOT EXISTS idx_farmers_state ON farmers(state);
CREATE INDEX IF NOT EXISTS idx_farmers_created_at ON farmers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_farmers_is_active ON farmers(is_active);
CREATE INDEX IF NOT EXISTS idx_farmers_reviewed_by ON farmers(reviewed_by);

-- Step 5: Create farmer_documents table for storing farmer documents
CREATE TABLE farmer_documents (
  id TEXT PRIMARY KEY DEFAULT 'doc_' || substr(md5(random()::text), 1, 8),
  farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'aadhaar_card', 'pan_card', 'farm_license', 'organic_certificate', 'profile_photo'
  document_name TEXT NOT NULL,
  document_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  is_verified BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Step 6: Create indexes for farmer_documents
CREATE INDEX IF NOT EXISTS idx_farmer_documents_farmer_id ON farmer_documents(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_documents_type ON farmer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_farmer_documents_is_verified ON farmer_documents(is_verified);

-- Step 7: Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_farmers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for farmers table
DROP TRIGGER IF EXISTS trigger_update_farmers_updated_at ON farmers;
CREATE TRIGGER trigger_update_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_farmers_updated_at();

-- Step 9: Add table comments for documentation
COMMENT ON TABLE farmers IS 'Farmers who can submit organic vegetables. Requires admin approval before they can submit vegetables.';
COMMENT ON TABLE farmer_documents IS 'Documents uploaded by farmers during registration (Aadhaar, PAN, farm license, organic certificate, etc.).';

COMMENT ON COLUMN farmers.status IS 'PENDING: Awaiting admin approval, APPROVED: Can submit vegetables, REJECTED: Registration rejected, SUSPENDED: Temporarily suspended';
COMMENT ON COLUMN farmers.is_active IS 'True only when status is APPROVED. Controls whether farmer can login and submit vegetables.';
COMMENT ON COLUMN farmers.rating IS 'Average rating from customers (0-5 scale)';
COMMENT ON COLUMN farmers.crops_grown IS 'Array of crop names the farmer grows';

-- Step 10: Enable Row Level Security (RLS) - Optional, adjust based on your needs
-- ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE farmer_documents ENABLE ROW LEVEL SECURITY;

-- Step 11: Grant necessary permissions (Supabase handles this automatically, but included for completeness)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON farmers TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON farmer_documents TO authenticated;

-- Step 12: Verify table creation
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'farmers') THEN
    RAISE NOTICE '✅ Farmers table created successfully!';
  ELSE
    RAISE EXCEPTION '❌ Failed to create farmers table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'farmer_documents') THEN
    RAISE NOTICE '✅ Farmer documents table created successfully!';
  ELSE
    RAISE EXCEPTION '❌ Failed to create farmer_documents table';
  END IF;
END $$;

-- Step 13: Return success message
SELECT 
  '✅ Farmers table setup completed successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'farmers') as farmers_table_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'farmer_documents') as farmer_documents_table_exists;

