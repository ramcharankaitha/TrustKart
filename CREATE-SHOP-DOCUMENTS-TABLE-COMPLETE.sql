-- Complete Shop Documents Table Setup
-- This script creates the table with all required columns or adds missing columns
-- Safe to run multiple times - it checks for existence before adding columns

-- ==============================================
-- STEP 1: Create table with basic structure (if it doesn't exist)
-- ==============================================
CREATE TABLE IF NOT EXISTS shop_documents (
  id TEXT PRIMARY KEY DEFAULT 'doc_' || substr(md5(random()::text), 1, 8),
  shop_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- STEP 2: Add foreign key constraint (if it doesn't exist)
-- ==============================================
DO $$ 
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'shop_documents' 
        AND constraint_name = 'shop_documents_shop_id_fkey'
    ) THEN
        ALTER TABLE shop_documents 
        ADD CONSTRAINT shop_documents_shop_id_fkey 
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint shop_documents_shop_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint shop_documents_shop_id_fkey already exists';
    END IF;
END $$;

-- ==============================================
-- STEP 3: Add check constraint for document_type (if it doesn't exist)
-- ==============================================
DO $$ 
BEGIN
    -- Drop existing constraint if it exists (to avoid conflicts)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'shop_documents' 
        AND constraint_name = 'shop_documents_document_type_check'
    ) THEN
        ALTER TABLE shop_documents 
        DROP CONSTRAINT shop_documents_document_type_check;
    END IF;
    
    -- Add check constraint
    ALTER TABLE shop_documents 
    ADD CONSTRAINT shop_documents_document_type_check 
    CHECK (document_type IN ('business_license', 'gst_certificate', 'pan_card', 'aadhar_card', 'shop_photo', 'other'));
    
    RAISE NOTICE 'Added check constraint for document_type';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Check constraint already exists';
END $$;

-- ==============================================
-- STEP 4: Add all missing columns
-- ==============================================
DO $$ 
BEGIN
    -- Add document_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' AND column_name = 'document_url'
    ) THEN
        ALTER TABLE shop_documents ADD COLUMN document_url TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added document_url column to shop_documents table';
    ELSE
        RAISE NOTICE 'document_url column already exists';
    END IF;

    -- Add file_size column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' AND column_name = 'file_size'
    ) THEN
        ALTER TABLE shop_documents ADD COLUMN file_size INTEGER;
        RAISE NOTICE 'Added file_size column to shop_documents table';
    ELSE
        RAISE NOTICE 'file_size column already exists';
    END IF;

    -- Add file_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' AND column_name = 'file_type'
    ) THEN
        ALTER TABLE shop_documents ADD COLUMN file_type TEXT;
        RAISE NOTICE 'Added file_type column to shop_documents table';
    ELSE
        RAISE NOTICE 'file_type column already exists';
    END IF;

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
        ALTER TABLE shop_documents ADD COLUMN verified_by TEXT;
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

    -- Update document_url to allow NULL if it was created with NOT NULL and default
    -- This allows existing rows to work
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_documents' 
        AND column_name = 'document_url' 
        AND is_nullable = 'NO'
        AND column_default = ''
    ) THEN
        ALTER TABLE shop_documents ALTER COLUMN document_url DROP DEFAULT;
        ALTER TABLE shop_documents ALTER COLUMN document_url DROP NOT NULL;
        RAISE NOTICE 'Updated document_url to allow NULL';
    END IF;
END $$;

-- ==============================================
-- STEP 5: Add foreign key for verified_by (if users table exists)
-- ==============================================
DO $$ 
BEGIN
    -- Check if users table exists and add foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
    ) THEN
        -- Check if foreign key constraint for verified_by exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'shop_documents' 
            AND constraint_name = 'shop_documents_verified_by_fkey'
        ) THEN
            ALTER TABLE shop_documents 
            ADD CONSTRAINT shop_documents_verified_by_fkey 
            FOREIGN KEY (verified_by) REFERENCES users(id);
            RAISE NOTICE 'Added foreign key constraint for verified_by';
        ELSE
            RAISE NOTICE 'Foreign key constraint for verified_by already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping verified_by foreign key';
    END IF;
END $$;

-- ==============================================
-- STEP 6: Create indexes for better query performance
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_shop_documents_shop_id ON shop_documents(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_documents_type ON shop_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_shop_documents_verified ON shop_documents(is_verified);
CREATE INDEX IF NOT EXISTS idx_shop_documents_uploaded_at ON shop_documents(uploaded_at DESC);

-- ==============================================
-- STEP 7: Add comments for documentation
-- ==============================================
COMMENT ON TABLE shop_documents IS 'Stores documents uploaded by shopkeepers during registration';
COMMENT ON COLUMN shop_documents.document_type IS 'Type of document: business_license, gst_certificate, pan_card, aadhar_card, shop_photo, other';
COMMENT ON COLUMN shop_documents.document_url IS 'URL, base64 data, or storage path to the document';
COMMENT ON COLUMN shop_documents.is_verified IS 'Whether the document has been verified by an admin';
COMMENT ON COLUMN shop_documents.verification_notes IS 'Admin notes about document verification';

-- ==============================================
-- STEP 8: Verify the table structure
-- ==============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'shop_documents'
ORDER BY ordinal_position;

-- ==============================================
-- STEP 9: Show table summary
-- ==============================================
SELECT 
    'shop_documents' as table_name,
    COUNT(*) as total_documents,
    COUNT(DISTINCT shop_id) as shops_with_documents,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_documents,
    COUNT(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 END) as pending_documents
FROM shop_documents;

