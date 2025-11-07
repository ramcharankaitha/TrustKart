// Database Plugin for Login Page
// This plugin integrates directly into the existing login page

import { createClient } from '@supabase/supabase-js'

let supabase: any = null

interface CreateUserData {
  email: string;
  name: string;
  role: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
}

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('🔍 Initializing Supabase client...');
    console.log('🔍 Supabase URL:', supabaseUrl);
    console.log('🔍 Supabase Key exists:', !!supabaseAnonKey);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Supabase environment variables not set')
    }
    
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client initialized');
  }
  return supabase
}

export class LoginDatabasePlugin {
  // Authenticate user and store session
  static async authenticateUser(email: string, password: string, role: string) {
    try {
      // For demo purposes, we'll create a simple authentication
      // In a real app, you'd use proper authentication
      const { data: user, error } = await getSupabaseClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role.toUpperCase())
        .single()

      if (error || !user) {
        return { success: false, error: 'Invalid credentials' }
      }

      // Password validation only for non-admin users
      if (role.toUpperCase() !== 'ADMIN') {
        if (user.password_hash) {
          const expectedPassword = `hashed_${password}`;
          if (user.password_hash !== expectedPassword) {
            return { success: false, error: 'Invalid password' }
          }
        }
      }
      // Admin users don't need password validation for demo purposes

      // SPECIAL CHECK: For shopkeepers, verify their shop is approved
      if (role.toUpperCase() === 'SHOPKEEPER') {
        const shopApproval = await this.isShopApproved(user.id);
        if (!shopApproval.approved) {
          return { 
            success: false, 
            error: 'Your shop registration is still pending approval. Please wait for admin approval before logging in.' 
          }
        }
        console.log('✅ Shopkeeper shop is approved:', shopApproval.shop);
      }

      // SPECIAL CHECK: For delivery agents, verify they are approved
      if (role.toUpperCase() === 'DELIVERY_AGENT') {
        const deliveryAgentApproval = await this.isDeliveryAgentApproved(user.id);
        if (!deliveryAgentApproval.approved) {
          return { 
            success: false, 
            error: 'Your delivery agent application is still pending approval. Please wait for admin approval before logging in.' 
          }
        }
        console.log('✅ Delivery agent is approved:', deliveryAgentApproval.deliveryAgent);
      }

      // Try to store user session in database (optional - don't fail if this doesn't work)
      try {
        const { data: session, error: sessionError } = await getSupabaseClient()
          .from('user_sessions')
          .upsert([{
            user_id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            login_time: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            is_active: true
          }], {
            onConflict: 'user_id'
          })
          .select()
          .single()

        if (sessionError) {
          console.warn('Session creation failed, but continuing with login:', sessionError.message)
        }
      } catch (sessionError) {
        console.warn('Session creation failed, but continuing with login:', sessionError)
      }

      // Store in sessionStorage for immediate access (this is the main session storage)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userSession', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          date_of_birth: user.date_of_birth,
          aadhaar_number: user.aadhaar_number,
          loginTime: new Date().toISOString()
        }))
      }

      return { success: true, user: user }
    } catch (error: any) {
      console.error('Authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  // Create new user account
  static async createUserAccount(userData: CreateUserData) {
    console.log('🚀 STARTING createUserAccount with data:', userData);
    
    try {
      console.log('🔍 Step 1: Creating user account with data:', userData);
      
      // First check if user already exists
      console.log('🔍 Step 2: Checking if user already exists...');
      const { data: existingUser, error: checkError } = await getSupabaseClient()
        .from('users')
        .select('id, email, role')
        .eq('email', userData.email)
        .single()

      console.log('✅ Step 2: Existing user check completed:', { existingUser, checkError });

      if (existingUser) {
        console.log('❌ User already exists');
        return { 
          success: false, 
          error: `An account with email ${userData.email} already exists. Please use a different email or try logging in.` 
        }
      }

      // Hash password properly
      console.log('🔍 Step 3: Importing bcryptjs...');
      const bcrypt = await import('bcryptjs');
      console.log('✅ Step 3: bcryptjs imported successfully');
      
      console.log('🔍 Step 4: Hashing password...');
      const passwordHash = await bcrypt.hash(userData.password, 10);
      console.log('✅ Step 4: Password hashed successfully');
      
      // Create user data object with all fields
      console.log('🔍 Step 5: Preparing user insert data...');
      const userInsertData: any = {
        email: userData.email,
        name: userData.name,
        role: userData.role.toUpperCase(),
        password_hash: passwordHash,
        is_active: true,
      };

      // Add optional fields if they exist
      if (userData.phone) {
        userInsertData.phone = userData.phone;
        console.log('🔍 Added phone to insert data');
      }
      if (userData.dateOfBirth) {
        userInsertData.date_of_birth = userData.dateOfBirth;
        console.log('🔍 Added date_of_birth to insert data');
      }
      if (userData.aadhaarNumber) {
        userInsertData.aadhaar_number = userData.aadhaarNumber;
        console.log('🔍 Added aadhaar_number to insert data');
      }

      console.log('✅ Step 5: User insert data prepared:', userInsertData);
      
      // Insert user into database
      console.log('🔍 Step 6: Getting Supabase client...');
      const supabaseClient = getSupabaseClient();
      console.log('✅ Step 6: Supabase client obtained');
      
      console.log('🔍 Step 7: Inserting user into database...');
      const { data: user, error } = await supabaseClient
        .from('users')
        .insert([userInsertData])
        .select()
        .single()

      console.log('✅ Step 7: Database insert completed');
      console.log('🔍 Step 7: Insert result:', { user, error });

      if (error) {
        console.error('❌ Database error:', error);
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error constructor:', error.constructor.name);
        console.error('❌ Error keys:', Object.keys(error));
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: error.status,
          statusText: error.statusText
        });
        console.error('❌ Full error object:', error);
        console.error('❌ Error stringified:', JSON.stringify(error, null, 2));
        
        // Handle specific database errors
        if (error.code === '23505') { // Unique constraint violation
          return { 
            success: false, 
            error: `An account with email ${userData.email} already exists. Please use a different email or try logging in.` 
          }
        }
        
        // Handle column doesn't exist error - try basic insert
        if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
          console.warn('⚠️ Some columns may not exist, trying basic insert...');
          
          const basicUserData = {
            email: userData.email,
            name: userData.name,
            role: userData.role.toUpperCase(),
            password_hash: passwordHash,
            is_active: true,
          };
          
          // Add phone if it exists
          if (userData.phone) {
            basicUserData.phone = userData.phone;
          }
          
          const { data: basicUser, error: basicError } = await getSupabaseClient()
            .from('users')
            .insert([basicUserData])
            .select()
            .single();
            
          if (basicError) {
            console.error('❌ Basic insert also failed:', basicError);
            return { success: false, error: `Database error: ${basicError.message}` };
          }
          
          console.log('✅ User created with basic fields:', basicUser);
          return { success: true, user: basicUser };
        }
        
        return { success: false, error: error.message || 'Failed to create user account' }
      }

      console.log('✅ User created successfully:', user);
      return { success: true, user: user }
    } catch (error: any) {
      console.error('❌ User creation error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error stringified:', JSON.stringify(error, null, 2));
      
      return { 
        success: false, 
        error: error?.message || error?.toString() || 'An unexpected error occurred during user creation.' 
      }
    }
  }

  // Register shop with comprehensive details - ALWAYS PENDING APPROVAL
  static async registerShop(shopData: {
    shopkeeperId: string;
    name: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    businessType?: string;
    description?: string;
    gstNumber?: string;
    panNumber?: string;
    shopLicenseNumber?: string;
  }) {
    try {
      console.log('🏪 Registering shop with PENDING status:', shopData);
      
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .insert([{
          owner_id: shopData.shopkeeperId,
          name: shopData.name,
          address: shopData.address,
          city: shopData.city,
          state: shopData.state,
          pincode: shopData.pincode,
          phone: shopData.phone,
          email: shopData.email,
          business_type: shopData.businessType,
          description: shopData.description,
          gst_number: shopData.gstNumber,
          pan_number: shopData.panNumber,
          shop_license_number: shopData.shopLicenseNumber,
          status: 'PENDING', // ALWAYS PENDING - requires admin approval
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Shop registration error:', error);
        return { success: false, error: error.message }
      }

      console.log('✅ Shop registered successfully with PENDING status:', shop);
      return { success: true, shop: shop }
    } catch (error: any) {
      console.error('Shop registration error:', error)
      return { success: false, error: error.message || 'An unexpected error occurred during shop registration.' }
    }
  }

  // Get all shop requests for admin (pending, approved, rejected)
  static async getAllShopRequests() {
    try {
      const { data: shops, error } = await getSupabaseClient()
        .from('shops')
        .select(`
          *,
          owner:users!shops_owner_id_fkey(name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all shops:', error);
        return { success: false, error: error.message }
      }

      return { success: true, shops: shops || [] }
    } catch (error: any) {
      console.error('Error fetching all shops:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all pending shop requests for admin
  static async getPendingShopRequests() {
    try {
      const { data: shops, error } = await getSupabaseClient()
        .from('shops')
        .select(`
          *,
          owner:users!shops_owner_id_fkey(name, email, phone)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending shops:', error);
        return { success: false, error: error.message }
      }

      return { success: true, shops: shops || [] }
    } catch (error: any) {
      console.error('Error fetching pending shops:', error)
      return { success: false, error: error.message }
    }
  }

  // Approve shop request
  static async approveShop(shopId: string, adminId: string) {
    try {
      console.log('✅ Approving shop:', shopId, 'by admin:', adminId);
      
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .update({
          status: 'APPROVED',
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error approving shop:', error);
        return { success: false, error: error.message }
      }

      console.log('✅ Shop approved successfully:', shop);
      return { success: true, shop: shop }
    } catch (error: any) {
      console.error('Error approving shop:', error)
      return { success: false, error: error.message }
    }
  }

  // Reject shop request
  static async rejectShop(shopId: string, adminId: string, reason: string) {
    try {
      console.log('❌ Rejecting shop:', shopId, 'by admin:', adminId, 'reason:', reason);
      
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .update({
          status: 'REJECTED',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error rejecting shop:', error);
        return { success: false, error: error.message }
      }

      console.log('✅ Shop rejected successfully:', shop);
      return { success: true, shop: shop }
    } catch (error: any) {
      console.error('Error rejecting shop:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if shopkeeper's shop is approved
  static async isShopApproved(shopkeeperId: string) {
    try {
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .select('id, status, name')
        .eq('owner_id', shopkeeperId)
        .eq('status', 'APPROVED')
        .single()

      if (error || !shop) {
        return { success: false, approved: false, error: 'No approved shop found' }
      }

      return { success: true, approved: true, shop: shop }
    } catch (error: any) {
      console.error('Error checking shop approval:', error)
      return { success: false, approved: false, error: error.message }
    }
  }

  // Check if delivery agent is approved
  static async isDeliveryAgentApproved(deliveryAgentId: string) {
    try {
      const { data: deliveryAgent, error } = await getSupabaseClient()
        .from('delivery_agents')
        .select('id, status, name')
        .eq('id', deliveryAgentId)
        .eq('status', 'APPROVED')
        .single()

      if (error || !deliveryAgent) {
        return { success: false, approved: false, error: 'No approved delivery agent found' }
      }

      return { success: true, approved: true, deliveryAgent: deliveryAgent }
    } catch (error: any) {
      console.error('Error checking delivery agent approval:', error)
      return { success: false, approved: false, error: error.message }
    }
  }

  // Get user session
  static async getCurrentUser() {
    try {
      const sessionData = sessionStorage.getItem('userSession')
      if (sessionData) {
        return JSON.parse(sessionData)
      }

      // If not in sessionStorage, try to get from database
      const { data: session, error } = await getSupabaseClient()
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('login_time', { ascending: false })
        .limit(1)
        .single()

      if (error || !session) {
        return null
      }

      const user = {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role
      }

      sessionStorage.setItem('userSession', JSON.stringify(user))
      return user
    } catch (error) {
      return null
    }
  }

  // Logout user
  static async logoutUser() {
    try {
      // Clear sessionStorage
      sessionStorage.removeItem('userSession')
      
      // Mark session as inactive in database
      const { error } = await getSupabaseClient()
        .from('user_sessions')
        .update({ is_active: false })
        .eq('is_active', true)

      if (error) {
        console.error('Failed to logout:', error)
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
}
