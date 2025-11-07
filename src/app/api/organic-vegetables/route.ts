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

// GET - Fetch organic vegetables (only approved ones for customers, all for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', or null for all
    const includePending = searchParams.get('includePending') === 'true';
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('organic_vegetables')
      .select('*')
      .order('created_at', { ascending: false });
    
    // If status is specified, filter by it
    if (status) {
      query = query.eq('status', status);
    } else if (!includePending) {
      // Default: only show approved vegetables
      query = query.eq('status', 'approved');
    }
    
    const { data: vegetables, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching organic vegetables:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to fetch vegetables'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      vegetables: vegetables || []
    });
  } catch (error: any) {
    console.error('Error in GET organic vegetables:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Submit a new organic vegetable for approval
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      unit = 'kg',
      category,
      image_url,
      nutritional_info,
      origin,
      certification,
      farmer_name,
      farmer_contact,
      quantity_available = 0,
      min_order_quantity = 1,
      shop_id,
      submitted_by
    } = body;
    
    // Validate required fields
    if (!name || !price || !submitted_by) {
      return NextResponse.json({
        success: false,
        error: 'Name, price, and submitted_by are required'
      }, { status: 400 });
    }
    
    const supabase = getSupabaseClient();
    
    // Insert vegetable with pending status
    const { data: vegetable, error } = await supabase
      .from('organic_vegetables')
      .insert([{
        name,
        description,
        price: parseFloat(price),
        unit,
        category,
        image_url,
        nutritional_info: nutritional_info ? JSON.stringify(nutritional_info) : null,
        origin,
        certification,
        farmer_name,
        farmer_contact,
        quantity_available: parseFloat(quantity_available) || 0,
        min_order_quantity: parseFloat(min_order_quantity) || 1,
        shop_id: shop_id || null,
        submitted_by,
        status: 'pending' // Always starts as pending
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating organic vegetable:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to create vegetable'
      }, { status: 500 });
    }
    
    console.log('✅ Organic vegetable submitted for approval:', vegetable.id);
    
    return NextResponse.json({
      success: true,
      vegetable
    });
  } catch (error: any) {
    console.error('Error in POST organic vegetable:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

