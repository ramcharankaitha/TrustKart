import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not set')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Check if farmers table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('farmers')
      .select('id')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        error: `Table error: ${tableError.message}`,
        code: tableError.code,
        details: tableError.details,
        hint: tableError.hint
      }, { status: 500 });
    }
    
    // Get all farmers
    const { data: farmers, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }
    
    // Get count by status
    const { count: totalCount } = await supabase
      .from('farmers')
      .select('*', { count: 'exact', head: true });
    
    const { count: pendingCount } = await supabase
      .from('farmers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');
    
    const { count: approvedCount } = await supabase
      .from('farmers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'APPROVED');
    
    return NextResponse.json({
      success: true,
      tableExists: true,
      totalFarmers: totalCount || 0,
      pendingFarmers: pendingCount || 0,
      approvedFarmers: approvedCount || 0,
      farmers: farmers || [],
      farmersCount: farmers?.length || 0
    });
    
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred',
      stack: error.stack
    }, { status: 500 });
  }
}

