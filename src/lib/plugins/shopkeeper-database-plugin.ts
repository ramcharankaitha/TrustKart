// Database Plugin for Shopkeeper Dashboard
// This plugin integrates directly into the existing shopkeeper dashboard

import { createClient } from '@supabase/supabase-js'

let supabase: any = null

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables not set')
    }
    
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}

export class ShopkeeperDatabasePlugin {
  // Register shop (for new shopkeepers)
  static async registerShop(shopData: {
    name: string;
    description: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    owner_id: string;
  }) {
    try {
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .insert([{
          name: shopData.name,
          description: shopData.description,
          address: shopData.address,
          phone: shopData.phone,
          email: shopData.email,
          website: shopData.website,
          status: 'PENDING',
          owner_id: shopData.owner_id
        }])
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, shop: shop }
    } catch (error) {
      return { success: false, error: 'Failed to register shop' }
    }
  }

  // Add product to shop
  static async addProduct(productData: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    category_id?: string;
    shop_id: string;
    image_url?: string;
    expiry_date?: string;
  }) {
    try {
      const { data: product, error } = await getSupabaseClient()
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          price: productData.price,
          quantity: productData.quantity,
          category_id: productData.category_id,
          shop_id: productData.shop_id,
          image_url: productData.image_url,
          expiry_date: productData.expiry_date,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, product: product }
    } catch (error) {
      return { success: false, error: 'Failed to add product' }
    }
  }

  // Update product
  static async updateProduct(productId: string, updateData: any) {
    try {
      const { data: product, error } = await getSupabaseClient()
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, product: product }
    } catch (error) {
      return { success: false, error: 'Failed to update product' }
    }
  }

  // Get shop products
  static async getShopProducts(shopId: string) {
    try {
      const { data: products, error } = await getSupabaseClient()
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message, products: [] }
      }

      return { success: true, products: products || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get products', products: [] }
    }
  }

  // Get shop orders
  static async getShopOrders(shopId: string) {
    try {
      const { data: orders, error } = await getSupabaseClient()
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

      if (error) {
        return { success: false, error: error.message, orders: [] }
      }

      return { success: true, orders: orders || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get orders', orders: [] }
    }
  }

  // Update order status
  static async updateOrderStatus(orderId: string, status: string) {
    try {
      const { data: order, error } = await getSupabaseClient()
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, order: order }
    } catch (error) {
      return { success: false, error: 'Failed to update order status' }
    }
  }

  // Get shop analytics
  static async getShopAnalytics(shopId: string) {
    try {
      // Get orders data
      const { data: orders } = await getSupabaseClient()
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('shop_id', shopId)

      // Get products data
      const { data: products } = await getSupabaseClient()
        .from('products')
        .select('id, name, total_sold, price, quantity')
        .eq('shop_id', shopId)

      // Get reviews data
      const { data: reviews } = await getSupabaseClient()
        .from('reviews')
        .select('rating')
        .eq('shop_id', shopId)

      // Calculate analytics
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const activeOrders = orders?.filter(order => 
        ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
      ).length || 0
      const totalProducts = products?.length || 0
      const lowStockProducts = products?.filter(p => p.quantity <= 5).length || 0

      return {
        success: true,
        analytics: {
          totalRevenue,
          activeOrders,
          totalProducts,
          lowStockProducts,
          totalReviews: reviews?.length || 0,
          averageRating: reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to get analytics' }
    }
  }

  // Get expiring products
  static async getExpiringProducts(shopId: string, days: number = 7) {
    try {
      const { data: products, error } = await getSupabaseClient()
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .lte('expiry_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
        .order('expiry_date', { ascending: true })

      if (error) {
        return { success: false, error: error.message, products: [] }
      }

      return { success: true, products: products || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get expiring products', products: [] }
    }
  }
}
