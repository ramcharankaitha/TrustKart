import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('🔍 Supabase URL:', supabaseUrl);
    console.log('🔍 Supabase Key exists:', !!supabaseAnonKey);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return NextResponse.json({
        success: false,
        error: `Connection failed: ${connectionError.message}`,
        code: connectionError.code,
        details: connectionError.details,
        hint: connectionError.hint
      }, { status: 500 });
    }
    
    console.log('✅ Connection test passed');
    
    // Test 2: Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users');
    
    if (tableError) {
      console.warn('⚠️ Could not fetch table info:', tableError);
    }
    
    // Test 3: Try to insert a minimal user
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'CUSTOMER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return NextResponse.json({
        success: false,
        error: `Insert failed: ${insertError.message}`,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        tableStructure: tableInfo || 'Could not fetch'
      }, { status: 500 });
    }
    
    console.log('✅ Insert test passed');
    
    // Clean up test user
    await supabase.from('users').delete().eq('id', insertResult.id);
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      tableStructure: tableInfo || 'Could not fetch',
      testUser: insertResult
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to create a user with all possible fields
    const testUser = {
      email: `full-test-${Date.now()}@example.com`,
      name: 'Full Test User',
      role: 'SHOPKEEPER',
      password: 'testpassword123',
      phone: '9876543210',
      aadhaar_number: '123456789012',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Testing full user creation...');
    
    const { data: result, error } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Full user creation failed:', error);
      
      // Try with minimal fields
      const minimalUser = {
        email: `minimal-test-${Date.now()}@example.com`,
        name: 'Minimal Test User',
        role: 'CUSTOMER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: minimalResult, error: minimalError } = await supabase
        .from('users')
        .insert([minimalUser])
        .select()
        .single();
      
      if (minimalError) {
        return NextResponse.json({
          success: false,
          fullError: error,
          minimalError: minimalError,
          message: 'Both full and minimal user creation failed'
        }, { status: 500 });
      }
      
      // Clean up
      await supabase.from('users').delete().eq('id', minimalResult.id);
      
      return NextResponse.json({
        success: true,
        message: 'Minimal user creation works, full user creation failed',
        fullError: error,
        minimalResult: minimalResult
      });
    }
    
    // Clean up
    await supabase.from('users').delete().eq('id', result.id);
    
    return NextResponse.json({
      success: true,
      message: 'Full user creation works',
      result: result
    });
    
  } catch (error) {
    console.error('❌ User creation test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

