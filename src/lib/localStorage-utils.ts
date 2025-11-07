// localStorage utility functions for managing storage quota
export const localStorageUtils = {
  // Check if localStorage is available
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Get storage usage information
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Estimate available space (most browsers have 5-10MB limit)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const available = Math.max(0, estimatedLimit - used);
    const percentage = (used / estimatedLimit) * 100;

    return { used, available, percentage };
  },

  // Clean up old data to free space
  cleanupOldData(): { cleaned: boolean; message: string } {
    try {
      // Clean up old registration requests (keep last 10)
      const requests = JSON.parse(localStorage.getItem('shopRegistrationRequests') || '[]');
      if (requests.length > 10) {
        const recentRequests = requests.slice(-10);
        localStorage.setItem('shopRegistrationRequests', JSON.stringify(recentRequests));
      }

      // Clean up old shops (keep last 20)
      const shops = JSON.parse(localStorage.getItem('shops') || '[]');
      if (shops.length > 20) {
        const recentShops = shops.slice(-20);
        localStorage.setItem('shops', JSON.stringify(recentShops));
      }

      // Clean up old orders (keep last 50)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      if (orders.length > 50) {
        const recentOrders = orders.slice(-50);
        localStorage.setItem('orders', JSON.stringify(recentOrders));
      }

      // Clean up old complaints (keep last 30)
      const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
      if (complaints.length > 30) {
        const recentComplaints = complaints.slice(-30);
        localStorage.setItem('complaints', JSON.stringify(recentComplaints));
      }

      return {
        cleaned: true,
        message: 'Old data cleaned up successfully'
      };
    } catch (error) {
      return {
        cleaned: false,
        message: 'Failed to clean up old data'
      };
    }
  },

  // Safe setItem with automatic cleanup if quota exceeded
  safeSetItem(key: string, value: string): { success: boolean; message: string } {
    try {
      localStorage.setItem(key, value);
      return { success: true, message: 'Data saved successfully' };
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Try to clean up and retry
        const cleanup = this.cleanupOldData();
        if (cleanup.cleaned) {
          try {
            localStorage.setItem(key, value);
            return { 
              success: true, 
              message: 'Data saved after cleanup' 
            };
          } catch (retryError) {
            return { 
              success: false, 
              message: 'Storage quota exceeded even after cleanup' 
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Storage quota exceeded and cleanup failed' 
          };
        }
      } else {
        return { 
          success: false, 
          message: `Storage error: ${error.message}` 
        };
      }
    }
  },

  // Clear all demo data (for testing)
  clearDemoData(): void {
    const keysToKeep = ['userRole', 'isLoggedIn', 'currentUserId', 'currentShopId', 'shopStatus'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }
};
