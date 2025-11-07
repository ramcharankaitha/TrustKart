import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supabase-based storage service to replace localStorage
export class SupabaseStorage {
  // ==================== USER SESSION MANAGEMENT ====================
  static async setUserSession(userData: { id: string; email: string; name: string; role: string }) {
    try {
      // Store user session in Supabase (you can also use cookies or session storage)
      const sessionData = {
        user_id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        login_time: new Date().toISOString(),
        is_active: true
      }

      // Store in a user_sessions table (you'll need to create this)
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert([sessionData])
        .select()
        .single()

      if (error) {
        console.error('Failed to store user session:', error)
        return false
      }

      // Also store in sessionStorage for immediate access
      sessionStorage.setItem('userSession', JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('Error setting user session:', error)
      return false
    }
  }

  static async getUserSession(): Promise<any> {
    try {
      // First try sessionStorage for immediate access
      const sessionData = sessionStorage.getItem('userSession')
      if (sessionData) {
        return JSON.parse(sessionData)
      }

      // If not in sessionStorage, try to get from Supabase
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('login_time', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      const userSession = {
        id: data.user_id,
        email: data.email,
        name: data.name,
        role: data.role
      }

      // Store in sessionStorage for future use
      sessionStorage.setItem('userSession', JSON.stringify(userSession))
      return userSession
    } catch (error) {
      console.error('Error getting user session:', error)
      return null
    }
  }

  static async clearUserSession() {
    try {
      // Clear from sessionStorage
      sessionStorage.removeItem('userSession')
      
      // Mark session as inactive in Supabase
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('is_active', true)

      if (error) {
        console.error('Failed to clear user session:', error)
      }
    } catch (error) {
      console.error('Error clearing user session:', error)
    }
  }

  // ==================== LOCATION MANAGEMENT ====================
  static async setUserLocation(locationData: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const location = {
        user_id: session.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_locations')
        .upsert([location])
        .select()
        .single()

      if (error) {
        console.error('Failed to store user location:', error)
        return false
      }

      // Also store in sessionStorage for immediate access
      sessionStorage.setItem('userLocation', JSON.stringify(locationData))
      return true
    } catch (error) {
      console.error('Error setting user location:', error)
      return false
    }
  }

  static async getUserLocation(): Promise<any> {
    try {
      // First try sessionStorage for immediate access
      const locationData = sessionStorage.getItem('userLocation')
      if (locationData) {
        return JSON.parse(locationData)
      }

      // If not in sessionStorage, try to get from Supabase
      const session = await this.getUserSession()
      if (!session) {
        return null
      }

      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', session.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      const location = {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country
      }

      // Store in sessionStorage for future use
      sessionStorage.setItem('userLocation', JSON.stringify(location))
      return location
    } catch (error) {
      console.error('Error getting user location:', error)
      return null
    }
  }

  // ==================== CART MANAGEMENT ====================
  static async addToCart(productId: string, quantity: number = 1) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const { data, error } = await supabase
        .from('cart_items')
        .upsert([{
          user_id: session.id,
          product_id: productId,
          quantity: quantity
        }])
        .select()
        .single()

      if (error) {
        console.error('Failed to add to cart:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      return false
    }
  }

  static async getCartItems() {
    try {
      const session = await this.getUserSession()
      if (!session) {
        return []
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products!cart_items_product_id_fkey(
            name, price, image_url, quantity, shop_id,
            shops!products_shop_id_fkey(name)
          )
        `)
        .eq('user_id', session.id)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Failed to get cart items:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting cart items:', error)
      return []
    }
  }

  static async removeFromCart(productId: string) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.id)
        .eq('product_id', productId)

      if (error) {
        console.error('Failed to remove from cart:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error removing from cart:', error)
      return false
    }
  }

  static async clearCart() {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.id)

      if (error) {
        console.error('Failed to clear cart:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error clearing cart:', error)
      return false
    }
  }

  // ==================== USER PREFERENCES ====================
  static async setUserPreference(key: string, value: any) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const preference = {
        user_id: session.id,
        preference_key: key,
        preference_value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert([preference])
        .select()
        .single()

      if (error) {
        console.error('Failed to set user preference:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error setting user preference:', error)
      return false
    }
  }

  static async getUserPreference(key: string): Promise<any> {
    try {
      const session = await this.getUserSession()
      if (!session) {
        return null
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', session.id)
        .eq('preference_key', key)
        .single()

      if (error || !data) {
        return null
      }

      return JSON.parse(data.preference_value)
    } catch (error) {
      console.error('Error getting user preference:', error)
      return null
    }
  }

  // ==================== RECENT ACTIVITIES ====================
  static async addRecentActivity(activity: {
    type: string;
    entity_id: string;
    entity_type: string;
    description: string;
  }) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const activityData = {
        user_id: session.id,
        activity_type: activity.type,
        entity_id: activity.entity_id,
        entity_type: activity.entity_type,
        description: activity.description,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('recent_activities')
        .insert([activityData])
        .select()
        .single()

      if (error) {
        console.error('Failed to add recent activity:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error adding recent activity:', error)
      return false
    }
  }

  static async getRecentActivities(limit: number = 10) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        return []
      }

      const { data, error } = await supabase
        .from('recent_activities')
        .select('*')
        .eq('user_id', session.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to get recent activities:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting recent activities:', error)
      return []
    }
  }

  // ==================== SEARCH HISTORY ====================
  static async addSearchHistory(searchTerm: string) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const searchData = {
        user_id: session.id,
        search_term: searchTerm,
        searched_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('search_history')
        .insert([searchData])
        .select()
        .single()

      if (error) {
        console.error('Failed to add search history:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error adding search history:', error)
      return false
    }
  }

  static async getSearchHistory(limit: number = 10) {
    try {
      const session = await this.getUserSession()
      if (!session) {
        return []
      }

      const { data, error } = await supabase
        .from('search_history')
        .select('search_term, searched_at')
        .eq('user_id', session.id)
        .order('searched_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to get search history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting search history:', error)
      return []
    }
  }

  // ==================== FAVORITES ====================
  static async addToFavorites(entityId: string, entityType: 'shop' | 'product') {
    try {
      const session = await this.getUserSession()
      if (!session) {
        throw new Error('No user session found')
      }

      const favoriteData = {
        user_id: session.id,
        entity_id: entityId,
        entity_type: entityType,
        added_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .upsert([favoriteData])
        .select()
        .single()

      if (error) {
        console.error('Failed to add to favorites:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return false
    }
  }

  static async getFavorites(entityType?: 'shop' | 'product') {
    try {
      const session = await this.getUserSession()
      if (!session) {
        return []
      }

      let query = supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', session.id)
        .order('added_at', { ascending: false })

      if (entityType) {
        query = query.eq('entity_type', entityType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to get favorites:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting favorites:', error)
      return []
    }
  }

  // ==================== NOTIFICATIONS ====================
  static async markNotificationAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to mark notification as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  static async getUserNotifications() {
    try {
      const session = await this.getUserSession()
      if (!session) {
        return []
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to get notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }
}
