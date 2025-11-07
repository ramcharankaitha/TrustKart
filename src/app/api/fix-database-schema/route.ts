import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database schema fix...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: any = {};

    // Test connection first
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      results.connection = 'Connected successfully';
    } catch (error) {
      results.connection = `Connection failed: ${error}`;
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        results
      }, { status: 500 });
    }

    // Check current table structure
    try {
      const { data: columns, error } = await supabase.rpc('get_table_columns', {
        table_name: 'users'
      });
      
      if (error) {
        // Fallback: try direct query
        const { data: directColumns, error: directError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'users');
        
        if (directError) {
          results.currentColumns = 'Could not fetch column info';
        } else {
          results.currentColumns = directColumns?.map(col => col.column_name) || [];
        }
      } else {
        results.currentColumns = columns?.map(col => col.column_name) || [];
      }
    } catch (error) {
      results.currentColumns = 'Error fetching columns';
    }

    // Add missing columns using SQL
    const addColumnsSQL = `
      DO $$
      BEGIN
          -- Add password column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'password'
          ) THEN
              ALTER TABLE users ADD COLUMN password VARCHAR(255);
          END IF;

          -- Add phone column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'phone'
          ) THEN
              ALTER TABLE users ADD COLUMN phone VARCHAR(20);
          END IF;

          -- Add aadhaar_number column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'aadhaar_number'
          ) THEN
              ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR(12);
          END IF;
      END $$;
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: addColumnsSQL
      });
      
      if (error) {
        // Try alternative method
        const { error: altError } = await supabase
          .from('users')
          .select('password, phone, aadhaar_number')
          .limit(1);
        
        if (altError && altError.code === 'PGRST116') {
          // Columns don't exist, try to add them
          results.schemaUpdate = 'Attempting to add missing columns...';
          
          // Try inserting a test record to trigger schema creation
          const { data: testInsert, error: insertError } = await supabase
            .from('users')
            .insert([{
              email: 'schema-test@example.com',
              name: 'Schema Test',
              role: 'CUSTOMER',
              password: 'test',
              phone: '1234567890',
              aadhaar_number: '123456789012',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select();
          
          if (insertError) {
            results.schemaUpdate = `Schema update failed: ${insertError.message}`;
          } else {
            results.schemaUpdate = 'Schema updated successfully';
            // Clean up test record
            await supabase.from('users').delete().eq('email', 'schema-test@example.com');
          }
        } else {
          results.schemaUpdate = 'Schema already up to date';
        }
      } else {
        results.schemaUpdate = 'Schema updated successfully';
      }
    } catch (error) {
      results.schemaUpdate = `Schema update error: ${error}`;
    }

    // Test user creation
    try {
      const { data: testUser, error: testError } = await supabase
        .from('users')
        .insert([{
          email: 'test-user@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          password: 'testpassword123',
          phone: '9876543210',
          aadhaar_number: '123456789012',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (testError) {
        results.userCreationTest = `Failed: ${testError.message}`;
      } else {
        results.userCreationTest = 'Success';
        // Clean up test user
        await supabase.from('users').delete().eq('id', testUser.id);
      }
    } catch (error) {
      results.userCreationTest = `Error: ${error}`;
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema fix completed',
      results
    });

  } catch (error) {
    console.error('Database schema fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: {}
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

