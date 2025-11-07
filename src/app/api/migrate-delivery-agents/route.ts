import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// POST /api/migrate-delivery-agents - Run migration to add missing columns
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting delivery agent database migration...');
    const supabase = getSupabaseClient();
    
    const results = [];
    
    // Try to add rejection_reason column
    try {
      const { data, error } = await supabase
        .from('delivery_agents')
        .select('rejection_reason')
        .limit(1);
      
      if (error && error.message.includes('column "rejection_reason" does not exist')) {
        // Column doesn't exist, we need to add it
        console.log('Adding rejection_reason column...');
        results.push({ column: 'rejection_reason', status: 'needs_migration' });
      } else {
        console.log('rejection_reason column already exists');
        results.push({ column: 'rejection_reason', status: 'exists' });
      }
    } catch (err: any) {
      console.log('rejection_reason column needs to be added');
      results.push({ column: 'rejection_reason', status: 'needs_migration' });
    }

    // Try to add reviewed_by column
    try {
      const { data, error } = await supabase
        .from('delivery_agents')
        .select('reviewed_by')
        .limit(1);
      
      if (error && error.message.includes('column "reviewed_by" does not exist')) {
        console.log('Adding reviewed_by column...');
        results.push({ column: 'reviewed_by', status: 'needs_migration' });
      } else {
        console.log('reviewed_by column already exists');
        results.push({ column: 'reviewed_by', status: 'exists' });
      }
    } catch (err: any) {
      console.log('reviewed_by column needs to be added');
      results.push({ column: 'reviewed_by', status: 'needs_migration' });
    }

    // Try to add reviewed_at column
    try {
      const { data, error } = await supabase
        .from('delivery_agents')
        .select('reviewed_at')
        .limit(1);
      
      if (error && error.message.includes('column "reviewed_at" does not exist')) {
        console.log('Adding reviewed_at column...');
        results.push({ column: 'reviewed_at', status: 'needs_migration' });
      } else {
        console.log('reviewed_at column already exists');
        results.push({ column: 'reviewed_at', status: 'exists' });
      }
    } catch (err: any) {
      console.log('reviewed_at column needs to be added');
      results.push({ column: 'reviewed_at', status: 'needs_migration' });
    }

    // Check if documents table exists
    try {
      const { data, error } = await supabase
        .from('delivery_agent_documents')
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('relation "delivery_agent_documents" does not exist')) {
        console.log('delivery_agent_documents table needs to be created');
        results.push({ table: 'delivery_agent_documents', status: 'needs_migration' });
      } else {
        console.log('delivery_agent_documents table already exists');
        results.push({ table: 'delivery_agent_documents', status: 'exists' });
      }
    } catch (err: any) {
      console.log('delivery_agent_documents table needs to be created');
      results.push({ table: 'delivery_agent_documents', status: 'needs_migration' });
    }

    const needsMigration = results.some(result => result.status === 'needs_migration');
    
    console.log('🔧 Migration check completed:', { results, needsMigration });

    return NextResponse.json({
      success: true,
      message: needsMigration 
        ? 'Database needs migration. Please run the SQL commands manually in your Supabase SQL Editor.'
        : 'Database schema is up to date!',
      results,
      needsMigration,
      instructions: needsMigration ? {
        sqlCommands: [
          'ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;',
          'ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS reviewed_by TEXT;',
          'ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;',
          `CREATE TABLE IF NOT EXISTS delivery_agent_documents (
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
          );`
        ]
      } : null
    });

  } catch (error: any) {
    console.error('❌ Migration check failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration check failed'
    }, { status: 500 });
  }
}

// GET /api/migrate-delivery-agents - Check migration status
export async function GET() {
  try {
    console.log('🔍 Checking delivery agent database migration status...');
    const supabase = getSupabaseClient();
    
    // Check if new columns exist
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'delivery_agents')
      .in('column_name', ['rejection_reason', 'reviewed_by', 'reviewed_at']);

    if (columnError) {
      console.error('Error checking columns:', columnError);
      return NextResponse.json({
        success: false,
        error: columnError.message
      }, { status: 500 });
    }

    // Check if documents table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'delivery_agent_documents');

    const hasDocumentsTable = tables && tables.length > 0;
    const hasNewColumns = columns && columns.length >= 3;
    
    console.log('📊 Migration status:', { hasNewColumns, hasDocumentsTable, columns: columns?.length || 0 });

    return NextResponse.json({
      success: true,
      migrationStatus: {
        hasNewColumns,
        hasDocumentsTable,
        columns: columns || [],
        needsMigration: !hasNewColumns || !hasDocumentsTable
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking migration status:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check migration status'
    }, { status: 500 });
  }
}
