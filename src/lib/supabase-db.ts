import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are not set!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database operations using Supabase client
export class SupabaseDB {
  // User operations
  static async createUser(userData: { email: string; name?: string; role?: string }) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    
    return { data, error }
  }

  static async getUserByEmail(email: string) {
    try {
      console.log('🔍 SupabaseDB.getUserByEmail called with:', email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      
      console.log('🔍 SupabaseDB.getUserByEmail response:', { data, error });
      
      if (error) {
        console.error('❌ SupabaseDB.getUserByEmail error:', error);
      }
      
      return { data, error }
    } catch (err) {
      console.error('❌ SupabaseDB.getUserByEmail exception:', err);
      return { data: null, error: err }
    }
  }

  static async getUserById(userId: string) {
    try {
      console.log('🔍 SupabaseDB.getUserById called with:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('🔍 SupabaseDB.getUserById response:', { data, error });
      
      if (error) {
        console.error('❌ SupabaseDB.getUserById error:', error);
      }
      
      return { data, error }
    } catch (err) {
      console.error('❌ SupabaseDB.getUserById exception:', err);
      return { data: null, error: err }
    }
  }

  static async updateUser(userId: string, updateData: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  }

  static async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  // Shop operations
  static async createShop(shopData: {
    name: string;
    description?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    owner_id: string;
  }) {
    const { data, error } = await supabase
      .from('shops')
      .insert([shopData])
      .select()
      .single()
    
    return { data, error }
  }

  static async getShopsByOwner(ownerId: string) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  static async getAllShops() {
    const { data, error } = await supabase
      .from('shops')
      .select(`
        *,
        users!shops_owner_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  static async updateShopStatus(shopId: string, status: string) {
    const { data, error } = await supabase
      .from('shops')
      .update({ status: status })
      .eq('id', shopId)
      .select()
    
    return { data, error }
  }

  // Product operations
  static async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    category?: string;
    expiry_date?: string;
    shop_id: string;
    sku?: string;
    is_active?: boolean;
    unit?: string;
    brand?: string;
    image_url?: string;
  }) {
    console.log('🔍 SupabaseDB.createProduct called with:', productData)
    
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()
    
    console.log('🔍 SupabaseDB.createProduct result:', { data, error })
    
    return { data, error }
  }

  static async getProductsByShop(shopId: string) {
    try {
      console.log('🔍 SupabaseDB.getProductsByShop called with:', shopId);
      
      if (!shopId) {
        console.error('❌ getProductsByShop: shopId is required');
        return { data: null, error: { message: 'Shop ID is required' } };
      }

      // Try to get products - first without is_active filter in case column doesn't exist
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      // If error and might be due to missing is_active column, try without it
      if (error) {
        console.warn('⚠️ Initial query failed, retrying without is_active filter:', error);
        // Try with is_active filter if column exists
        const { data: dataWithFilter, error: errorWithFilter } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (!errorWithFilter) {
          return { data: dataWithFilter, error: null };
        }
        
        // If both fail, try simple query
        const { data: simpleData, error: simpleError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopId);

        if (!simpleError) {
          return { data: simpleData, error: null };
        }

        console.error('❌ getProductsByShop error:', error);
        return { data: null, error: error || simpleError };
      }

      console.log('✅ getProductsByShop success:', data?.length || 0, 'products');
      return { data, error: null };
    } catch (err: any) {
      console.error('❌ getProductsByShop exception:', err);
      return { data: null, error: err || { message: 'Failed to fetch products' } };
    }
  }

  static async testDatabaseConnection() {
    console.log('🔍 Testing database connection...')
    try {
      // Test 1: Check if we can access shops table
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, status')
        .limit(5)
      
      console.log('🔍 Shops test:', { shops: shops?.length || 0, error: shopsError?.message })
      
      // Test 2: Check if we can access products table
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, shop_id')
        .limit(5)
      
      console.log('🔍 Products test:', { products: products?.length || 0, error: productsError?.message })
      
      return {
        success: !shopsError && !productsError,
        shops: shops || [],
        products: products || [],
        errors: { shopsError, productsError }
      }
    } catch (error) {
      console.error('🔍 Database connection test failed:', error)
      return { success: false, error }
    }
  }

  static async getExpiringProducts(days: number = 7) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        shops!products_shop_id_fkey(name, address)
      `)
      .lte('expiry_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
      .order('expiry_date', { ascending: true })
    
    return { data, error }
  }

  // Order operations
  static async createOrder(orderData: {
    customer_id: string;
    shop_id: string;
    total_amount: number;
    subtotal?: number;
    delivery_address: string;
    delivery_phone: string;
    payment_method?: string;
    payment_status?: string;
    notes?: string;
    status: string;
    request_type?: string;
  }) {
    console.log('🔍 SupabaseDB.createOrder called with:', orderData);
    
    // Map the field names to match the database schema (snake_case)
    const mappedOrderData = {
      customer_id: orderData.customer_id,
      shop_id: orderData.shop_id,
      total_amount: orderData.total_amount,
      subtotal: orderData.subtotal || orderData.total_amount, // Use provided subtotal or fallback to total_amount
      delivery_address: orderData.delivery_address,
      delivery_phone: orderData.delivery_phone,
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status,
      notes: orderData.notes,
      status: orderData.status, // This will be a string like 'PENDING_APPROVAL'
      request_type: orderData.request_type
    };
    
    console.log('🔍 Mapped order data:', mappedOrderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([mappedOrderData])
      .select()
      .single();
    console.log('🔍 SupabaseDB.createOrder response:', { data, error });
    if (error) { 
      console.error('❌ SupabaseDB.createOrder error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
    return { data, error };
  }

  static async createOrderItem(orderItemData: {
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    approval_status?: string;
    rejection_reason?: string;
  }) {
    console.log('🔍 SupabaseDB.createOrderItem called with:', orderItemData);
    
    // Map the field names to match the database schema (snake_case)
    const mappedOrderItemData = {
      order_id: orderItemData.order_id,
      product_id: orderItemData.product_id,
      quantity: orderItemData.quantity,
      price: orderItemData.price,
      approval_status: orderItemData.approval_status,
      rejection_reason: orderItemData.rejection_reason
    };
    
    console.log('🔍 Mapped order item data:', mappedOrderItemData);
    
    const { data, error } = await supabase
      .from('order_items')
      .insert([mappedOrderItemData])
      .select()
      .single();
    console.log('🔍 SupabaseDB.createOrderItem response:', { data, error });
    if (error) { 
      console.error('❌ SupabaseDB.createOrderItem error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
    return { data, error };
  }

  // Legacy getOrdersByCustomer - removed duplicate, see implementation below

  static async getOrdersByShop(shopId: string) {
    console.log('🔍 SupabaseDB.getOrdersByShop called with:', shopId);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users(name, email, phone),
        order_items(
          *,
          product:products(name, price, image_url)
        )
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    console.log('🔍 SupabaseDB.getOrdersByShop response:', { data, error });
    if (error) { console.error('❌ SupabaseDB.getOrdersByShop error:', error); }
    return { data, error };
  }

  static async updateOrderStatus(orderId: string, status: string, notes?: string) {
    console.log('🔍 SupabaseDB.updateOrderStatus called with:', { orderId, status, notes });
    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();
    console.log('🔍 SupabaseDB.updateOrderStatus response:', { data, error });
    if (error) { console.error('❌ SupabaseDB.updateOrderStatus error:', error); }
    return { data, error };
  }

  static async cancelOrder(orderId: string, cancellationReason: string, cancelledBy?: string) {
    console.log('🔍 SupabaseDB.cancelOrder called with:', { orderId, cancellationReason, cancelledBy });
    const updateData: any = { 
      status: 'CANCELLED',
      cancellation_reason: cancellationReason,
      cancelled_at: new Date().toISOString()
    };
    if (cancelledBy) updateData.cancelled_by = cancelledBy;
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();
    console.log('🔍 SupabaseDB.cancelOrder response:', { data, error });
    if (error) { console.error('❌ SupabaseDB.cancelOrder error:', error); }
    return { data, error };
  }

  static async getOrderById(orderId: string) {
    console.log('🔍 SupabaseDB.getOrderById called with:', orderId);
    try {
      // Get order with customer and shop details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error('❌ SupabaseDB.getOrderById order error:', orderError);
        return { data: null, error: orderError };
      }

      // Get customer details
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('id', order.customer_id)
        .single();

      // Get shop details
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id, name, address, phone, email')
        .eq('id', order.shop_id)
        .single();

      // Get order items with product details
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(id, name, price, image_url)
        `)
        .eq('order_id', orderId);

      // Combine all data
      const orderData = {
        ...order,
        customer: customer || null,
        shop: shop || null,
        order_items: orderItems?.map((item: any) => ({
          ...item,
          product: item.products || null
        })) || []
      };

      return { data: orderData, error: null };
    } catch (err) {
      console.error('❌ SupabaseDB.getOrderById exception:', err);
      return { data: null, error: err };
    }
  }

  static async updateOrderItemApproval(orderItemId: string, approvalStatus: string, rejectionReason?: string) {
    console.log('🔍 SupabaseDB.updateOrderItemApproval called with:', { orderItemId, approvalStatus, rejectionReason });
    const updateData: any = { approval_status: approvalStatus };
    if (rejectionReason) updateData.rejection_reason = rejectionReason;
    
    const { data, error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', orderItemId)
      .select()
      .single();
    console.log('🔍 SupabaseDB.updateOrderItemApproval response:', { data, error });
    if (error) { console.error('❌ SupabaseDB.updateOrderItemApproval error:', error); }
    return { data, error };
  }

  static async updateAllOrderItemsApproval(orderId: string, approvalStatus: string, rejectionReason?: string) {
    console.log('🔍 SupabaseDB.updateAllOrderItemsApproval called with:', { orderId, approvalStatus, rejectionReason });
    const updateData: any = { approval_status: approvalStatus };
    if (rejectionReason) updateData.rejection_reason = rejectionReason;
    
    const { data, error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('order_id', orderId)
      .select();
    console.log('🔍 SupabaseDB.updateAllOrderItemsApproval response:', { data, error });
    if (error) { console.error('❌ SupabaseDB.updateAllOrderItemsApproval error:', error); }
    return { data, error };
  }

  // Complaint operations
  static async createComplaint(complaintData: {
    title: string;
    description: string;
    priority?: string;
    customer_id: string;
    shop_id?: string;
  }) {
    const { data, error } = await supabase
      .from('complaints')
      .insert([complaintData])
      .select()
      .single()
    
    return { data, error }
  }

  static async getComplaintsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        shops!complaints_shop_id_fkey(name)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  static async getAllComplaints() {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        users!complaints_customer_id_fkey(name, email),
        shops!complaints_shop_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  // Order Management Methods
  static async createOrder(orderData: {
    customer_id: string;
    shop_id: string;
    total_amount: number;
    subtotal?: number;
    delivery_address: string;
    delivery_phone: string;
    payment_method?: string;
    payment_status?: string;
    notes?: string;
    status: string;
    request_type?: string;
  }) {
    console.log('🔍 SupabaseDB.createOrder called with:', orderData);
    
    try {
      // Map the field names to match the database schema (snake_case)
      const mappedOrderData = {
        customer_id: orderData.customer_id,
        shop_id: orderData.shop_id,
        total_amount: orderData.total_amount,
        subtotal: orderData.subtotal || orderData.total_amount, // Ensure subtotal is never null
        delivery_address: orderData.delivery_address,
        delivery_phone: orderData.delivery_phone,
        payment_method: orderData.payment_method || null,
        payment_status: orderData.payment_status || null,
        notes: orderData.notes || null,
        status: orderData.status || 'PENDING', // Ensure status is never null
        request_type: orderData.request_type || null
      };
      
      console.log('🔍 Mapped order data:', mappedOrderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert([mappedOrderData])
        .select()
        .single();
      console.log('🔍 SupabaseDB.createOrder response:', { data, error });
      if (error) { 
        console.error('❌ SupabaseDB.createOrder error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
      return { data, error };
    } catch (err) {
      console.error('❌ SupabaseDB.createOrder exception:', err);
      return { data: null, error: err };
    }
  }

  static async createOrderItem(orderItemData: {
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    approval_status?: string;
    rejection_reason?: string;
  }) {
    console.log('🔍 SupabaseDB.createOrderItem called with:', orderItemData);
    
    try {
      // Map the field names to match the database schema (snake_case)
      const mappedOrderItemData = {
        order_id: orderItemData.order_id,
        product_id: orderItemData.product_id,
        quantity: orderItemData.quantity,
        price: orderItemData.price,
        approval_status: orderItemData.approval_status,
        rejection_reason: orderItemData.rejection_reason
      };
      
      console.log('🔍 Mapped order item data:', mappedOrderItemData);
      
      const { data, error } = await supabase
        .from('order_items')
        .insert([mappedOrderItemData])
        .select()
        .single();
      console.log('🔍 SupabaseDB.createOrderItem response:', { data, error });
      if (error) { 
        console.error('❌ SupabaseDB.createOrderItem error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
      return { data, error };
    } catch (err) {
      console.error('❌ SupabaseDB.createOrderItem exception:', err);
      return { data: null, error: err };
    }
  }

  static async getOrdersByShop(shopId: string) {
    console.log('🔍 SupabaseDB.getOrdersByShop called with:', shopId);
    try {
      // First, try to get orders without foreign key relationships
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      console.log('🔍 Orders query result:', { orders, ordersError });
      
      if (ordersError) {
        console.error('❌ SupabaseDB.getOrdersByShop orders error:', ordersError);
        return { data: null, error: ordersError };
      }

      if (!orders || orders.length === 0) {
        console.log('✅ No orders found for shop:', shopId);
        return { data: [], error: null };
      }

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          
          if (itemsError) {
            console.error('❌ Error fetching order items for order:', order.id, itemsError);
            return { ...order, order_items: [] };
          }

          // Get product details for each item
          const itemsWithProducts = await Promise.all(
            (orderItems || []).map(async (item) => {
              const { data: product, error: productError } = await supabase
                .from('products')
                .select('name, price, image_url')
                .eq('id', item.product_id)
                .single();
              
              if (productError) {
                console.error('❌ Error fetching product for item:', item.id, productError);
                return {
                  ...item,
                  product: { name: 'Unknown Product', price: item.price, image_url: null }
                };
              }

              return {
                ...item,
                product: product || { name: 'Unknown Product', price: item.price, image_url: null }
              };
            })
          );

          return { ...order, order_items: itemsWithProducts };
        })
      );

      // Get customer details for each order
      const ordersWithCustomers = await Promise.all(
        ordersWithItems.map(async (order) => {
          const { data: customer, error: customerError } = await supabase
            .from('users')
            .select('name, email, phone')
            .eq('id', order.customer_id)
            .single();
          
          if (customerError) {
            console.error('❌ Error fetching customer for order:', order.id, customerError);
            return {
              ...order,
              customer: { name: 'Unknown Customer', email: '', phone: '' }
            };
          }

          return {
            ...order,
            customer: customer || { name: 'Unknown Customer', email: '', phone: '' }
          };
        })
      );

      console.log('✅ SupabaseDB.getOrdersByShop success:', ordersWithCustomers);
      return { data: ordersWithCustomers, error: null };
      
    } catch (err) {
      console.error('❌ SupabaseDB.getOrdersByShop exception:', err);
      return { data: null, error: err };
    }
  }

  static async getOrdersByCustomer(customerId: string) {
    console.log('🔍 SupabaseDB.getOrdersByCustomer called with:', customerId);
    try {
      // Validate Supabase is configured
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
        console.error('❌ Supabase not properly configured');
        return { data: null, error: { message: 'Database not configured' } };
      }

      // Validate customerId
      if (!customerId || typeof customerId !== 'string') {
        console.error('❌ Invalid customerId:', customerId);
        return { data: null, error: { message: 'Invalid customer ID' } };
      }

      // Get orders for this customer
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      console.log('🔍 Customer orders query result:', { 
        ordersCount: orders?.length || 0, 
        hasError: !!ordersError,
        errorDetails: ordersError ? {
          message: ordersError.message,
          details: ordersError.details,
          hint: ordersError.hint,
          code: ordersError.code
        } : null
      });
      
      if (ordersError) {
        // Create a proper error object with all available details
        // Handle case where error might be an empty object or have no properties
        const errorMessage = ordersError?.message || 
                            ordersError?.details || 
                            ordersError?.hint || 
                            (typeof ordersError === 'string' ? ordersError : 'Database query failed');
        
        const errorObj = {
          message: errorMessage,
          details: ordersError?.details || null,
          hint: ordersError?.hint || null,
          code: ordersError?.code || null,
          ...(typeof ordersError === 'object' && ordersError !== null ? ordersError : {})
        };
        
        // Only log if we have meaningful error information
        if (errorMessage !== 'Database query failed' || Object.keys(errorObj).length > 1) {
          console.error('❌ SupabaseDB.getOrdersByCustomer orders error:', errorObj);
        } else {
          // Silent fail for empty errors to reduce console noise
          console.warn('⚠️ SupabaseDB.getOrdersByCustomer: Query returned error (empty error object)');
        }
        
        return { data: null, error: errorObj };
      }

      if (!orders || orders.length === 0) {
        console.log('✅ No orders found for customer:', customerId);
        return { data: [], error: null };
      }

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          
          if (itemsError) {
            console.error('❌ Error fetching order items for order:', order.id, itemsError);
            return { ...order, order_items: [] };
          }

          // Get product details for each item
          const itemsWithProducts = await Promise.all(
            (orderItems || []).map(async (item) => {
              const { data: product, error: productError } = await supabase
                .from('products')
                .select('name, price, image_url')
                .eq('id', item.product_id)
                .single();
              
              if (productError) {
                console.error('❌ Error fetching product for item:', item.id, productError);
                return {
                  ...item,
                  product: { name: 'Unknown Product', price: item.price, image_url: null }
                };
              }

              return {
                ...item,
                product: product || { name: 'Unknown Product', price: item.price, image_url: null }
              };
            })
          );

          return { ...order, order_items: itemsWithProducts };
        })
      );

      // Get customer details for each order
      const ordersWithCustomers = await Promise.all(
        ordersWithItems.map(async (order) => {
          const { data: customer, error: customerError } = await supabase
            .from('users')
            .select('name, email, phone')
            .eq('id', order.customer_id)
            .single();
          
          if (customerError) {
            console.error('❌ Error fetching customer for order:', order.id, customerError);
            return {
              ...order,
              customer: { name: 'Unknown Customer', email: '', phone: '' }
            };
          }

          return {
            ...order,
            customer: customer || { name: 'Unknown Customer', email: '', phone: '' }
          };
        })
      );

      console.log('✅ SupabaseDB.getOrdersByCustomer success:', ordersWithCustomers.length, 'orders');
      return { data: ordersWithCustomers, error: null };
      
    } catch (err: any) {
      // Create a proper error object
      const errorObj = {
        message: err?.message || 'Unknown error occurred',
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
        name: err?.name || 'Error',
        stack: err?.stack || null,
        ...err
      };
      console.error('❌ SupabaseDB.getOrdersByCustomer exception:', errorObj);
      return { data: null, error: errorObj };
    }
  }

  static async updateOrderStatus(orderId: string, status: string, notes?: string) {
    console.log('🔍 SupabaseDB.updateOrderStatus called with:', { orderId, status, notes });
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      if (notes) updateData.notes = notes;
      
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();
      console.log('🔍 SupabaseDB.updateOrderStatus response:', { data, error });
      if (error) { 
        console.error('❌ SupabaseDB.updateOrderStatus error:', error); 
        return { data: null, error };
      }
      
      // Verify the update was successful by fetching the order again
      if (data) {
        console.log('✅ Order status updated successfully:', { orderId, status: data.status });
      }
      
      return { data, error };
    } catch (err) {
      console.error('❌ SupabaseDB.updateOrderStatus exception:', err);
      return { data: null, error: err };
    }
  }

  static async getOrderById(orderId: string) {
    console.log('🔍 SupabaseDB.getOrderById called with:', orderId);
    try {
      // Get the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      console.log('🔍 Order query result:', { order, orderError });
      
      if (orderError) {
        console.error('❌ SupabaseDB.getOrderById order error:', orderError);
        return { data: null, error: orderError };
      }

      if (!order) {
        console.log('❌ Order not found:', orderId);
        return { data: null, error: { message: 'Order not found' } };
      }

      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (itemsError) {
        console.error('❌ Error fetching order items:', itemsError);
        return { data: null, error: itemsError };
      }

      // Get product details for each item
      const itemsWithProducts = await Promise.all(
        (orderItems || []).map(async (item) => {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('name, price, image_url, description')
            .eq('id', item.product_id)
            .single();
          
          if (productError) {
            console.error('❌ Error fetching product for item:', item.id, productError);
            return {
              ...item,
              product: { name: 'Unknown Product', price: item.price, image_url: null, description: '' }
            };
          }

          return {
            ...item,
            product: product || { name: 'Unknown Product', price: item.price, image_url: null, description: '' }
          };
        })
      );

      // Get customer details
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', order.customer_id)
        .single();
      
      if (customerError) {
        console.error('❌ Error fetching customer:', customerError);
        return { data: null, error: customerError };
      }

      // Get shop details
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('name, address, phone')
        .eq('id', order.shop_id)
        .single();
      
      if (shopError) {
        console.error('❌ Error fetching shop:', shopError);
        return { data: null, error: shopError };
      }

      const orderWithDetails = {
        ...order,
        order_items: itemsWithProducts,
        customer: customer || { name: 'Unknown Customer', email: '', phone: '' },
        shop: shop || { name: 'Unknown Shop', address: '', phone: '' }
      };

      console.log('✅ SupabaseDB.getOrderById success:', orderWithDetails);
      return { data: orderWithDetails, error: null };
      
    } catch (err) {
      console.error('❌ SupabaseDB.getOrderById exception:', err);
      return { data: null, error: err };
    }
  }

  static async updateOrderItemApproval(orderItemId: string, approvalStatus: string, rejectionReason?: string) {
    console.log('🔍 SupabaseDB.updateOrderItemApproval called with:', { orderItemId, approvalStatus, rejectionReason });
    try {
      const updateData: any = { approval_status: approvalStatus };
      if (rejectionReason) updateData.rejection_reason = rejectionReason;
      
      const { data, error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', orderItemId)
        .select()
        .single();
      console.log('🔍 SupabaseDB.updateOrderItemApproval response:', { data, error });
      if (error) { console.error('❌ SupabaseDB.updateOrderItemApproval error:', error); }
      return { data, error };
    } catch (err) {
      console.error('❌ SupabaseDB.updateOrderItemApproval exception:', err);
      return { data: null, error: err };
    }
  }

  static async updateAllOrderItemsApproval(orderId: string, approvalStatus: string, rejectionReason?: string) {
    console.log('🔍 SupabaseDB.updateAllOrderItemsApproval called with:', { orderId, approvalStatus, rejectionReason });
    try {
      const updateData: any = { approval_status: approvalStatus };
      if (rejectionReason) updateData.rejection_reason = rejectionReason;
      
      const { data, error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('order_id', orderId)
        .select();
      console.log('🔍 SupabaseDB.updateAllOrderItemsApproval response:', { data, error });
      if (error) { console.error('❌ SupabaseDB.updateAllOrderItemsApproval error:', error); }
      return { data, error };
    } catch (err) {
      console.error('❌ SupabaseDB.updateAllOrderItemsApproval exception:', err);
      return { data: null, error: err };
    }
  }

  // Test connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      return { success: !error, error }
    } catch (error) {
      return { success: false, error }
    }
  }
}
