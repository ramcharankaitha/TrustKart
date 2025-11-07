// Database Plugin for Admin Dashboard
// This plugin integrates directly into the existing admin dashboard

import { createClient } from '@supabase/supabase-js'

let supabase: any = null

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables not set:', {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseAnonKey ? 'Set' : 'Missing'
      })
      throw new Error('Supabase environment variables not set. Please check your .env file.')
    }
    
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}

export class AdminDatabasePlugin {
  // Get all pending shops for approval
  static async getPendingShops() {
    try {
      const { data: shops, error } = await getSupabaseClient()
        .from('shops')
        .select(`
          *,
          users!shops_owner_id_fkey(name, email, phone)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message, shops: [] }
      }

      return { success: true, shops: shops || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get pending shops', shops: [] }
    }
  }

  // Approve shop
  static async approveShop(shopId: string, adminId: string) {
    try {
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .update({ 
          status: 'APPROVED',
          approval_date: new Date().toISOString()
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the approval activity
      await getSupabaseClient()
        .from('activity_logs')
        .insert([{
          user_id: adminId,
          action: 'APPROVE',
          entity_type: 'SHOP',
          entity_id: shopId,
          new_values: { status: 'APPROVED' }
        }])

      return { success: true, shop: shop }
    } catch (error) {
      return { success: false, error: 'Failed to approve shop' }
    }
  }

  // Reject shop
  static async rejectShop(shopId: string, adminId: string, reason: string) {
    try {
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .update({ 
          status: 'REJECTED',
          rejection_reason: reason
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the rejection activity
      await getSupabaseClient()
        .from('activity_logs')
        .insert([{
          user_id: adminId,
          action: 'REJECT',
          entity_type: 'SHOP',
          entity_id: shopId,
          new_values: { status: 'REJECTED', reason }
        }])

      return { success: true, shop: shop }
    } catch (error) {
      return { success: false, error: 'Failed to reject shop' }
    }
  }

  // Get all shops
  static async getAllShops() {
    try {
      console.log('🔍 AdminDatabasePlugin: Getting all shops...')
      const supabaseClient = getSupabaseClient()
      
      const { data: shops, error } = await supabaseClient
        .from('shops')
        .select(`
          id,
          name,
          description,
          address,
          city,
          state,
          pincode,
          phone,
          email,
          business_type,
          status,
          rating,
          delivery_time_minutes,
          delivery_fee,
          image_url,
          image_hint,
          owner_id,
          registration_date,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching shops:', error)
        return { success: false, error: error.message, shops: [] }
      }

      console.log('✅ Successfully fetched shops:', shops?.length || 0)
      
      // Transform the data to match the Shop type
      const transformedShops = (shops || []).map(shop => ({
        id: shop.id,
        name: shop.name,
        description: shop.description || 'Quality products and fast delivery',
        address: shop.address || 'Address not available',
        city: shop.city || 'City not available',
        state: shop.state || 'State not available',
        pincode: shop.pincode || '000000',
        phone: shop.phone || 'Phone not available',
        email: shop.email || 'Email not available',
        status: shop.status?.toLowerCase() || 'pending',
        rating: shop.rating || 0,
        deliveryTime: shop.delivery_time_minutes ? `${shop.delivery_time_minutes} min` : '20-30 min',
        deliveryFee: shop.delivery_fee ? `₹${shop.delivery_fee}` : 'Free',
        imageUrl: shop.image_url || '/api/placeholder/300/200',
        imageHint: shop.image_hint || `${shop.name} storefront`,
        ownerId: shop.owner_id || 'unknown',
        location: shop.city || 'Unknown',
        businessType: shop.business_type || 'General',
        registrationDate: new Date(shop.registration_date || shop.created_at),
        documents: [],
        createdAt: new Date(shop.created_at),
        updatedAt: new Date(shop.updated_at)
      }))

      return { success: true, shops: transformedShops }
    } catch (error: any) {
      console.error('❌ Error fetching shops:', error)
      return { success: false, error: error.message || 'Failed to get shops', shops: [] }
    }
  }

  // Get all users
  static async getAllUsers() {
    try {
      const { data: users, error } = await getSupabaseClient()
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message, users: [] }
      }

      return { success: true, users: users || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get users', users: [] }
    }
  }

  // Get all complaints
  static async getAllComplaints() {
    try {
      const { data: complaints, error } = await getSupabaseClient()
        .from('complaints')
        .select(`
          *,
          users!complaints_customer_id_fkey(name, email),
          shops!complaints_shop_id_fkey(name),
          orders!complaints_order_id_fkey(order_number)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message, complaints: [] }
      }

      return { success: true, complaints: complaints || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get complaints', complaints: [] }
    }
  }

  // Update complaint status
  static async updateComplaintStatus(complaintId: string, status: string, resolution?: string, resolvedBy?: string) {
    try {
      const updateData: any = { status }
      
      if (status === 'RESOLVED') {
        updateData.resolution = resolution
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = resolvedBy
      }
      
      const { data: complaint, error } = await getSupabaseClient()
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, complaint: complaint }
    } catch (error) {
      return { success: false, error: 'Failed to update complaint status' }
    }
  }

  // Get all orders
  static async getAllOrders() {
    try {
      const { data: orders, error } = await getSupabaseClient()
        .from('orders')
        .select(`
          *,
          users!orders_customer_id_fkey(name, email),
          shops!orders_shop_id_fkey(name, address),
          order_items(
            *,
            products!order_items_product_id_fkey(name, image_url)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message, orders: [] }
      }

      return { success: true, orders: orders || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get orders', orders: [] }
    }
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    try {
      // Get counts for different entities
      const [usersResult, shopsResult, ordersResult, complaintsResult, productsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('shops').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('complaints').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' })
      ])

      // Get pending shops count
      const { count: pendingShops } = await getSupabaseClient()
        .from('shops')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING')

      // Get active orders count
      const { count: activeOrders } = await getSupabaseClient()
        .from('orders')
        .select('id', { count: 'exact' })
        .in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'])

      // Get open complaints count
      const { count: openComplaints } = await getSupabaseClient()
        .from('complaints')
        .select('id', { count: 'exact' })
        .in('status', ['OPEN', 'IN_PROGRESS'])

      return {
        success: true,
        stats: {
          totalUsers: usersResult.count || 0,
          totalShops: shopsResult.count || 0,
          totalOrders: ordersResult.count || 0,
          totalComplaints: complaintsResult.count || 0,
          totalProducts: productsResult.count || 0,
          pendingShops: pendingShops || 0,
          activeOrders: activeOrders || 0,
          openComplaints: openComplaints || 0
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to get dashboard stats' }
    }
  }

  // Suspend shop
  static async suspendShop(shopId: string, adminId: string, reason: string) {
    try {
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .update({ 
          status: 'SUSPENDED',
          rejection_reason: reason
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the suspension activity
      await getSupabaseClient()
        .from('activity_logs')
        .insert([{
          user_id: adminId,
          action: 'SUSPEND',
          entity_type: 'SHOP',
          entity_id: shopId,
          new_values: { status: 'SUSPENDED', reason }
        }])

      return { success: true, shop: shop }
    } catch (error) {
      return { success: false, error: 'Failed to suspend shop' }
    }
  }

  // Get activity logs
  static async getActivityLogs(limit: number = 50) {
    try {
      const { data: logs, error } = await getSupabaseClient()
        .from('activity_logs')
        .select(`
          *,
          users!activity_logs_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message, logs: [] }
      }

      return { success: true, logs: logs || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get activity logs', logs: [] }
    }
  }

  // ==============================================
  // DELIVERY AGENT MANAGEMENT METHODS
  // ==============================================

  // Get all delivery agents
  static async getAllDeliveryAgents() {
    try {
      console.log('🔍 AdminDatabasePlugin: Getting all delivery agents...')
      const supabaseClient = getSupabaseClient()
      
      const { data: deliveryAgents, error } = await supabaseClient
        .from('delivery_agents')
        .select(`
          id,
          email,
          name,
          phone,
          vehicle_type,
          vehicle_number,
          license_number,
          aadhaar_number,
          address,
          status,
          is_available,
          rating,
          total_deliveries,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching delivery agents:', error)
        return { success: false, error: error.message, deliveryAgents: [] }
      }

      console.log('✅ Successfully fetched delivery agents:', deliveryAgents?.length || 0)
      
      // Transform the data to match the expected format
      const transformedAgents = (deliveryAgents || []).map(agent => ({
        id: agent.id,
        email: agent.email,
        name: agent.name,
        phone: agent.phone,
        vehicleType: agent.vehicle_type,
        vehicleNumber: agent.vehicle_number,
        licenseNumber: agent.license_number,
        aadhaarNumber: agent.aadhaar_number,
        address: agent.address,
        status: agent.status?.toLowerCase() || 'pending',
        isAvailable: agent.is_available || false,
        rating: agent.rating || 0,
        totalDeliveries: agent.total_deliveries || 0,
        createdAt: new Date(agent.created_at),
        updatedAt: new Date(agent.updated_at)
      }))

      return { success: true, deliveryAgents: transformedAgents }
    } catch (error: any) {
      console.error('❌ Error fetching delivery agents:', error)
      return { success: false, error: error.message || 'Failed to get delivery agents', deliveryAgents: [] }
    }
  }

  // Get pending delivery agents
  static async getPendingDeliveryAgents() {
    try {
      const { data: deliveryAgents, error } = await getSupabaseClient()
        .from('delivery_agents')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message, deliveryAgents: [] }
      }

      return { success: true, deliveryAgents: deliveryAgents || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get pending delivery agents', deliveryAgents: [] }
    }
  }

  // Approve delivery agent
  static async approveDeliveryAgent(agentId: string, adminId: string) {
    try {
      const { data: agent, error } = await getSupabaseClient()
        .from('delivery_agents')
        .update({ 
          status: 'APPROVED',
          is_available: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the approval activity
      try {
        await getSupabaseClient()
          .from('activity_logs')
          .insert([{
            user_id: adminId,
            action: 'APPROVE',
            entity_type: 'DELIVERY_AGENT',
            entity_id: agentId,
            new_values: { status: 'APPROVED' }
          }])
      } catch (logError) {
        console.warn('Failed to log approval activity:', logError)
      }

      return { success: true, agent: agent }
    } catch (error) {
      return { success: false, error: 'Failed to approve delivery agent' }
    }
  }

  // Reject delivery agent
  static async rejectDeliveryAgent(agentId: string, adminId: string, reason: string) {
    try {
      const { data: agent, error } = await getSupabaseClient()
        .from('delivery_agents')
        .update({ 
          status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the rejection activity
      try {
        await getSupabaseClient()
          .from('activity_logs')
          .insert([{
            user_id: adminId,
            action: 'REJECT',
            entity_type: 'DELIVERY_AGENT',
            entity_id: agentId,
            new_values: { status: 'REJECTED', reason }
          }])
      } catch (logError) {
        console.warn('Failed to log rejection activity:', logError)
      }

      return { success: true, agent: agent }
    } catch (error) {
      return { success: false, error: 'Failed to reject delivery agent' }
    }
  }

  // Suspend delivery agent
  static async suspendDeliveryAgent(agentId: string, adminId: string, reason: string) {
    try {
      const { data: agent, error } = await getSupabaseClient()
        .from('delivery_agents')
        .update({ 
          status: 'SUSPENDED',
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the suspension activity
      try {
        await getSupabaseClient()
          .from('activity_logs')
          .insert([{
            user_id: adminId,
            action: 'SUSPEND',
            entity_type: 'DELIVERY_AGENT',
            entity_id: agentId,
            new_values: { status: 'SUSPENDED', reason }
          }])
      } catch (logError) {
        console.warn('Failed to log suspension activity:', logError)
      }

      return { success: true, agent: agent }
    } catch (error) {
      return { success: false, error: 'Failed to suspend delivery agent' }
    }
  }

  // Get delivery agent statistics
  static async getDeliveryAgentStats() {
    try {
      const supabaseClient = getSupabaseClient()
      
      // Get total delivery agents count
      const { count: totalAgents } = await supabaseClient
        .from('delivery_agents')
        .select('id', { count: 'exact' })

      // Get pending delivery agents count
      const { count: pendingAgents } = await supabaseClient
        .from('delivery_agents')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING')

      // Get approved delivery agents count
      const { count: approvedAgents } = await supabaseClient
        .from('delivery_agents')
        .select('id', { count: 'exact' })
        .eq('status', 'APPROVED')

      // Get rejected delivery agents count
      const { count: rejectedAgents } = await supabaseClient
        .from('delivery_agents')
        .select('id', { count: 'exact' })
        .eq('status', 'REJECTED')

      // Get suspended delivery agents count
      const { count: suspendedAgents } = await supabaseClient
        .from('delivery_agents')
        .select('id', { count: 'exact' })
        .eq('status', 'SUSPENDED')

      // Get available delivery agents count
      const { count: availableAgents } = await supabaseClient
        .from('delivery_agents')
        .select('id', { count: 'exact' })
        .eq('is_available', true)
        .eq('status', 'APPROVED')

      return {
        success: true,
        stats: {
          totalAgents: totalAgents || 0,
          pendingAgents: pendingAgents || 0,
          approvedAgents: approvedAgents || 0,
          rejectedAgents: rejectedAgents || 0,
          suspendedAgents: suspendedAgents || 0,
          availableAgents: availableAgents || 0
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to get delivery agent stats' }
    }
  }
}
