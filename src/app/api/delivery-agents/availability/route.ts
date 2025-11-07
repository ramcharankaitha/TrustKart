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

export async function PUT(request: NextRequest) {
  try {
    const { deliveryAgentId, isAvailable } = await request.json();

    if (!deliveryAgentId || typeof isAvailable !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Delivery agent ID and availability status are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data: deliveryAgent, error } = await supabase
      .from('delivery_agents')
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryAgentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating delivery agent availability:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      deliveryAgent
    });

  } catch (error: any) {
    console.error('Error updating delivery agent availability:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
