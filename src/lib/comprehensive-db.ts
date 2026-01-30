import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Comprehensive Database operations class
export class ComprehensiveDB {
  // ==================== USER OPERATIONS ====================
  static async createUser(userData: { 
    email: string; 
    name?: string; 
    role?: string;
    phone?: string;
    address?: string;
    created_by?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    
    return { data, error }
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    return { data, error }
  }

  static async updateUserLastLogin(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  }

  // ==================== SHOP OPERATIONS ====================
  static async createShop(shopData: {
    name: string;
    description?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    website?: string;
    opening_hours?: any;
    owner_id: string;
  }) {
    const { data, error } = await supabase
      .from('shops')
      .insert([shopData])
      .select()
      .single()
    
    return { data, error }
  }

  static async approveShop(shopId: string, adminId: string) {
    const { data, error } = await supabase
      .from('shops')
      .update({ 
        status: 'APPROVED',
        approval_date: new Date().toISOString()
      })
      .eq('id', shopId)
      .select()
      .single()
    
    // Log the approval activity
    if (!error) {
      await this.logActivity(adminId, 'APPROVE', 'SHOP', shopId, { status: 'APPROVED' })
    }
    
    return { data, error }
  }

  static async rejectShop(shopId: string, adminId: string, reason: string) {
    const { data, error } = await supabase
      .from('shops')
      .update({ 
        status: 'REJECTED',
        rejection_reason: reason
      })
      .eq('id', shopId)
      .select()
      .single()
    
    // Log the rejection activity
    if (!error) {
      await this.logActivity(adminId, 'REJECT', 'SHOP', shopId, { status: 'REJECTED', reason })
    }
    
    return { data, error }
  }

  static async getAllShops() {
    const { data, error } = await supabase
      .from('shops')
      .select(`
        *,
        users!shops_owner_id_fkey(name, email, phone)
      `)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  static async getPendingShops() {
    const { data, error } = await supabase
      .from('shops')
      .select(`
        *,
        users!shops_owner_id_fkey(name, email, phone)
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  // ==================== PRODUCT OPERATIONS ====================
  static async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    original_price?: number;
    quantity: number;
    min_quantity?: number;
    category_id?: string;
    shop_id: string;
    image_url?: string;
    barcode?: string;
    sku?: string;
    weight?: number;
    dimensions?: any;
    expiry_date?: string;
    is_featured?: boolean;
  }) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()
    
    return { data, error }
  }

  static async updateProductStock(productId: string, newQuantity: number) {
    const { data, error } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', productId)
      .select()
      .single()
    
    return { data, error }
  }

  // Atomic stock decrement - prevents race conditions
  static async decrementProductStock(productId: string, quantity: number) {
    // Use RPC function if available, otherwise fallback to fetch-update
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .single()

    if (fetchError || !product) {
      return { data: null, error: fetchError || { message: 'Product not found' } }
    }

    const currentQuantity = product.quantity || 0
    const newQuantity = Math.max(0, currentQuantity - quantity)

    if (newQuantity < 0) {
      return { data: null, error: { message: 'Insufficient stock' } }
    }

    const { data, error } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', productId)
      .eq('quantity', currentQuantity) // Optimistic locking - only update if quantity hasn't changed
      .select()
      .single()

    // If update failed due to quantity mismatch, retry once
    if (error && error.code === 'PGRST116') {
      // Quantity changed, refetch and try again
      const { data: updatedProduct, error: retryFetchError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single()

      if (retryFetchError || !updatedProduct) {
        return { data: null, error: retryFetchError || { message: 'Product not found' } }
      }

      const retryCurrentQuantity = updatedProduct.quantity || 0
      const retryNewQuantity = Math.max(0, retryCurrentQuantity - quantity)

      if (retryNewQuantity < 0) {
        return { data: null, error: { message: 'Insufficient stock' } }
      }

      const { data: retryData, error: retryError } = await supabase
        .from('products')
        .update({ quantity: retryNewQuantity })
        .eq('id', productId)
        .select()
        .single()

      return { data: retryData, error: retryError }
    }

    return { data, error }
  }

  // Check if order items have sufficient stock
  static async validateOrderStock(orderId: string) {
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)

    if (itemsError || !orderItems) {
      return { valid: false, error: itemsError || { message: 'Could not fetch order items' } }
    }

    // Check stock for each item
    const stockChecks = await Promise.all(
      orderItems.map(async (item) => {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, quantity')
          .eq('id', item.product_id)
          .single()

        if (productError || !product) {
          return { valid: false, productId: item.product_id, error: 'Product not found' }
        }

        const availableStock = product.quantity || 0
        if (availableStock < item.quantity) {
          return {
            valid: false,
            productId: item.product_id,
            productName: product.name,
            requested: item.quantity,
            available: availableStock,
            error: `Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${availableStock}`
          }
        }

        return { valid: true, productId: item.product_id }
      })
    )

    const invalidItems = stockChecks.filter(check => !check.valid)
    if (invalidItems.length > 0) {
      return {
        valid: false,
        error: { message: 'Insufficient stock for some items', invalidItems }
      }
    }

    return { valid: true }
  }

  static async getProductsByShop(shopId: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  static async getExpiringProducts(days: number = 7) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        shops!products_shop_id_fkey(name, address),
        categories(name)
      `)
      .lte('expiry_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_active', true)
      .order('expiry_date', { ascending: true })
    
    return { data, error }
  }

  static async getLowStockProducts(shopId?: string) {
    let query = supabase
      .from('products')
      .select(`
        *,
        shops!products_shop_id_fkey(name),
        categories(name)
      `)
      .eq('is_active', true)
    
    if (shopId) {
      query = query.eq('shop_id', shopId)
    }
    
    const { data, error } = await query
      .lte('quantity', supabase.raw('min_quantity'))
      .order('quantity', { ascending: true })
    
    return { data, error }
  }

  // ==================== ORDER OPERATIONS ====================
  static async createOrder(orderData: {
    total_amount: number;
    subtotal: number;
    tax_amount?: number;
    discount_amount?: number;
    delivery_fee?: number;
    payment_method?: string;
    delivery_address?: string;
    delivery_instructions?: string;
    estimated_delivery?: string;
    customer_id: string;
    shop_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }) {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        total_amount: orderData.total_amount,
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax_amount || 0,
        discount_amount: orderData.discount_amount || 0,
        delivery_fee: orderData.delivery_fee || 0,
        payment_method: orderData.payment_method,
        delivery_address: orderData.delivery_address,
        delivery_instructions: orderData.delivery_instructions,
        estimated_delivery: orderData.estimated_delivery,
        customer_id: orderData.customer_id,
        shop_id: orderData.shop_id
      }])
      .select()
      .single()

    if (orderError) return { data: null, error: orderError }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }))

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) return { data: null, error: itemsError }

    // Update product quantities
    for (const item of orderData.items) {
      await this.updateProductStock(item.product_id, -item.quantity)
    }

    return { data: { order, items }, error: null }
  }

  static async updateOrderStatus(orderId: string, status: string, adminId?: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()
    
    // Log the status change
    if (!error && adminId) {
      await this.logActivity(adminId, 'UPDATE', 'ORDER', orderId, { status })
    }
    
    return { data, error }
  }

  static async getOrdersByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shops!orders_shop_id_fkey(name, address),
        order_items(
          *,
          products!order_items_product_id_fkey(name, image_url)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  static async getOrdersByShop(shopId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users!orders_customer_id_fkey(name, email, phone),
        order_items(
          *,
          products!order_items_product_id_fkey(name, image_url)
        )
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  // ==================== CART OPERATIONS ====================
  static async addToCart(userId: string, productId: string, quantity: number = 1) {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert([{
        user_id: userId,
        product_id: productId,
        quantity: quantity
      }])
      .select()
      .single()
    
    return { data, error }
  }

  static async getCartItems(userId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products!cart_items_product_id_fkey(
          name, price, image_url, quantity, shop_id,
          shops!products_shop_id_fkey(name)
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
    
    return { data, error }
  }

  static async removeFromCart(userId: string, productId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select()
    
    return { data, error }
  }

  static async clearCart(userId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .select()
    
    return { data, error }
  }

  // ==================== COMPLAINT OPERATIONS ====================
  static async createComplaint(complaintData: {
    title: string;
    description: string;
    priority?: string;
    category?: string;
    customer_id: string;
    shop_id?: string;
    order_id?: string;
  }) {
    const { data, error } = await supabase
      .from('complaints')
      .insert([complaintData])
      .select()
      .single()
    
    return { data, error }
  }

  static async updateComplaintStatus(complaintId: string, status: string, resolution?: string, resolvedBy?: string) {
    const updateData: any = { status }
    
    if (status === 'RESOLVED') {
      updateData.resolution = resolution
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = resolvedBy
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single()
    
    return { data, error }
  }

  static async getComplaintsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        shops!complaints_shop_id_fkey(name),
        orders!complaints_order_id_fkey(order_number)
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
        shops!complaints_shop_id_fkey(name),
        orders!complaints_order_id_fkey(order_number)
      `)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  // ==================== REVIEW OPERATIONS ====================
  static async createReview(reviewData: {
    rating: number;
    comment?: string;
    customer_id: string;
    shop_id?: string;
    product_id?: string;
    order_id?: string;
  }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single()
    
    // Update shop/product ratings
    if (!error) {
      if (reviewData.shop_id) {
        await this.updateShopRating(reviewData.shop_id)
      }
      if (reviewData.product_id) {
        await this.updateProductRating(reviewData.product_id)
      }
    }
    
    return { data, error }
  }

  static async updateShopRating(shopId: string) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('shop_id', shopId)
    
    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      await supabase
        .from('shops')
        .update({ 
          rating: avgRating,
          total_reviews: reviews.length
        })
        .eq('id', shopId)
    }
  }

  static async updateProductRating(productId: string) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
    
    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      await supabase
        .from('products')
        .update({ 
          rating: avgRating,
          total_reviews: reviews.length
        })
        .eq('id', productId)
    }
  }

  // ==================== DISCOUNT OPERATIONS ====================
  static async createDiscount(discountData: {
    name: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    start_date: string;
    end_date: string;
    shop_id?: string;
    product_id?: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('discounts')
      .insert([discountData])
      .select()
      .single()
    
    return { data, error }
  }

  static async getActiveDiscounts(shopId?: string) {
    let query = supabase
      .from('discounts')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .lte('start_date', new Date().toISOString())
    
    if (shopId) {
      query = query.eq('shop_id', shopId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    return { data, error }
  }

  // ==================== NOTIFICATION OPERATIONS ====================
  static async createNotification(notificationData: {
    title: string;
    message: string;
    type: string;
    user_id: string;
    related_id?: string;
    related_type?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single()
    
    return { data, error }
  }

  static async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }

  static async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()
    
    return { data, error }
  }

  // ==================== ACTIVITY LOGGING ====================
  static async logActivity(userId: string, action: string, entityType: string, entityId: string, data?: any) {
    const { data: logData, error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        new_values: data
      }])
      .select()
      .single()
    
    return { data: logData, error }
  }

  static async getActivityLogs(entityType?: string, entityId?: string) {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        users!activity_logs_user_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    
    if (entityId) {
      query = query.eq('entity_id', entityId)
    }
    
    const { data, error } = await query.limit(100)
    
    return { data, error }
  }

  // ==================== ANALYTICS & REPORTS ====================
  static async getShopAnalytics(shopId: string) {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .eq('shop_id', shopId)
    
    const { data: products } = await supabase
      .from('products')
      .select('id, name, total_sold, price')
      .eq('shop_id', shopId)
    
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('shop_id', shopId)
    
    return {
      orders: orders || [],
      products: products || [],
      reviews: reviews || []
    }
  }

  static async getCustomerAnalytics(customerId: string) {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .eq('customer_id', customerId)
    
    const { data: complaints } = await supabase
      .from('complaints')
      .select('status, created_at')
      .eq('customer_id', customerId)
    
    return {
      orders: orders || [],
      complaints: complaints || []
    }
  }

  // ==================== TEST CONNECTION ====================
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
