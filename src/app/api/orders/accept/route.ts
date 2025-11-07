import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { geocodeAddress } from '@/lib/geocoding-service';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not set')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Auto-create delivery request when order is accepted by shopkeeper
 * Maps shopkeeper address and customer address for delivery agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get order details with shop and customer info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shop:shops(address, latitude, longitude),
        customer:users(address, latitude, longitude, city, state, pincode)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // IMPORTANT: Deduct stock when order is approved
    // Get order items and update stock
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (!itemsError && orderItems && orderItems.length > 0) {
      console.log('🔄 Deducting stock for approved order:', orderId);
      
      // Validate stock availability first
      for (const item of orderItems) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, quantity')
          .eq('id', item.product_id)
          .single();

        if (productError || !product) {
          console.error('❌ Error fetching product for stock check:', productError);
          return NextResponse.json({
            success: false,
            error: `Product not found for order item: ${item.product_id}`
          }, { status: 400 });
        }

        const availableStock = product.quantity || 0;
        if (availableStock < item.quantity) {
          console.error('❌ Insufficient stock:', {
            product: product.name,
            requested: item.quantity,
            available: availableStock
          });
          return NextResponse.json({
            success: false,
            error: `Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${availableStock}`
          }, { status: 400 });
        }
      }

      // Deduct stock atomically
      for (const item of orderItems) {
        // Fetch current stock
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        if (fetchError || !product) {
          console.error('❌ Error fetching product for stock update:', fetchError);
          continue;
        }

        const currentQuantity = product.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - item.quantity);

        // Update stock
        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', item.product_id);

        if (updateError) {
          console.error('❌ Error updating stock for product:', item.product_id, updateError);
          return NextResponse.json({
            success: false,
            error: `Failed to update stock for order items: ${updateError.message}`
          }, { status: 500 });
        }

        console.log('✅ Stock updated:', {
          productId: item.product_id,
          oldQuantity: currentQuantity,
          newQuantity: newQuantity,
          deducted: item.quantity
        });
      }
      
      console.log('✅ All stock deducted successfully for order:', orderId);
    }

    // Get shopkeeper address (pickup location)
    const pickupAddress = order.shop?.address || '';
    const deliveryAddress = order.delivery_address || order.customer?.address || '';

    // Geocode addresses if coordinates not available
    let pickupCoords = order.shop?.latitude && order.shop?.longitude
      ? { latitude: order.shop.latitude, longitude: order.shop.longitude }
      : null;

    let deliveryCoords = order.customer?.latitude && order.customer?.longitude
      ? { latitude: order.customer.latitude, longitude: order.customer.longitude }
      : null;

    // If shop doesn't have coordinates, geocode it
    if (!pickupCoords && pickupAddress) {
      console.log('Geocoding shop address:', pickupAddress);
      pickupCoords = await geocodeAddress(pickupAddress);
      
      // Update shop with coordinates if found
      if (pickupCoords) {
        await supabase
          .from('shops')
          .update({
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude
          })
          .eq('id', order.shop_id);
      }
    }

    // If customer doesn't have coordinates, geocode delivery address
    if (!deliveryCoords && deliveryAddress) {
      console.log('Geocoding delivery address:', deliveryAddress);
      deliveryCoords = await geocodeAddress(deliveryAddress);
      
      // Update customer with coordinates if found
      if (deliveryCoords && order.customer_id) {
        await supabase
          .from('users')
          .update({
            latitude: deliveryCoords.latitude,
            longitude: deliveryCoords.longitude
          })
          .eq('id', order.customer_id);
      }
    }

    // Update order with location coordinates
    if (pickupCoords || deliveryCoords) {
      const orderUpdateData: any = {};
      if (pickupCoords) {
        orderUpdateData.shop_latitude = pickupCoords.latitude;
        orderUpdateData.shop_longitude = pickupCoords.longitude;
      }
      if (deliveryCoords) {
        orderUpdateData.customer_latitude = deliveryCoords.latitude;
        orderUpdateData.customer_longitude = deliveryCoords.longitude;
      }
      
      await supabase
        .from('orders')
        .update(orderUpdateData)
        .eq('id', orderId);
    }

    // Check if delivery already exists
    const { data: existingDelivery } = await supabase
      .from('deliveries')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existingDelivery) {
      // Update existing delivery with location data
      const deliveryUpdateData: any = {};
      if (pickupCoords) {
        deliveryUpdateData.pickup_latitude = pickupCoords.latitude;
        deliveryUpdateData.pickup_longitude = pickupCoords.longitude;
        deliveryUpdateData.pickup_address = pickupAddress;
      }
      if (deliveryCoords) {
        deliveryUpdateData.delivery_latitude = deliveryCoords.latitude;
        deliveryUpdateData.delivery_longitude = deliveryCoords.longitude;
      }

      await supabase
        .from('deliveries')
        .update(deliveryUpdateData)
        .eq('id', existingDelivery.id);

      return NextResponse.json({
        success: true,
        message: 'Delivery updated with location data',
        delivery: existingDelivery,
        pickupLocation: pickupCoords,
        deliveryLocation: deliveryCoords
      });
    }

    // Create new delivery request
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert([{
        order_id: orderId,
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString(),
        delivery_address: deliveryAddress,
        delivery_phone: order.delivery_phone || order.customer?.phone,
        pickup_address: pickupAddress,
        pickup_latitude: pickupCoords?.latitude || null,
        pickup_longitude: pickupCoords?.longitude || null,
        delivery_latitude: deliveryCoords?.latitude || null,
        delivery_longitude: deliveryCoords?.longitude || null,
        notes: `Pickup from: ${pickupAddress} | Deliver to: ${deliveryAddress}`
      }])
      .select()
      .single();

    if (deliveryError) {
      console.error('Error creating delivery:', deliveryError);
      return NextResponse.json({
        success: false,
        error: deliveryError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery request created with location mapping',
      delivery,
      pickupLocation: pickupCoords,
      deliveryLocation: deliveryCoords
    });

  } catch (error: any) {
    console.error('Error accepting order and creating delivery:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

