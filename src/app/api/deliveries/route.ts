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

// Get deliveries for a delivery agent
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Deliveries API GET called');
    const { searchParams } = new URL(request.url);
    const deliveryAgentId = searchParams.get('deliveryAgentId');
    const status = searchParams.get('status');
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';

    console.log('🔍 Query parameters:', { deliveryAgentId, status, unassignedOnly });

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (supabaseError: any) {
      console.error('❌ Error creating Supabase client:', supabaseError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: supabaseError.message
      }, { status: 500 });
    }
    
    // Fetch deliveries - select all columns
    // Note: pickup_address, pickup_latitude, delivery_photo_url, etc. may not exist in all databases
    let query = supabase
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false });

    if (deliveryAgentId) {
      query = query.eq('delivery_agent_id', deliveryAgentId);
      console.log('🔍 Filtering by delivery agent:', deliveryAgentId);
    } else if (unassignedOnly) {
      // Get unassigned deliveries (delivery_agent_id is NULL) with ASSIGNED status
      query = query
        .is('delivery_agent_id', null)
        .eq('status', 'ASSIGNED');
      console.log('🔍 Filtering for unassigned deliveries (NULL delivery_agent_id, ASSIGNED status)');
    }

    if (status && !unassignedOnly) {
      query = query.eq('status', status);
      console.log('🔍 Filtering by status:', status);
    }

    const { data: deliveries, error } = await query;
    
    console.log('🔍 Deliveries API query result:', {
      deliveryAgentId,
      status,
      unassignedOnly,
      deliveryCount: deliveries?.length || 0,
      error: error?.message || 'none',
      errorCode: error?.code,
      errorDetails: error?.details
    });

    if (error) {
      console.error('❌ Error fetching deliveries:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to fetch deliveries',
        errorCode: error.code,
        errorDetails: error.details
      }, { status: 500 });
    }

    // If no deliveries, return empty array
    if (!deliveries || deliveries.length === 0) {
      console.log('✅ No deliveries found, returning empty array');
      return NextResponse.json({
        success: true,
        deliveries: []
      });
    }

    // Fetch order details separately for each delivery
    // Use Promise.allSettled to handle individual errors gracefully
    const enrichedDeliveries = await Promise.allSettled(
      deliveries.map(async (delivery: any) => {
        try {
          // Get order details
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', delivery.order_id)
            .single();

          if (orderError || !order) {
            console.warn(`⚠️ Error fetching order ${delivery.order_id}:`, orderError?.message || 'Order not found');
            return {
              ...delivery,
              order: null
            };
          }

          // Get customer details
          let customer = null;
          if (order.customer_id) {
            try {
              const { data: customerData, error: customerError } = await supabase
                .from('users')
                .select('id, name, phone, address, latitude, longitude')
                .eq('id', order.customer_id)
                .single();
              
              if (!customerError && customerData) {
                customer = customerData;
              }
            } catch (customerErr) {
              console.warn(`⚠️ Error fetching customer ${order.customer_id}:`, customerErr);
            }
          }

          // Get shop details
          let shop = null;
          if (order.shop_id) {
            try {
              const { data: shopData, error: shopError } = await supabase
                .from('shops')
                .select('id, name, address, phone, latitude, longitude')
                .eq('id', order.shop_id)
                .single();
              
              if (!shopError && shopData) {
                shop = shopData;
              }
            } catch (shopErr) {
              console.warn(`⚠️ Error fetching shop ${order.shop_id}:`, shopErr);
            }
          }

          return {
            ...delivery,
            order: {
              ...order,
              customer: customer,
              shop: shop
            }
          };
        } catch (deliveryErr: any) {
          console.error(`❌ Error enriching delivery ${delivery.id}:`, deliveryErr);
          return {
            ...delivery,
            order: null,
            error: deliveryErr.message
          };
        }
      })
    );

    // Extract successful results and handle failures
    const successfulDeliveries = enrichedDeliveries
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const failedDeliveries = enrichedDeliveries
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    if (failedDeliveries.length > 0) {
      console.warn(`⚠️ ${failedDeliveries.length} deliveries failed to enrich:`, failedDeliveries.map(r => r.reason));
    }

    console.log('✅ Returning enriched deliveries:', {
      total: successfulDeliveries.length,
      failed: failedDeliveries.length
    });

    return NextResponse.json({
      success: true,
      deliveries: successfulDeliveries
    });

  } catch (error: any) {
    console.error('❌ Error in deliveries API:', {
      error: error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({
      success: false,
      error: error?.message || 'An unexpected error occurred',
      errorName: error?.name
    }, { status: 500 });
  }
}

// Create a new delivery assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      deliveryAgentId,
      deliveryAddress,
      deliveryPhone,
      notes
    } = body;

    if (!orderId || !deliveryAddress) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and delivery address are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Create delivery record
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .insert([{
        order_id: orderId,
        delivery_agent_id: deliveryAgentId,
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString(),
        delivery_address: deliveryAddress,
        delivery_phone: deliveryPhone,
        notes: notes
      }])
      .select('*')
      .single();

    // Enrich delivery with order, customer, and shop data
    let enrichedDelivery = delivery;
    if (delivery && !error) {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order) {
        // Get customer details
        let customer = null;
        if (order.customer_id) {
          const { data: customerData } = await supabase
            .from('users')
            .select('id, name, phone, address')
            .eq('id', order.customer_id)
            .single();
          customer = customerData;
        }

        // Get shop details
        let shop = null;
        if (order.shop_id) {
          const { data: shopData } = await supabase
            .from('shops')
            .select('id, name, address, phone')
            .eq('id', order.shop_id)
            .single();
          shop = shopData;
        }

        enrichedDelivery = {
          ...delivery,
          order: {
            ...order,
            customer: customer,
            shop: shop
          }
        };
      }
    }

    if (error) {
      console.error('Error creating delivery:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Update order status to PREPARING if it's still PENDING
    if (enrichedDelivery?.order?.status === 'PENDING') {
      await supabase
        .from('orders')
        .update({ status: 'PREPARING' })
        .eq('id', orderId);
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery assigned successfully',
      delivery: enrichedDelivery || delivery
    });

  } catch (error: any) {
    console.error('Error creating delivery:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Update delivery status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      deliveryId, 
      status, 
      notes, 
      deliveryAgentId,
      pickup_latitude,
      pickup_longitude,
      delivery_latitude,
      delivery_longitude,
      delivery_photo_url
    } = body;

    if (!deliveryId) {
      return NextResponse.json({
        success: false,
        error: 'Delivery ID is required'
      }, { status: 400 });
    }

    // If status is not provided, allow updating other fields (like coordinates)
    if (!status && !pickup_latitude && !pickup_longitude && !delivery_latitude && !delivery_longitude) {
      return NextResponse.json({
        success: false,
        error: 'At least one field to update is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Update status if provided
    if (status) {
      updateData.status = status;
    }

    // If deliveryAgentId is provided, assign the delivery agent
    if (deliveryAgentId) {
      updateData.delivery_agent_id = deliveryAgentId;
      updateData.assigned_at = new Date().toISOString();
    }

    // Update location coordinates if provided
    if (pickup_latitude !== undefined) {
      updateData.pickup_latitude = pickup_latitude;
    }
    if (pickup_longitude !== undefined) {
      updateData.pickup_longitude = pickup_longitude;
    }
    if (delivery_latitude !== undefined) {
      updateData.delivery_latitude = delivery_latitude;
    }
    if (delivery_longitude !== undefined) {
      updateData.delivery_longitude = delivery_longitude;
    }

    // Set specific timestamps based on status
    if (status === 'PICKED_UP') {
      updateData.picked_up_at = new Date().toISOString();
    } else if (status === 'DELIVERED') {
      updateData.delivered_at = new Date().toISOString();
      
      // Require photo for DELIVERED status
      if (!delivery_photo_url) {
        // Check if delivery already has a photo
        const { data: existingDelivery } = await supabase
          .from('deliveries')
          .select('delivery_photo_url')
          .eq('id', deliveryId)
          .single();
        
        if (!existingDelivery?.delivery_photo_url) {
          return NextResponse.json({
            success: false,
            error: 'Delivery proof photo is required before marking as delivered. Please upload a photo first.'
          }, { status: 400 });
        }
        
        // Use existing photo if available
        updateData.delivery_photo_url = existingDelivery.delivery_photo_url;
      } else {
        updateData.delivery_photo_url = delivery_photo_url;
        // Only include timestamp if column exists (will be handled by error handling if it doesn't)
        // Don't set it here to avoid errors if column doesn't exist
      }
    }

    // Update photo URL if provided separately
    if (delivery_photo_url !== undefined && status !== 'DELIVERED') {
      updateData.delivery_photo_url = delivery_photo_url;
      // Don't include timestamp - let the update succeed without it
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Try to update, handle missing columns gracefully
    let delivery = null;
    let error = null;
    
    const { data: updatedDelivery, error: updateError } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', deliveryId)
      .select('*')
      .single();

    // If error is about missing columns, try updating without optional columns
    if (updateError && (updateError.message?.includes('delivery_photo_uploaded_at') || 
                        updateError.message?.includes('column') ||
                        updateError.message?.includes('schema cache'))) {
      console.log('⚠️ Some columns may not exist, trying update without optional fields');
      
      // Remove optional timestamp fields and retry
      const { delivery_photo_uploaded_at, ...essentialUpdateData } = updateData;
      
      const { data: retryDelivery, error: retryError } = await supabase
        .from('deliveries')
        .update(essentialUpdateData)
        .eq('id', deliveryId)
        .select('*')
        .single();
      
      delivery = retryDelivery;
      error = retryError;
    } else {
      delivery = updatedDelivery;
      error = updateError;
    }

    // Enrich delivery with order, customer, and shop data
    let enrichedDelivery = delivery;
    if (delivery && !error) {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', delivery.order_id)
        .single();

      if (order) {
        // Get customer details
        let customer = null;
        if (order.customer_id) {
          const { data: customerData } = await supabase
            .from('users')
            .select('id, name, phone, address')
            .eq('id', order.customer_id)
            .single();
          customer = customerData;
        }

        // Get shop details
        let shop = null;
        if (order.shop_id) {
          const { data: shopData } = await supabase
            .from('shops')
            .select('id, name, address, phone')
            .eq('id', order.shop_id)
            .single();
          shop = shopData;
        }

        enrichedDelivery = {
          ...delivery,
          order: {
            ...order,
            customer: customer,
            shop: shop
          }
        };
      }
    }

    if (error) {
      console.error('Error updating delivery:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Update order status based on delivery status (only if status was provided)
    if (status) {
      let orderStatus = '';
      if (status === 'PICKED_UP') {
        orderStatus = 'IN_TRANSIT';
      } else if (status === 'DELIVERED') {
        orderStatus = 'DELIVERED';
      }

      if (orderStatus && enrichedDelivery?.order_id) {
        await supabase
          .from('orders')
          .update({ status: orderStatus })
          .eq('id', enrichedDelivery.order_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery status updated successfully',
      delivery: enrichedDelivery || delivery
    });

  } catch (error: any) {
    console.error('Error updating delivery:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
