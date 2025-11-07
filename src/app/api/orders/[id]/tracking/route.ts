import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Get delivery agent live location for an order
 * GET /api/orders/[id]/tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const supabase = getSupabaseClient();

    // Get delivery information for this order
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select(`
        id,
        status,
        delivery_agent_id,
        agent_latitude,
        agent_longitude,
        delivery_latitude,
        delivery_longitude,
        pickup_latitude,
        pickup_longitude,
        updated_at,
        delivery_agent:delivery_agents(
          id,
          name,
          phone,
          vehicle_type,
          latitude,
          longitude
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json({
        success: false,
        error: 'Delivery not found for this order',
        delivery: null
      }, { status: 404 });
    }

    // Check if delivery agent is assigned
    if (!delivery.delivery_agent_id) {
      return NextResponse.json({
        success: true,
        delivery: {
          id: delivery.id,
          status: delivery.status,
          agentAssigned: false,
          agentLocation: null,
          deliveryAgent: null
        }
      });
    }

    // Get agent location (prefer agent_latitude/longitude from deliveries table, fallback to delivery_agents table)
    const agentLatitude = delivery.agent_latitude || delivery.delivery_agent?.latitude;
    const agentLongitude = delivery.agent_longitude || delivery.delivery_agent?.longitude;

    // Only return location if delivery is in progress (not delivered)
    const isInProgress = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status);

    return NextResponse.json({
      success: true,
      delivery: {
        id: delivery.id,
        status: delivery.status,
        agentAssigned: true,
        agentLocation: (agentLatitude && agentLongitude && isInProgress) ? {
          latitude: parseFloat(agentLatitude),
          longitude: parseFloat(agentLongitude),
          lastUpdated: delivery.updated_at
        } : null,
        deliveryAgent: delivery.delivery_agent ? {
          id: delivery.delivery_agent.id,
          name: delivery.delivery_agent.name,
          phone: delivery.delivery_agent.phone,
          vehicleType: delivery.delivery_agent.vehicle_type
        } : null,
        deliveryLocation: delivery.delivery_latitude && delivery.delivery_longitude ? {
          latitude: parseFloat(delivery.delivery_latitude),
          longitude: parseFloat(delivery.delivery_longitude)
        } : null,
        pickupLocation: delivery.pickup_latitude && delivery.pickup_longitude ? {
          latitude: parseFloat(delivery.pickup_latitude),
          longitude: parseFloat(delivery.pickup_longitude)
        } : null
      }
    });

  } catch (error: any) {
    console.error('Error fetching order tracking:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

