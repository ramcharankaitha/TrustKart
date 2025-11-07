// Enhanced Database Plugin for Login and Registration
// This plugin provides robust database operations with fallback mechanisms

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

let supabase: any = null

interface CreateUserData {
  email: string;
  name: string;
  role: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface ShopRegistrationData {
  ownerName: string;
  shopName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  aadhaarNumber: string;
  businessType: string;
  description: string;
  password: string;
  latitude?: number;
  longitude?: number;
}

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
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
  // Test database connections
  static async testConnections() {
    const results: any = {}
    
    // Test Prisma
    try {
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1`
      results.prisma = true
      console.log('✅ Prisma connection successful')
    } catch (error) {
      results.prisma = false
      results.prismaError = error
      console.error('❌ Prisma connection failed:', error)
    }

    // Test Supabase
    try {
      const client = getSupabaseClient()
      const { data, error } = await client.from('users').select('count').limit(1)
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      results.supabase = true
      console.log('✅ Supabase connection successful')
    } catch (error) {
      results.supabase = false
      results.supabaseError = error
      console.error('❌ Supabase connection failed:', error)
    }

    return results
  }

  // Authenticate user with fallback mechanisms
  static async authenticateUser(email: string, password: string, role: string) {
    try {
      console.log(`🔍 Authenticating user: ${email}, role: ${role}`)
      
      // Try Prisma first
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          include: { shops: true }
        })

        if (user && user.role === role.toUpperCase()) {
          // Simple password check (in production, use proper hashing)
          if (user.password === password || !user.password) {
            console.log('✅ User authenticated via Prisma')
            return { success: true, user }
          }
        }
      } catch (prismaError) {
        console.warn('Prisma authentication failed, trying Supabase:', prismaError)
      }

      // Fallback to Supabase
      const { data: user, error } = await getSupabaseClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role.toUpperCase())
        .single()

      if (error || !user) {
        return { success: false, error: 'Invalid credentials' }
      }

      // Simple password validation
      if (user.password && user.password !== password) {
        return { success: false, error: 'Invalid password' }
      }

      // Check shop approval for shopkeepers
      if (role.toUpperCase() === 'SHOPKEEPER') {
        const shopApproval = await this.isShopApproved(user.id);
        if (!shopApproval.approved) {
          return { 
            success: false, 
            error: 'Your shop registration is still pending approval. Please wait for admin approval before logging in.' 
          }
        }
      }

      console.log('✅ User authenticated via Supabase')
      return { success: true, user }

    } catch (error) {
      console.error('Authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  // Check if email already exists
  static async checkEmailExists(email: string) {
    try {
      // Try Prisma first
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        return { exists: !!existingUser, user: existingUser };
      } catch (prismaError) {
        console.warn('Prisma email check failed, trying Supabase:', prismaError);
      }

      // Fallback to Supabase
      const { data: user, error } = await getSupabaseClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Email check error:', error);
        return { exists: false, error: error.message };
      }

      return { exists: !!user, user };
    } catch (error) {
      console.error('Email check error:', error);
      return { exists: false, error: 'Email check failed' };
    }
  }

  // Create user account with enhanced error handling
  static async createUserAccount(userData: CreateUserData) {
    try {
      console.log('🔍 Creating user account:', userData.email)
      
      // Step 1: Check if email already exists
      const emailCheck = await this.checkEmailExists(userData.email);
      if (emailCheck.exists) {
        return { 
          success: false, 
          error: 'Email address already exists. Please use a different email or try logging in instead.',
          code: 'EMAIL_EXISTS',
          existingUser: emailCheck.user
        };
      }
      
      // Try Prisma first
      try {
        const userData_prisma: any = {
          email: userData.email,
          name: userData.name,
          role: userData.role.toUpperCase() as any,
          password: userData.password,
          phone: userData.phone,
          aadhaarNumber: userData.aadhaarNumber
        };
        
        // Add location data if available
        if (userData.latitude !== undefined && userData.longitude !== undefined) {
          userData_prisma.latitude = userData.latitude;
          userData_prisma.longitude = userData.longitude;
        }
        
        const user = await prisma.user.create({
          data: userData_prisma
        })
        console.log('✅ User created via Prisma')
        return { success: true, user }
      } catch (prismaError) {
        console.warn('Prisma user creation failed, trying Supabase:', prismaError)
      }

      // Enhanced Supabase fallback with detailed error handling
      try {
        const supabaseClient = getSupabaseClient()
        
        // Step 1: Try with all fields
        let insertData: any = {
          email: userData.email,
          name: userData.name,
          role: userData.role.toUpperCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Add optional fields conditionally
        if (userData.password) insertData.password = userData.password
        if (userData.phone) insertData.phone = userData.phone
        if (userData.aadhaarNumber) insertData.aadhaar_number = userData.aadhaarNumber
        if (userData.address) insertData.address = userData.address
        if (userData.latitude !== undefined && userData.latitude !== null) insertData.latitude = userData.latitude
        if (userData.longitude !== undefined && userData.longitude !== null) insertData.longitude = userData.longitude

        console.log('🔍 Attempting Supabase insert with data:', insertData)

        const { data: user, error } = await supabaseClient
          .from('users')
          .insert([insertData])
          .select()
          .single()

        if (error) {
          console.error('❌ Supabase user creation failed:', error)
          
          // Handle duplicate email error specifically
          if (error.code === '23505' && error.message.includes('users_email_key')) {
            return { 
              success: false, 
              error: 'Email address already exists. Please use a different email or try logging in instead.',
              code: 'EMAIL_EXISTS'
            };
          }
          
          // Step 2: If it's a column error, try with basic fields only
          if (error.code === '42703' || 
              error.message.includes('column') || 
              error.message.includes('does not exist') ||
              error.message.includes('undefined column')) {
            
            console.log('🔄 Column error detected, retrying with basic fields only...')
            
            const basicData = {
              email: userData.email,
              name: userData.name,
              role: userData.role.toUpperCase(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            console.log('🔍 Attempting basic insert with data:', basicData)

            const { data: basicUser, error: basicError } = await supabaseClient
              .from('users')
              .insert([basicData])
              .select()
              .single()

            if (basicError) {
              console.error('❌ Basic user creation also failed:', basicError)
              
              // Handle duplicate email in basic insert too
              if (basicError.code === '23505' && basicError.message.includes('users_email_key')) {
                return { 
                  success: false, 
                  error: 'Email address already exists. Please use a different email or try logging in instead.',
                  code: 'EMAIL_EXISTS'
                };
              }
              
              return { 
                success: false, 
                error: `Database schema issue: ${basicError.message}. Code: ${basicError.code}`,
                details: basicError.details,
                hint: basicError.hint
              }
            }

            console.log('✅ User created via Supabase (basic fields only)')
            return { success: true, user: basicUser }
          }
          
          // Step 3: If it's not a column error, return the specific error
          return { 
            success: false, 
            error: `Supabase error: ${error.message}`,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        }

        console.log('✅ User created via Supabase')
        return { success: true, user }

      } catch (supabaseError) {
        console.error('❌ Supabase connection error:', supabaseError)
        return { 
          success: false, 
          error: `Database connection failed: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}` 
        }
      }

    } catch (error) {
      console.error('❌ User creation error:', error)
      return { 
        success: false, 
        error: `User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  // Create shop registration with fallback mechanisms
  static async createShopRegistration(shopData: ShopRegistrationData) {
    try {
      console.log('🔍 Creating shop registration:', shopData.shopName)
      
      // Try Prisma first
      try {
        const shop = await prisma.shop.create({
          data: {
            name: shopData.shopName,
            description: shopData.description,
            address: `${shopData.address}, ${shopData.city}, ${shopData.state} ${shopData.pincode}`,
            phone: shopData.mobileNumber,
            email: shopData.email,
            status: 'PENDING',
            ownerId: 'temp-owner-id' // This will be updated when user is created
          }
        })
        console.log('✅ Shop created via Prisma')
        return { success: true, shop }
      } catch (prismaError) {
        console.warn('Prisma shop creation failed, trying Supabase:', prismaError)
      }

      // Fallback to Supabase
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .insert([{
          name: shopData.shopName,
          description: shopData.description,
          address: `${shopData.address}, ${shopData.city}, ${shopData.state} ${shopData.pincode}`,
          phone: shopData.mobileNumber,
          email: shopData.email,
          status: 'PENDING',
          owner_id: 'temp-owner-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase shop creation failed:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Shop created via Supabase')
      return { success: true, shop }

    } catch (error) {
      console.error('Shop creation error:', error)
      return { success: false, error: 'Shop creation failed' }
    }
  }

  // Check if shop is approved
  static async isShopApproved(userId: string) {
    try {
      // Try Prisma first
      try {
        const shop = await prisma.shop.findFirst({
          where: { 
            ownerId: userId,
            status: 'APPROVED'
          }
        })
        return { approved: !!shop, shop }
      } catch (prismaError) {
        console.warn('Prisma shop check failed, trying Supabase:', prismaError)
      }

      // Fallback to Supabase
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .select('*')
        .eq('owner_id', userId)
        .eq('status', 'APPROVED')
        .single()

      return { approved: !!shop && !error, shop }

    } catch (error) {
      console.error('Shop approval check error:', error)
      return { approved: false, shop: null }
    }
  }

  // Get all shops for admin approval
  static async getPendingShops() {
    try {
      // Try Prisma first
      try {
        const shops = await prisma.shop.findMany({
          where: { status: 'PENDING' },
          include: { owner: true }
        })
        return { success: true, shops }
      } catch (prismaError) {
        console.warn('Prisma shops fetch failed, trying Supabase:', prismaError)
      }

      // Fallback to Supabase
      const { data: shops, error } = await getSupabaseClient()
        .from('shops')
        .select(`
          *,
          owner:users(*)
        `)
        .eq('status', 'PENDING')

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, shops }

    } catch (error) {
      console.error('Get pending shops error:', error)
      return { success: false, error: 'Failed to fetch pending shops' }
    }
  }

  // Approve shop
  static async approveShop(shopId: string) {
    try {
      // Try Prisma first
      try {
        const shop = await prisma.shop.update({
          where: { id: shopId },
          data: { status: 'APPROVED' }
        })
        return { success: true, shop }
      } catch (prismaError) {
        console.warn('Prisma shop approval failed, trying Supabase:', prismaError)
      }

      // Fallback to Supabase
      const { data: shop, error } = await getSupabaseClient()
        .from('shops')
        .update({ 
          status: 'APPROVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, shop }

    } catch (error) {
      console.error('Shop approval error:', error)
      return { success: false, error: 'Shop approval failed' }
    }
  }

  // Complete shop registration process (combines user creation and shop creation)
  static async registerShop(shopData: ShopRegistrationData) {
    try {
      console.log('🔍 Starting complete shop registration process...')
      
      // Step 1: Create user account
      const userData: CreateUserData = {
        email: shopData.email,
        name: shopData.ownerName,
        role: 'SHOPKEEPER',
        password: shopData.password,
        phone: shopData.mobileNumber,
        aadhaarNumber: shopData.aadhaarNumber
      }

      const userResult = await this.createUserAccount(userData)
      if (!userResult.success) {
        return { 
          success: false, 
          error: `User creation failed: ${userResult.error}`,
          step: 'user_creation'
        }
      }

      console.log('✅ User created successfully:', userResult.user?.id)

      // Step 2: Create shop with proper owner ID
      const shopResult = await this.createShopRegistrationWithOwner(shopData, userResult.user.id)
      if (!shopResult.success) {
        return { 
          success: false, 
          error: `Shop creation failed: ${shopResult.error}`,
          step: 'shop_creation',
          user: userResult.user
        }
      }

      console.log('✅ Shop created successfully:', shopResult.shop?.id)

      return {
        success: true,
        user: userResult.user,
        shop: shopResult.shop,
        message: 'Shop registration completed successfully'
      }

    } catch (error) {
      console.error('Complete shop registration error:', error)
      return { 
        success: false, 
        error: 'Shop registration failed',
        step: 'unknown'
      }
    }
  }

  // Create shop registration with proper owner ID
  static async createShopRegistrationWithOwner(shopData: ShopRegistrationData, ownerId: string) {
    try {
      console.log('🔍 Creating shop registration with owner:', shopData.shopName, 'Owner ID:', ownerId)
      
      // Try Prisma first
      try {
        const shopData_prisma: any = {
          name: shopData.shopName,
          description: shopData.description,
          address: `${shopData.address}, ${shopData.city}, ${shopData.state} ${shopData.pincode}`,
          phone: shopData.mobileNumber,
          email: shopData.email,
          status: 'PENDING',
          ownerId: ownerId // Use the actual user ID
        };
        
        // Add location data if available
        if (shopData.latitude !== undefined && shopData.longitude !== undefined) {
          shopData_prisma.latitude = shopData.latitude;
          shopData_prisma.longitude = shopData.longitude;
        }
        
        const shop = await prisma.shop.create({
          data: shopData_prisma
        })
        console.log('✅ Shop created via Prisma')
        return { success: true, shop }
      } catch (prismaError) {
        console.warn('Prisma shop creation failed, trying Supabase:', prismaError)
      }

      // Fallback to Supabase
      try {
        const supabaseClient = getSupabaseClient()
        
        const shopData_supabase: any = {
          name: shopData.shopName,
          description: shopData.description,
          address: `${shopData.address}, ${shopData.city}, ${shopData.state} ${shopData.pincode}`,
          phone: shopData.mobileNumber,
          email: shopData.email,
          status: 'PENDING',
          owner_id: ownerId, // Use the actual user ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Add location data if available
        if (shopData.latitude !== undefined && shopData.longitude !== undefined) {
          shopData_supabase.latitude = shopData.latitude;
          shopData_supabase.longitude = shopData.longitude;
        }

        console.log('🔍 Attempting Supabase shop insert with data:', shopData_supabase)

        const { data: shop, error } = await supabaseClient
          .from('shops')
          .insert([shopData_supabase])
          .select()
          .single()

        if (error) {
          console.error('❌ Supabase shop creation failed:', error)
          
          // Handle foreign key constraint error
          if (error.code === '23503' && error.message.includes('shops_owner_id_fkey')) {
            return { 
              success: false, 
              error: 'User ID not found. Please ensure the user account was created successfully.',
              code: 'FOREIGN_KEY_CONSTRAINT'
            };
          }
          
          return { success: false, error: error.message }
        }

        console.log('✅ Shop created via Supabase')
        return { success: true, shop }

      } catch (supabaseError) {
        console.error('❌ Supabase shop creation error:', supabaseError)
        return { success: false, error: 'Shop creation failed' }
      }

    } catch (error) {
      console.error('❌ Shop creation error:', error)
      return { success: false, error: 'Shop creation failed' }
    }
  }
}
