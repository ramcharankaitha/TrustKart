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
      
      // First try to get shops with all columns
      // If that fails due to missing columns, fall back to basic columns
      let shops: any[] = []
      let error: any = null
      
      // Try full query first
      const fullQuery = await supabaseClient
        .from('shops')
        .select(`
          id,
          name,
          description,
          address,
          city,
          state,
          pincode,
          latitude,
          longitude,
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
          approval_date,
          rejection_reason,
          approved_by,
          rejected_by,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (fullQuery.error) {
        console.warn('⚠️ Full query failed, trying basic columns:', fullQuery.error.message)
        
        // Fallback to basic columns that definitely exist
        const basicQuery = await supabaseClient
          .from('shops')
          .select(`
            id,
            name,
            description,
            address,
            latitude,
            longitude,
            phone,
            email,
            status,
            owner_id,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
        
        if (basicQuery.error) {
          console.error('❌ Error fetching shops (basic query also failed):', basicQuery.error)
          console.error('Error details:', basicQuery.error.details, basicQuery.error.hint, basicQuery.error.code)
          return { 
            success: false, 
            error: `Database error: ${basicQuery.error.message}. Please run ADD-SHOPS-MISSING-COLUMNS.sql script in Supabase.`,
            shops: [] 
          }
        }
        
        shops = basicQuery.data || []
        error = null
      } else {
        shops = fullQuery.data || []
        error = null
      }

      if (error) {
        console.error('❌ Error fetching shops:', error)
        console.error('Error details:', error.details, error.hint, error.code)
        return { success: false, error: error.message, shops: [] }
      }

      console.log('✅ Successfully fetched shops:', shops?.length || 0)
      
      // Transform the data to match the Shop type
      const transformedShops = (shops || []).map(shop => {
        // Use actual column values or extract from address as fallback
        const city = shop.city || (shop.address ? shop.address.split(',')[shop.address.split(',').length - 2]?.trim() : null) || 'Unknown'
        const state = shop.state || (shop.address ? shop.address.split(',')[shop.address.split(',').length - 1]?.trim() : null) || 'Unknown'
        const pincode = shop.pincode || '000000'
        
        return {
          id: shop.id,
          name: shop.name,
          description: shop.description || 'Quality products and fast delivery',
          address: shop.address || 'Address not available',
          city: city,
          state: state,
          pincode: pincode,
          phone: shop.phone || 'Phone not available',
          email: shop.email || 'Email not available',
          status: shop.status?.toLowerCase() || 'pending',
          rating: shop.rating || 0,
          deliveryTime: shop.delivery_time_minutes ? `${shop.delivery_time_minutes} min` : '20-30 min',
          deliveryFee: shop.delivery_fee ? `₹${shop.delivery_fee}` : 'Free',
          imageUrl: shop.image_url || '/api/placeholder/300/200',
          imageHint: shop.image_hint || `${shop.name} storefront`,
          ownerId: shop.owner_id || 'unknown',
          location: city,
          businessType: shop.business_type || 'General',
          registrationDate: new Date(shop.registration_date || shop.created_at),
          approvalDate: shop.approval_date ? new Date(shop.approval_date) : undefined,
          documents: [],
          createdAt: new Date(shop.created_at),
          updatedAt: new Date(shop.updated_at)
        };
      })

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

  // ==============================================
  // FARMER MANAGEMENT METHODS
  // ==============================================

  // Get all farmers
  static async getAllFarmers() {
    try {
      console.log('🔍 AdminDatabasePlugin: Getting all farmers...')
      const supabaseClient = getSupabaseClient()
      
      // First, try a simple query to check if table exists
      const { data: testData, error: testError } = await supabaseClient
        .from('farmers')
        .select('id')
        .limit(1)
      
      if (testError) {
        console.error('❌ Farmers table error:', testError)
        console.error('Error code:', testError.code)
        console.error('Error details:', testError.details)
        console.error('Error hint:', testError.hint)
        return { 
          success: false, 
          error: `Database error: ${testError.message}. Code: ${testError.code}. Hint: ${testError.hint || 'Check if farmers table exists'}`,
          farmers: [] 
        }
      }
      
      const { data: farmers, error } = await supabaseClient
        .from('farmers')
        .select(`
          id,
          name,
          email,
          phone,
          aadhaar_number,
          address,
          city,
          state,
          pincode,
          latitude,
          longitude,
          farm_name,
          farm_address,
          farm_size,
          crops_grown,
          organic_certification,
          status,
          is_active,
          rating,
          total_vegetables_submitted,
          total_vegetables_approved,
          rejection_reason,
          reviewed_by,
          reviewed_at,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching farmers:', error)
        console.error('Error code:', error.code)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        return { 
          success: false, 
          error: `Query error: ${error.message}. Code: ${error.code}`,
          farmers: [] 
        }
      }

      console.log('✅ Successfully fetched farmers:', farmers?.length || 0)
      console.log('📊 Farmers data sample:', farmers?.slice(0, 2))
      
      // Transform the data to match the expected format
      const transformedFarmers = (farmers || []).map(farmer => {
        // Normalize status to uppercase
        const normalizedStatus = farmer.status 
          ? farmer.status.toUpperCase() 
          : 'PENDING';
        
        return {
          id: farmer.id,
          name: farmer.name,
          email: farmer.email,
          phone: farmer.phone,
          aadhaarNumber: farmer.aadhaar_number,
          address: farmer.address,
          city: farmer.city,
          state: farmer.state,
          pincode: farmer.pincode,
          latitude: farmer.latitude,
          longitude: farmer.longitude,
          farmName: farmer.farm_name,
          farmAddress: farmer.farm_address,
          farmSize: farmer.farm_size,
          cropsGrown: farmer.crops_grown || [],
          organicCertification: farmer.organic_certification,
          status: normalizedStatus,
          isActive: farmer.is_active || false,
          rating: farmer.rating || 0,
          totalVegetablesSubmitted: farmer.total_vegetables_submitted || 0,
          totalVegetablesApproved: farmer.total_vegetables_approved || 0,
          rejectionReason: farmer.rejection_reason,
          reviewedBy: farmer.reviewed_by,
          reviewedAt: farmer.reviewed_at ? new Date(farmer.reviewed_at) : null,
          createdAt: new Date(farmer.created_at),
          updatedAt: new Date(farmer.updated_at)
        };
      })

      return { success: true, farmers: transformedFarmers }
    } catch (error: any) {
      console.error('❌ Error fetching farmers:', error)
      return { success: false, error: error.message || 'Failed to get farmers', farmers: [] }
    }
  }

  // Get pending farmers
  static async getPendingFarmers() {
    try {
      const { data: farmers, error } = await getSupabaseClient()
        .from('farmers')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message, farmers: [] }
      }

      return { success: true, farmers: farmers || [] }
    } catch (error) {
      return { success: false, error: 'Failed to get pending farmers', farmers: [] }
    }
  }

  // Approve farmer
  static async approveFarmer(farmerId: string, adminId: string) {
    try {
      const { data: farmer, error } = await getSupabaseClient()
        .from('farmers')
        .update({ 
          status: 'APPROVED',
          is_active: true,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', farmerId)
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
            entity_type: 'FARMER',
            entity_id: farmerId,
            new_values: { status: 'APPROVED' }
          }])
      } catch (logError) {
        console.warn('Failed to log approval activity:', logError)
      }

      return { success: true, farmer: farmer }
    } catch (error) {
      return { success: false, error: 'Failed to approve farmer' }
    }
  }

  // Reject farmer
  static async rejectFarmer(farmerId: string, adminId: string, reason: string) {
    try {
      const { data: farmer, error } = await getSupabaseClient()
        .from('farmers')
        .update({ 
          status: 'REJECTED',
          is_active: false,
          rejection_reason: reason,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', farmerId)
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
            entity_type: 'FARMER',
            entity_id: farmerId,
            new_values: { status: 'REJECTED', reason }
          }])
      } catch (logError) {
        console.warn('Failed to log rejection activity:', logError)
      }

      return { success: true, farmer: farmer }
    } catch (error) {
      return { success: false, error: 'Failed to reject farmer' }
    }
  }

  // Suspend farmer
  static async suspendFarmer(farmerId: string, adminId: string, reason: string) {
    try {
      const { data: farmer, error } = await getSupabaseClient()
        .from('farmers')
        .update({ 
          status: 'SUSPENDED',
          is_active: false,
          rejection_reason: reason,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', farmerId)
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
            entity_type: 'FARMER',
            entity_id: farmerId,
            new_values: { status: 'SUSPENDED', reason }
          }])
      } catch (logError) {
        console.warn('Failed to log suspension activity:', logError)
      }

      return { success: true, farmer: farmer }
    } catch (error) {
      return { success: false, error: 'Failed to suspend farmer' }
    }
  }

  // Get farmer statistics
  static async getFarmerStats() {
    try {
      const supabaseClient = getSupabaseClient()
      
      // Get total farmers count
      const { count: totalFarmers } = await supabaseClient
        .from('farmers')
        .select('id', { count: 'exact' })

      // Get pending farmers count
      const { count: pendingFarmers } = await supabaseClient
        .from('farmers')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING')

      // Get approved farmers count
      const { count: approvedFarmers } = await supabaseClient
        .from('farmers')
        .select('id', { count: 'exact' })
        .eq('status', 'APPROVED')

      // Get rejected farmers count
      const { count: rejectedFarmers } = await supabaseClient
        .from('farmers')
        .select('id', { count: 'exact' })
        .eq('status', 'REJECTED')

      // Get suspended farmers count
      const { count: suspendedFarmers } = await supabaseClient
        .from('farmers')
        .select('id', { count: 'exact' })
        .eq('status', 'SUSPENDED')

      // Get active farmers count
      const { count: activeFarmers } = await supabaseClient
        .from('farmers')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('status', 'APPROVED')

      return {
        success: true,
        stats: {
          totalFarmers: totalFarmers || 0,
          pendingFarmers: pendingFarmers || 0,
          approvedFarmers: approvedFarmers || 0,
          rejectedFarmers: rejectedFarmers || 0,
          suspendedFarmers: suspendedFarmers || 0,
          activeFarmers: activeFarmers || 0
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to get farmer stats' }
    }
  }
}
