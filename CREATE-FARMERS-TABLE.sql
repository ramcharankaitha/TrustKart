-- Create table for farmers with admin approval system
-- Similar to delivery_agents table structure

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS farmers CASCADE;

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
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
  rating DECIMAL(3, 2) DEFAULT 0,
  total_vegetables_submitted INT DEFAULT 0,
  total_vegetables_approved INT DEFAULT 0,
  rejection_reason TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_farmers_email ON farmers(email);
CREATE INDEX IF NOT EXISTS idx_farmers_status ON farmers(status);
CREATE INDEX IF NOT EXISTS idx_farmers_city ON farmers(city);
CREATE INDEX IF NOT EXISTS idx_farmers_state ON farmers(state);
CREATE INDEX IF NOT EXISTS idx_farmers_created_at ON farmers(created_at DESC);

-- Create farmer_documents table (similar to delivery_agent_documents)
CREATE TABLE IF NOT EXISTS farmer_documents (
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

CREATE INDEX IF NOT EXISTS idx_farmer_documents_farmer_id ON farmer_documents(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_documents_type ON farmer_documents(document_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_farmers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_farmers_updated_at();

-- Add comment to tables
COMMENT ON TABLE farmers IS 'Farmers who can submit organic vegetables. Requires admin approval.';
COMMENT ON TABLE farmer_documents IS 'Documents uploaded by farmers during registration.';

SELECT 'Farmers table created successfully!' as status;

