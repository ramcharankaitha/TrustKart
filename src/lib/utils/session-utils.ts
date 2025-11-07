// Utility functions for user session and role management
export class SessionUtils {
  // Get user session with proper error handling
  static getUserSession() {
    try {
      const sessionData = sessionStorage.getItem('userSession');
      if (!sessionData) {
        console.warn('No user session found in sessionStorage');
        return null;
      }
      
      const session = JSON.parse(sessionData);
      console.log('User session loaded:', session);
      return session;
    } catch (error) {
      console.error('Error parsing user session:', error);
      return null;
    }
  }

  // Check if user has specific role (case-insensitive)
  static hasRole(requiredRole: string): boolean {
    const session = this.getUserSession();
    if (!session || !session.role) {
      return false;
    }
    
    const userRole = session.role.toString().toLowerCase();
    const normalizedRequiredRole = requiredRole.toLowerCase();
    
    console.log(`Role check: ${userRole} === ${normalizedRequiredRole}`, userRole === normalizedRequiredRole);
    return userRole === normalizedRequiredRole;
  }

  // Check if user is shopkeeper
  static isShopkeeper(): boolean {
    return this.hasRole('shopkeeper');
  }

  // Check if user is admin
  static isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is customer
  static isCustomer(): boolean {
    return this.hasRole('customer');
  }

  // Get user ID from session
  static getUserId(): string | null {
    const session = this.getUserSession();
    return session?.id || null;
  }

  // Get user email from session
  static getUserEmail(): string | null {
    const session = this.getUserSession();
    return session?.email || null;
  }

  // Validate session and redirect if invalid
  static validateSession(router: any, requiredRole?: string): boolean {
    const session = this.getUserSession();
    
    if (!session || !session.id) {
      console.error('❌ No valid user session found');
      router.push('/login');
      return false;
    }

    if (requiredRole && !this.hasRole(requiredRole)) {
      console.error(`❌ User does not have required role: ${requiredRole}. Current role: ${session.role}`);
      router.push('/login');
      return false;
    }

    return true;
  }

  // Clear user session
  static clearSession() {
    try {
      sessionStorage.removeItem('userSession');
      localStorage.removeItem('userRole');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('currentShopId');
      localStorage.removeItem('shopStatus');
      localStorage.removeItem('shopRegistrationId');
      localStorage.removeItem('isLoggedIn');
      console.log('✅ User session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }
}

