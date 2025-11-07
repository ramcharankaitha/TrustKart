-- MIGRATION SCRIPT: Add missing columns to existing delivery_agents table
-- Run this script to fix the "column delivery_agents.rejection_reason does not exist" error

-- ==============================================
-- 1. ADD MISSING COLUMNS TO DELIVERY_AGENTS TABLE
-- ==============================================

-- Add rejection_reason column
ALTER TABLE delivery_agents 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add reviewed_by column  
ALTER TABLE delivery_agents 
ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- Add reviewed_at column
ALTER TABLE delivery_agents 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- ==============================================
-- 2. CREATE DELIVERY_AGENT_DOCUMENTS TABLE (if not exists)
-- ==============================================
CREATE TABLE IF NOT EXISTS delivery_agent_documents (
    id TEXT PRIMARY KEY DEFAULT 'doc_' || substr(md5(random()::text), 1, 8),
    delivery_agent_id TEXT NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('driving_license', 'aadhaar_card', 'vehicle_rc', 'pan_card', 'profile_photo')),
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT
);

-- ==============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_agent_id ON delivery_agent_documents(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_type ON delivery_agent_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_delivery_agent_documents_verified ON delivery_agent_documents(is_verified);

-- ==============================================
-- 4. VERIFICATION QUERIES
-- ==============================================
SELECT 'Migration completed successfully!' as status;

-- Show updated table structure
SELECT 'Updated delivery_agents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'delivery_agents' 
ORDER BY ordinal_position;

-- Show new documents table structure
SELECT 'New delivery_agent_documents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'delivery_agent_documents' 
ORDER BY ordinal_position;

-- Show current delivery agents count
SELECT 'Current delivery agents count:' as info, COUNT(*) as count FROM delivery_agents;
