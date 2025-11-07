import type { Shop } from './types';

export class AdminUtils {
  // Get all shops with their approval status
  static getAllShops() {
    if (typeof window === 'undefined') return [];
    
    const storedShops = localStorage.getItem('shops');
    if (storedShops) {
      try {
        return JSON.parse(storedShops) as Shop[];
      } catch (error) {
        console.error('Error loading shops:', error);
        return [];
      }
    }
    return [];
  }

  // Get shops by status
  static getShopsByStatus(status: Shop['status']) {
    const allShops = this.getAllShops();
    return allShops.filter(shop => shop.status === status);
  }

  // Approve a shop
  static approveShop(shopId: string) {
    if (typeof window === 'undefined') return { success: false, error: 'Not available on server' };
    
    const shops = this.getAllShops();
    const shopIndex = shops.findIndex(shop => shop.id === shopId);
    
    if (shopIndex !== -1) {
      shops[shopIndex].status = 'approved';
      shops[shopIndex].approvalDate = new Date();
      localStorage.setItem('shops', JSON.stringify(shops));
      return { success: true, shop: shops[shopIndex] };
    }
    
    return { success: false, error: 'Shop not found' };
  }

  // Reject a shop
  static rejectShop(shopId: string, reason?: string) {
    if (typeof window === 'undefined') return { success: false, error: 'Not available on server' };
    
    const shops = this.getAllShops();
    const shopIndex = shops.findIndex(shop => shop.id === shopId);
    
    if (shopIndex !== -1) {
      shops[shopIndex].status = 'rejected';
      // You could add a rejectionReason field to the Shop type if needed
      localStorage.setItem('shops', JSON.stringify(shops));
      return { success: true, shop: shops[shopIndex] };
    }
    
    return { success: false, error: 'Shop not found' };
  }

  // Suspend a shop
  static suspendShop(shopId: string) {
    if (typeof window === 'undefined') return { success: false, error: 'Not available on server' };
    
    const shops = this.getAllShops();
    const shopIndex = shops.findIndex(shop => shop.id === shopId);
    
    if (shopIndex !== -1) {
      shops[shopIndex].status = 'suspended';
      localStorage.setItem('shops', JSON.stringify(shops));
      return { success: true, shop: shops[shopIndex] };
    }
    
    return { success: false, error: 'Shop not found' };
  }

  // Get approval statistics
  static getApprovalStats() {
    const allShops = this.getAllShops();
    const stats = {
      total: allShops.length,
      pending: allShops.filter(shop => shop.status === 'pending').length,
      approved: allShops.filter(shop => shop.status === 'approved').length,
      rejected: allShops.filter(shop => shop.status === 'rejected').length,
      suspended: allShops.filter(shop => shop.status === 'suspended').length,
      terminated: allShops.filter(shop => shop.status === 'terminated').length,
      closed: allShops.filter(shop => shop.status === 'closed').length,
    };
    
    return stats;
  }

  // Check if a shop is customer-visible (approved)
  static isShopCustomerVisible(shop: Shop): boolean {
    return shop.status === 'approved' && !!shop.approvalDate;
  }

  // Get customer-visible shops only
  static getCustomerVisibleShops(): Shop[] {
    const allShops = this.getAllShops();
    return allShops.filter(shop => this.isShopCustomerVisible(shop));
  }
}

