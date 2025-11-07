import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { geocodeAddress } from '@/lib/geocoding-service';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not set');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Create a delivery assignment when order is paid
 * This will be called automatically after payment completion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    const supabase = getSupabaseClient();
    
    // Retry logic for order lookup (handles timing issues after payment)
    let order = null;
    let orderError = null;
    let shop = null;
    let customer = null;
    const maxRetries = 3;
    const retryDelay = 500; // 500ms
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Try nested select first (requires foreign keys)
      const { data: fetchedOrder, error: fetchedError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          delivery_address,
          delivery_phone,
          customer_id,
          shop_id,
          customer_latitude,
          customer_longitude,
          shop_latitude,
          shop_longitude,
          shop:shops(
            id,
            name,
            address,
            phone,
            latitude,
            longitude
          ),
          customer:users(
            id,
            name,
            phone,
            address,
            latitude,
            longitude
          )
        `)
        .eq('id', orderId)
        .single();

      // Check if error is due to missing relationships
      if (fetchedError && (
        fetchedError.message?.includes('relationship') || 
        fetchedError.message?.includes('schema cache') ||
        fetchedError.message?.includes('Could not find')
      )) {
        console.log('⚠️ Nested select failed (missing relationships), using separate queries...');
        
        // Fallback: Use separate queries
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (orderErr || !orderData) {
          orderError = orderErr;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          break;
        }

        // Fetch shop and customer separately
        const { data: shopData } = await supabase
          .from('shops')
          .select('id, name, address, phone, latitude, longitude')
          .eq('id', orderData.shop_id)
          .single();
        
        const { data: customerData } = await supabase
          .from('users')
          .select('id, name, phone, address, latitude, longitude')
          .eq('id', orderData.customer_id)
          .single();

        order = {
          ...orderData,
          shop: shopData || null,
          customer: customerData || null
        };
        shop = shopData;
        customer = customerData;
        orderError = null;
        
        console.log(`✅ Order found using separate queries on attempt ${attempt}:`, order.id);
        break;
      }

      order = fetchedOrder;
      orderError = fetchedError;
      shop = fetchedOrder?.shop || null;
      customer = fetchedOrder?.customer || null;

      if (order && !orderError) {
        console.log(`✅ Order found on attempt ${attempt}:`, order.id);
        break;
      }

      if (attempt < maxRetries) {
        console.log(`⚠️ Order not found on attempt ${attempt}, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    if (orderError || !order) {
      console.error('❌ Order lookup failed after retries:', {
        orderId,
        error: orderError,
        attempts: maxRetries
      });
      return NextResponse.json({
        success: false,
        error: `Order not found: ${orderError?.message || 'Order does not exist'}`
      }, { status: 404 });
    }

    // Check if order is paid
    if (order.status !== 'PAID' && order.status !== 'CONFIRMED') {
      return NextResponse.json({
        success: false,
        error: `Cannot create delivery for order with status: ${order.status}. Order must be PAID or CONFIRMED.`
      }, { status: 400 });
    }

    // Check if delivery already exists
    const { data: existingDelivery } = await supabase
      .from('deliveries')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existingDelivery) {
      return NextResponse.json({
        success: true,
        message: 'Delivery assignment already exists',
        delivery: existingDelivery
      });
    }

    // Get pickup location from shop (use shop variable if available from separate query)
    const shopData = shop || order.shop;
    let pickupLat = order.shop_latitude || shopData?.latitude || null;
    let pickupLng = order.shop_longitude || shopData?.longitude || null;
    const pickupAddress = shopData?.address || '';

    // Get delivery location from customer (use customer variable if available from separate query)
    const customerData = customer || order.customer;
    let deliveryLat = order.customer_latitude || customerData?.latitude || null;
    let deliveryLng = order.customer_longitude || customerData?.longitude || null;
    const deliveryAddress = order.delivery_address || customerData?.address || '';

    // Geocode addresses if coordinates are missing
    console.log('🔍 Checking coordinates:', {
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      pickupAddress,
      deliveryAddress
    });

    // Geocode pickup address if coordinates are missing
    if ((!pickupLat || !pickupLng) && pickupAddress) {
      console.log('📍 Geocoding pickup address:', pickupAddress);
      try {
        const pickupCoords = await geocodeAddress(pickupAddress);
        if (pickupCoords) {
          pickupLat = pickupCoords.latitude;
          pickupLng = pickupCoords.longitude;
          console.log('✅ Pickup coordinates geocoded:', pickupCoords);
          
          // Update shop coordinates in database if they were missing
          const currentShop = shopData || order.shop;
          if (order.shop_id && (!currentShop?.latitude || !currentShop?.longitude)) {
            await supabase
              .from('shops')
              .update({
                latitude: pickupLat,
                longitude: pickupLng,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.shop_id);
          }
          
          // Also update order with shop coordinates
          await supabase
            .from('orders')
            .update({
              shop_latitude: pickupLat,
              shop_longitude: pickupLng
            })
            .eq('id', orderId);
        } else {
          console.warn('⚠️ Could not geocode pickup address');
        }
      } catch (error) {
        console.error('❌ Error geocoding pickup address:', error);
      }
    }

    // Geocode delivery address if coordinates are missing
    if ((!deliveryLat || !deliveryLng) && deliveryAddress) {
      console.log('📍 Geocoding delivery address:', deliveryAddress);
      try {
        const deliveryCoords = await geocodeAddress(deliveryAddress);
        if (deliveryCoords) {
          deliveryLat = deliveryCoords.latitude;
          deliveryLng = deliveryCoords.longitude;
          console.log('✅ Delivery coordinates geocoded:', deliveryCoords);
          
          // Update customer coordinates in database if they were missing
          const currentCustomer = customerData || order.customer;
          if (order.customer_id && (!currentCustomer?.latitude || !currentCustomer?.longitude)) {
            await supabase
              .from('users')
              .update({
                latitude: deliveryLat,
                longitude: deliveryLng,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.customer_id);
          }
          
          // Also update order with customer coordinates
          await supabase
            .from('orders')
            .update({
              customer_latitude: deliveryLat,
              customer_longitude: deliveryLng
            })
            .eq('id', orderId);
        } else {
          console.warn('⚠️ Could not geocode delivery address');
        }
      } catch (error) {
        console.error('❌ Error geocoding delivery address:', error);
      }
    }

    // Auto-assign to nearest available delivery agent
    let assignedAgentId: string | null = null;
    
    if (pickupLat && pickupLng) {
      // Find available delivery agents (APPROVED status, is_available = true)
      const { data: availableAgents, error: agentsError } = await supabase
        .from('delivery_agents')
        .select('id, name, address, latitude, longitude')
        .eq('status', 'APPROVED')
        .eq('is_available', true);
      
      if (!agentsError && availableAgents && availableAgents.length > 0) {
        // Calculate distance to each agent and assign to nearest
        // For now, we'll assign to the first available agent
        // In production, you'd calculate actual distance using coordinates
        // Check if agents have location data
        let nearestAgent = null;
        let minDistance = Infinity;
        
        for (const agent of availableAgents) {
          // If agent has location, calculate distance
          if (agent.latitude && agent.longitude) {
            // Simple haversine distance calculation
            const R = 6371; // Earth's radius in km
            const dLat = (pickupLat - agent.latitude) * Math.PI / 180;
            const dLon = (pickupLng - agent.longitude) * Math.PI / 180;
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(agent.latitude * Math.PI / 180) * Math.cos(pickupLat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestAgent = agent;
            }
          } else {
            // If no location data, use first agent as fallback
            if (!nearestAgent) {
              nearestAgent = agent;
            }
          }
        }
        
        if (nearestAgent) {
          assignedAgentId = nearestAgent.id;
          console.log(`✅ Auto-assigned delivery to agent: ${nearestAgent.name} (${nearestAgent.id})`, {
            distance: minDistance !== Infinity ? `${minDistance.toFixed(2)} km` : 'N/A'
          });
        }
      } else {
        console.log('⚠️ No available delivery agents found. Delivery will be unassigned and available for agents to accept.');
      }
    } else {
      console.log('⚠️ No pickup coordinates available. Delivery will be unassigned and available for agents to accept.');
    }

    // Create delivery assignment
    // Start with required fields
    const deliveryData: any = {
      order_id: orderId,
      status: 'ASSIGNED',
      delivery_address: deliveryAddress,
      delivery_phone: order.delivery_phone || customerData?.phone || order.customer?.phone || '',
      notes: `Pickup from: ${shopData?.name || order.shop?.name || 'Shop'} | Deliver to: ${customerData?.name || order.customer?.name || 'Customer'}`,
    };
    
    // Add optional fields if they exist
    if (assignedAgentId) {
      deliveryData.delivery_agent_id = assignedAgentId;
      deliveryData.assigned_at = new Date().toISOString();
    }
    
    // Add location fields only if coordinates are available
    // These fields may not exist in all database schemas
    if (pickupAddress) {
      deliveryData.pickup_address = pickupAddress;
    }
    if (pickupLat !== null && pickupLng !== null) {
      deliveryData.pickup_latitude = pickupLat;
      deliveryData.pickup_longitude = pickupLng;
    }
    if (deliveryLat !== null && deliveryLng !== null) {
      deliveryData.delivery_latitude = deliveryLat;
      deliveryData.delivery_longitude = deliveryLng;
    }
    
    console.log('🔍 Creating delivery assignment:', {
      orderId,
      status: 'ASSIGNED',
      delivery_agent_id: assignedAgentId || 'NULL (available for acceptance)',
      hasPickupCoords: !!(pickupLat && pickupLng),
      hasDeliveryCoords: !!(deliveryLat && deliveryLng),
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      pickupAddress,
      deliveryAddress,
      deliveryDataKeys: Object.keys(deliveryData)
    });
    
    // Try to insert delivery - handle errors gracefully
    let delivery;
    let deliveryError;
    
    try {
      const result = await supabase
        .from('deliveries')
        .insert([deliveryData])
        .select()
        .single();
      
      delivery = result.data;
      deliveryError = result.error;
    } catch (insertError: any) {
      console.error('❌ Insert error caught:', insertError);
      // If insert fails due to missing columns, try with minimal data
      if (insertError.message?.includes('column') || insertError.message?.includes('does not exist')) {
        console.log('⚠️ Retrying with minimal delivery data (some columns may not exist)...');
        const minimalData: any = {
          order_id: orderId,
          status: 'ASSIGNED',
          delivery_address: deliveryAddress,
          delivery_phone: order.delivery_phone || order.customer?.phone || '',
          notes: `Pickup from: ${order.shop?.name || 'Shop'} | Deliver to: ${order.customer?.name || 'Customer'}`,
        };
        
        if (assignedAgentId) {
          minimalData.delivery_agent_id = assignedAgentId;
          minimalData.assigned_at = new Date().toISOString();
        }
        
        const retryResult = await supabase
          .from('deliveries')
          .insert([minimalData])
          .select()
          .single();
        
        delivery = retryResult.data;
        deliveryError = retryResult.error;
      } else {
        deliveryError = insertError;
      }
    }

    if (deliveryError) {
      console.error('❌ Error creating delivery:', deliveryError);
      console.error('❌ Delivery error details:', JSON.stringify(deliveryError, null, 2));
      
      // Provide more specific error message
      let errorMessage = deliveryError.message || 'Failed to create delivery assignment';
      
      // Check if it's a schema issue
      if (deliveryError.message?.includes('column') || deliveryError.message?.includes('does not exist')) {
        errorMessage = 'Database schema issue: Missing required columns. Please run ADD-DELIVERY-LOCATION-COLUMNS.sql to add location columns.';
        console.error('⚠️ Schema issue detected. Please ensure deliveries table has all required columns.');
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: deliveryError.message,
        hint: 'If you see "column does not exist" error, run the ADD-DELIVERY-LOCATION-COLUMNS.sql script'
      }, { status: 500 });
    }

    if (!delivery) {
      console.error('❌ Delivery creation returned no data');
      return NextResponse.json({
        success: false,
        error: 'Delivery creation failed - no data returned'
      }, { status: 500 });
    }

    console.log('✅ Delivery assignment created successfully:', {
      deliveryId: delivery.id,
      orderId: delivery.order_id,
      status: delivery.status,
      delivery_agent_id: delivery.delivery_agent_id,
      isNullAgent: delivery.delivery_agent_id === null || delivery.delivery_agent_id === undefined,
      hasPickupLocation: !!(delivery.pickup_latitude && delivery.pickup_longitude),
      hasDeliveryLocation: !!(delivery.delivery_latitude && delivery.delivery_longitude),
      pickupAddress: delivery.pickup_address,
      deliveryAddress: delivery.delivery_address
    });

    // Verify the delivery is actually in the database and queryable
    const { data: verifyDelivery, error: verifyError } = await supabase
      .from('deliveries')
      .select('id, status, delivery_agent_id, order_id')
      .eq('id', delivery.id)
      .single();

    if (verifyError) {
      console.warn('⚠️ Warning: Could not verify delivery after creation:', verifyError);
    } else {
      console.log('✅ Delivery verified in database:', {
        id: verifyDelivery.id,
        status: verifyDelivery.status,
        delivery_agent_id: verifyDelivery.delivery_agent_id,
        isAvailableForAgents: verifyDelivery.delivery_agent_id === null && verifyDelivery.status === 'ASSIGNED'
      });
    }

    // Update order status to CONFIRMED if it's PAID
    if (order.status === 'PAID') {
      await supabase
        .from('orders')
        .update({ 
          status: 'CONFIRMED',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery assignment created successfully',
      delivery: delivery
    });

  } catch (error: any) {
    console.error('Error creating delivery assignment:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

