import { NextRequest, NextResponse } from 'next/server';

const getSupabaseClient = () => {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryId, deliveryAgentId } = body;

    if (!deliveryId || !deliveryAgentId) {
      return NextResponse.json({
        success: false,
        error: 'Delivery ID and Delivery Agent ID are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if delivery is already assigned
    const { data: existingDelivery, error: checkError } = await supabase
      .from('deliveries')
      .select('delivery_agent_id, status')
      .eq('id', deliveryId)
      .single();

    if (checkError) {
      return NextResponse.json({
        success: false,
        error: 'Delivery not found'
      }, { status: 404 });
    }

    if (existingDelivery.delivery_agent_id && existingDelivery.delivery_agent_id !== deliveryAgentId) {
      return NextResponse.json({
        success: false,
        error: 'This delivery is already assigned to another agent'
      }, { status: 400 });
    }

    // Assign delivery to agent
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .update({
        delivery_agent_id: deliveryAgentId,
        assigned_at: new Date().toISOString(),
        status: 'ASSIGNED',
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId)
      .select(`
        *,
        order:orders(
          id,
          status,
          total_amount,
          delivery_address,
          delivery_phone,
          notes,
          created_at,
          customer_latitude,
          customer_longitude,
          shop_latitude,
          shop_longitude,
          customer:users(name, phone, address),
          shop:shops(name, address, phone, latitude, longitude)
        )
      `)
      .single();

    if (error) {
      console.error('Error accepting delivery:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery accepted successfully',
      delivery
    });

  } catch (error: any) {
    console.error('Error accepting delivery:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

