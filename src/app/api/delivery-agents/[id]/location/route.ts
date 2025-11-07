import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Update delivery agent's current location
 * POST /api/delivery-agents/[id]/location
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.id;
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Update delivery agent location in delivery_agents table
    const { error: agentError } = await supabase
      .from('delivery_agents')
      .update({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        last_location_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (agentError) {
      console.error('Error updating agent location:', agentError);
      // Continue anyway - the agent_latitude/longitude in deliveries table is more important
    }

    // Update all active deliveries for this agent with current location
    // This allows customers to see the agent's live location
    const { data: activeDeliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('id')
      .eq('delivery_agent_id', agentId)
      .in('status', ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']);

    if (!deliveriesError && activeDeliveries && activeDeliveries.length > 0) {
      // Update agent location for all active deliveries
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          agent_latitude: parseFloat(latitude),
          agent_longitude: parseFloat(longitude),
          updated_at: new Date().toISOString()
        })
        .in('id', activeDeliveries.map(d => d.id));

      if (updateError) {
        console.error('Error updating delivery locations:', updateError);
      } else {
        console.log(`✅ Updated agent location for ${activeDeliveries.length} active deliveries`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error updating delivery agent location:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

