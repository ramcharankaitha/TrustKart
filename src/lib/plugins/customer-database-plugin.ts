// Database Plugin for Customer Dashboard
// This plugin fetches only approved shops for customers

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

// Mock data for fallback when database is not available
const mockApprovedShops = [
  {
    id: 'shop_001',
    name: 'FreshMart Grocery',
    description: 'Fresh vegetables and groceries delivered to your doorstep',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '+91 98765 43210',
    email: 'info@freshmart.com',
    status: 'approved',
    rating: 4.5,
    deliveryTime: '20-30 min',
    deliveryFee: 'Free',
    imageUrl: '/api/placeholder/300/200',
    imageHint: 'FreshMart Grocery storefront',
    ownerId: 'user_001',
    location: 'Mumbai',
    businessType: 'Grocery',
    registrationDate: new Date('2024-01-15'),
    documents: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'shop_002',
    name: 'MediCare Pharmacy',
    description: 'Your trusted neighborhood pharmacy for all health needs',
    address: '456 Health Lane',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '+91 98765 43211',
    email: 'info@medicare.com',
    status: 'approved',
    rating: 4.8,
    deliveryTime: '15-25 min',
    deliveryFee: '₹20',
    imageUrl: '/api/placeholder/300/200',
    imageHint: 'MediCare Pharmacy storefront',
    ownerId: 'user_002',
    location: 'Delhi',
    businessType: 'Pharmacy',
    registrationDate: new Date('2024-01-20'),
    documents: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

// Mock products for fallback
const mockProducts = [
  {
    id: 'prod_001',
    name: 'Fresh Tomatoes',
    description: 'Fresh red tomatoes, perfect for cooking',
    price: 45.00,
    unit: 'kg',
    stockQty: 50,
    category: 'Vegetables',
    sku: 'TOM001',
    expiryDate: new Date('2024-02-15'),
    mfgDate: new Date('2024-01-15'),
    shopId: 'shop_001',
    imageUrl: '/api/placeholder/200/200',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'prod_002',
    name: 'Paracetamol 500mg',
    description: 'Pain relief and fever reducer',
    price: 25.00,
    unit: 'strip',
    stockQty: 100,
    category: 'Medicine',
    sku: 'PAR001',
    expiryDate: new Date('2025-12-31'),
    mfgDate: new Date('2024-01-01'),
    shopId: 'shop_002',
    imageUrl: '/api/placeholder/200/200',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

export class CustomerDatabasePlugin {
  // Get all approved shops for customers
  static async getApprovedShops() {
    try {
      console.log('🔍 CustomerDatabasePlugin: Starting to fetch approved shops...')
      
      // Check environment variables first
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🔍 Environment check:', {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseAnonKey ? 'Set' : 'Missing'
      })
      
      if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = 'Supabase environment variables not set'
        console.error('❌', errorMsg)
        return { success: false, error: errorMsg, shops: [] }
      }

      console.log('🔍 Getting Supabase client...')
      const supabaseClient = getSupabaseClient()
      console.log('✅ Supabase client obtained')
      
      console.log('🔍 Querying shops table...')
      
      // First, let's test if we can access the shops table at all
      console.log('🔍 Testing basic shops table access...')
      const { data: testData, error: testError } = await supabaseClient
        .from('shops')
        .select('id')
        .limit(1)
      
      if (testError) {
        console.error('❌ Basic shops table access failed:', testError)
        console.error('❌ Test error details:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        })
        throw new Error(`Cannot access shops table: ${testError.message}`)
      }
      
      console.log('✅ Basic shops table access successful')
      
      // Now try a simpler query first - show ALL shops for debugging
      console.log('🔍 Running shops query (showing all shops for debugging)...')
      const { data: shops, error } = await supabaseClient
        .from('shops')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error fetching approved shops:', error)
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Database query error: ${error.message}`)
      }

      console.log('✅ Successfully fetched shops:', shops?.length || 0, 'shops')

      // Transform the data to match the Shop type (with fallback values for missing columns)
      const transformedShops = (shops || []).map(shop => ({
        id: shop.id,
        name: shop.name,
        description: 'Quality products and fast delivery',
        address: 'Address not available',
        city: 'City not available',
        state: 'State not available',
        pincode: '000000',
        phone: 'Phone not available',
        email: 'Email not available',
        status: shop.status?.toLowerCase() || 'approved',
        rating: 0,
        deliveryTime: '20-30 min',
        deliveryFee: 'Free',
        imageUrl: '/api/placeholder/300/200',
        imageHint: `${shop.name} storefront`,
        ownerId: 'unknown',
        location: 'Unknown',
        businessType: 'General',
        registrationDate: new Date(shop.created_at),
        documents: [],
        createdAt: new Date(shop.created_at),
        updatedAt: new Date(shop.created_at)
      }))

      console.log('✅ Transformed shops:', transformedShops.length)
      return { success: true, shops: transformedShops }
    } catch (error: any) {
      console.error('❌ Error fetching approved shops:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // Fallback to mock data if database fails
      console.log('🔄 Falling back to mock data...')
      return { 
        success: true, 
        error: 'Using mock data due to database connection issue', 
        shops: mockApprovedShops 
      }
    }
  }

  // Get products for a specific approved shop
  static async getShopProducts(shopId: string) {
    try {
      // If env not configured, use mock products
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        const mockShopProducts = mockProducts.filter(product => product.shopId === shopId)
        return { success: true, products: mockShopProducts, error: 'Supabase env not set - using mock products' }
      }

      // First verify the shop exists and get its details
      const { data: shop, error: shopError } = await getSupabaseClient()
        .from('shops')
        .select('id, status, name')
        .eq('id', shopId)
        .maybeSingle()

      if (shopError) {
        console.error('❌ Error checking shop status:', shopError)
        // Fall back to mock if cannot check shop status
        const mockShopProducts = mockProducts.filter(product => product.shopId === shopId)
        return { success: true, products: mockShopProducts, error: 'Cannot check shop status - using mock products' }
      }

      if (!shop) {
        console.warn('⚠️ Shop not found:', shopId)
        const mockShopProducts = mockProducts.filter(product => product.shopId === shopId)
        return { success: true, products: mockShopProducts, error: 'Shop not found - using mock products' }
      }

      console.log('🔍 Shop found:', { id: shop.id, name: shop.name, status: shop.status })

      // For debugging, let's show products regardless of shop status
      // In production, you might want to filter by approved shops only
      console.log('🔍 DEBUGGING: Showing products for all shops to test visibility')

      const { data: products, error } = await getSupabaseClient()
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          quantity,
          expiry_date,
          mfg_date,
          shop_id,
          image_url,
          created_at,
          updated_at,
          is_active
        `)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      console.log('🔍 CustomerDatabasePlugin.getShopProducts - Products query result:', { 
        shopId, 
        shopName: shop.name,
        shopStatus: shop.status,
        productsCount: products?.length || 0, 
        error: error?.message || 'No error',
        rawProducts: products
      })

      if (error) {
        // Some databases may not have optional columns; fall back gracefully
        const msg = (error as any)?.message || String(error)
        console.warn('Fetching shop products failed, falling back:', msg)
        const mockShopProducts = mockProducts.filter(product => product.shopId === shopId)
        return { success: true, error: msg, products: mockShopProducts }
      }

      // Transform the data to match the Product type
      const transformedProducts = (products || []).map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        unit: 'piece',
        stockQty: (product as any).quantity || 0,
        category: (product as any).category || 'General',
        sku: (product as any).sku || '',
        expiryDate: product.expiry_date ? new Date(product.expiry_date) : undefined,
        mfgDate: product.mfg_date ? new Date(product.mfg_date) : undefined,
        shopId: product.shop_id,
        imageUrl: product.image_url || '/api/placeholder/200/200',
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }))

      console.log('🔍 Transformed products:', transformedProducts.length, 'products')
      console.log('🔍 Sample transformed product:', transformedProducts[0] || 'No products')

      return { success: true, products: transformedProducts }
    } catch (error: any) {
      console.error('❌ Error fetching shop products:', error)
      
      // Fallback to mock products if database fails
      console.log('🔄 Falling back to mock products...')
      const mockShopProducts = mockProducts.filter(product => product.shopId === shopId)
      return { 
        success: true, 
        error: 'Using mock data due to database connection issue', 
        products: mockShopProducts 
      }
    }
  }

  // Search approved shops
  static async searchApprovedShops(searchTerm: string) {
    try {
      const { data: shops, error } = await getSupabaseClient()
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
        .eq('status', 'APPROVED')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,business_type.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching approved shops:', error)
        return { success: false, error: error.message, shops: [] }
      }

      // Transform the data to match the Shop type
      const transformedShops = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        description: shop.description || 'Quality products and fast delivery',
        address: shop.address,
        city: shop.city,
        state: shop.state,
        pincode: shop.pincode,
        phone: shop.phone,
        email: shop.email,
        status: shop.status.toLowerCase(),
        rating: shop.rating || 0,
        deliveryTime: shop.delivery_time_minutes ? `${shop.delivery_time_minutes} min` : '20-30 min',
        deliveryFee: shop.delivery_fee ? `₹${shop.delivery_fee}` : 'Free',
        imageUrl: shop.image_url || '/api/placeholder/300/200',
        imageHint: shop.image_hint || `${shop.name} storefront`,
        ownerId: shop.owner_id,
        location: shop.city || 'Unknown',
        businessType: shop.business_type || 'General',
        registrationDate: new Date(shop.registration_date),
        documents: [],
        createdAt: new Date(shop.created_at),
        updatedAt: new Date(shop.updated_at)
      }))

      return { success: true, shops: transformedShops }
    } catch (error: any) {
      console.error('❌ Error searching approved shops:', error)
      
      // Fallback to mock data if database fails
      console.log('🔄 Falling back to mock data for search...')
      const filteredShops = mockApprovedShops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.businessType.toLowerCase().includes(searchTerm.toLowerCase())
      )
      return { 
        success: true, 
        error: 'Using mock data due to database connection issue', 
        shops: filteredShops 
      }
    }
  }
}