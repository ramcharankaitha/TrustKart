import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not set');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // SQL script to create customer_addresses table
    const createTableSQL = `
      -- Create customer_addresses table
      CREATE TABLE IF NOT EXISTS customer_addresses (
          id TEXT PRIMARY KEY DEFAULT 'addr_' || substr(md5(random()::text), 1, 8),
          customer_id TEXT NOT NULL,
          label TEXT,
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
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
      CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);
      CREATE INDEX IF NOT EXISTS idx_customer_addresses_location ON customer_addresses(latitude, longitude);

      -- Create function to ensure only one default address
      CREATE OR REPLACE FUNCTION ensure_single_default_address()
      RETURNS TRIGGER AS $$
      BEGIN
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

      -- Create trigger
      DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON customer_addresses;
      CREATE TRIGGER trigger_ensure_single_default_address
          BEFORE INSERT OR UPDATE ON customer_addresses
          FOR EACH ROW
          EXECUTE FUNCTION ensure_single_default_address();
    `;

    // Execute SQL using RPC (if available) or direct SQL execution
    // Note: Supabase client doesn't support executing arbitrary SQL directly
    // We'll need to use the service role key or execute via admin API
    // For now, let's try using rpc or check if table exists

    // First, check if table exists
    const { data: tableCheck, error: checkError } = await supabase
      .rpc('exec_sql', { sql_query: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'customer_addresses\');' })
      .catch(() => {
        // If RPC doesn't exist, try direct query
        return supabase.from('customer_addresses').select('id').limit(1);
      });

    // Try to create the table using a direct query approach
    // Since Supabase client doesn't support DDL directly, we'll create an endpoint that users can call
    // Or we can use the service role to execute SQL
    
    // For now, let's check if we can at least verify the setup needed
    const setupInstructions = {
      method: 'manual',
      steps: [
        'Go to your Supabase Dashboard',
        'Navigate to SQL Editor',
        'Copy and paste the SQL script from CUSTOMER-ADDRESSES-SETUP.sql',
        'Execute the script'
      ]
    };

    // Try to verify if table exists by attempting a simple query
    const { error: tableError } = await supabase
      .from('customer_addresses')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01' || tableError.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Table does not exist',
          message: 'The customer_addresses table needs to be created. Please run the SQL script.',
          setupInstructions,
          sqlScript: createTableSQL,
          manualSteps: [
            '1. Open Supabase Dashboard',
            '2. Go to SQL Editor',
            '3. Run the SQL script provided above'
          ]
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Customer addresses table exists and is ready to use',
      tableStatus: 'exists'
    });

  } catch (error: any) {
    console.error('Error checking customer_addresses table:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred while checking the table',
      message: 'Please run the CUSTOMER-ADDRESSES-SETUP.sql script in your Supabase SQL Editor'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Try to query the table to check if it exists
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return NextResponse.json({
          success: false,
          exists: false,
          error: 'Table does not exist',
          message: 'The customer_addresses table needs to be created. Please run the SQL script in Supabase SQL Editor.',
          sqlFile: 'CUSTOMER-ADDRESSES-SETUP.sql'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      message: 'Customer addresses table exists'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred'
    }, { status: 500 });
  }
}

