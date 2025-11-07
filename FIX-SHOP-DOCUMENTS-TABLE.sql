-- Fix shop_documents table - Add missing columns if they don't exist
-- This script safely adds missing columns to the shop_documents table

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS shop_documents (
  id TEXT PRIMARY KEY DEFAULT 'doc_' || substr(md5(random()::text), 1, 8),
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('business_license', 'gst_certificate', 'pan_card', 'aadhar_card', 'shop_photo', 'other')),
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add is_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE shop_documents ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_verified column to shop_documents table';
    ELSE
        RAISE NOTICE 'is_verified column already exists';
    END IF;

    -- Add verification_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' AND column_name = 'verification_notes'
    ) THEN
        ALTER TABLE shop_documents ADD COLUMN verification_notes TEXT;
        RAISE NOTICE 'Added verification_notes column to shop_documents table';
    ELSE
        RAISE NOTICE 'verification_notes column already exists';
    END IF;

    -- Add verified_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' AND column_name = 'verified_by'
    ) THEN
        ALTER TABLE shop_documents ADD COLUMN verified_by TEXT REFERENCES users(id);
        RAISE NOTICE 'Added verified_by column to shop_documents table';
    ELSE
        RAISE NOTICE 'verified_by column already exists';
    END IF;

    -- Add verified_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE shop_documents ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added verified_at column to shop_documents table';
    ELSE
        RAISE NOTICE 'verified_at column already exists';
    END IF;
END $$;

-- Create indexes for better query performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_shop_documents_shop_id ON shop_documents(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_documents_type ON shop_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_shop_documents_verified ON shop_documents(is_verified);
CREATE INDEX IF NOT EXISTS idx_shop_documents_uploaded_at ON shop_documents(uploaded_at DESC);

-- Add comments for documentation
COMMENT ON TABLE shop_documents IS 'Stores documents uploaded by shopkeepers during registration';
COMMENT ON COLUMN shop_documents.document_type IS 'Type of document: business_license, gst_certificate, pan_card, aadhar_card, shop_photo, other';
COMMENT ON COLUMN shop_documents.document_url IS 'URL, base64 data, or storage path to the document';
COMMENT ON COLUMN shop_documents.is_verified IS 'Whether the document has been verified by an admin';
COMMENT ON COLUMN shop_documents.verification_notes IS 'Admin notes about document verification';

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'shop_documents'
ORDER BY ordinal_position;

