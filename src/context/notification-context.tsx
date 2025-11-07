'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseDB } from '@/lib/supabase-db';

export interface Notification {
  id: string;
  type: 'order_approved' | 'order_rejected' | 'order_ready' | 'order_delivered' | 'general';
  title: string;
  message: string;
  orderId?: string;
  shopId?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  checkForNewNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
        if (userSession.id) {
          const stored = localStorage.getItem(`notifications_${userSession.id}`);
          if (stored) {
            const parsedNotifications = JSON.parse(stored);
            setNotifications(parsedNotifications);
          }
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
      setIsInitialized(true);
    };

    loadNotifications();
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      try {
        const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
        if (userSession.id) {
          localStorage.setItem(`notifications_${userSession.id}`, JSON.stringify(notifications));
        }
      } catch (error) {
        console.error('Error saving notifications:', error);
      }
    }
  }, [notifications, isInitialized]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const checkForNewNotifications = async () => {
    try {
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      
      // Only check notifications for customers
      if (!userSession.id) {
        return;
      }

      // Skip if user is not a customer (shopkeepers don't need order notifications)
      if (userSession.role && userSession.role.toLowerCase() !== 'customer') {
        return;
      }

      try {
        // Get recent orders for this customer
        const { data: orders, error } = await SupabaseDB.getOrdersByCustomer(userSession.id);
        
        if (error) {
          // Extract error message from various possible formats
          let errorMessage = 'Unknown error';
          
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object') {
            errorMessage = error.message || 
                          error.details || 
                          error.hint || 
                          error.code ||
                          (Object.keys(error).length > 0 ? JSON.stringify(error) : 'Database query failed');
          }
          
          // Only log meaningful errors (not empty objects)
          if (errorMessage !== 'Database query failed' && errorMessage !== 'Unknown error') {
            console.error('❌ Error fetching orders for notifications:', errorMessage);
          }
          // Silently return for empty errors or database issues
          return;
        }
        
        if (!orders || orders.length === 0) {
          return;
        }

        // Check for order status changes in the last 24 hours
        const recentOrders = orders.filter(order => 
          order.created_at && new Date(order.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        // Check for new status changes
        recentOrders.forEach(order => {
          if (!order.id || !order.status) return;
          
          const existingNotification = notifications.find(n => 
            n.orderId === order.id && 
            n.type === `order_${order.status.toLowerCase()}` as any
          );

          if (!existingNotification) {
            let notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>;

            switch (order.status) {
              case 'APPROVED':
                notificationData = {
                  type: 'order_approved',
                  title: 'Order Approved! 🎉',
                  message: `Your order #${order.id.slice(-8)} has been approved by the shopkeeper.`,
                  orderId: order.id,
                  actionUrl: `/payment/${order.id}`,
                };
                break;
              case 'REJECTED':
                notificationData = {
                  type: 'order_rejected',
                  title: 'Order Rejected',
                  message: `Your order #${order.id.slice(-8)} was rejected. ${order.notes || 'Please try again.'}`,
                  orderId: order.id,
                  actionUrl: `/dashboard/my-orders`,
                };
                break;
              case 'READY':
                notificationData = {
                  type: 'order_ready',
                  title: 'Order Ready for Pickup! 📦',
                  message: `Your order #${order.id.slice(-8)} is ready for pickup.`,
                  orderId: order.id,
                  actionUrl: `/dashboard/my-orders`,
                };
                break;
              case 'DELIVERED':
                notificationData = {
                  type: 'order_delivered',
                  title: 'Order Delivered! ✅',
                  message: `Your order #${order.id.slice(-8)} has been delivered successfully.`,
                  orderId: order.id,
                  actionUrl: `/dashboard/my-orders`,
                };
                break;
              default:
                return; // Skip other statuses
            }

            addNotification(notificationData);
          }
        });
      } catch (fetchError: any) {
        // Handle network errors (Failed to fetch, etc.)
        if (fetchError?.name === 'TypeError' && 
            (fetchError?.message?.includes('fetch') || 
             fetchError?.message?.includes('Failed to fetch') ||
             fetchError?.message?.includes('NetworkError'))) {
          // Silently fail - network issues shouldn't break the app
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Network error fetching orders for notifications (silently ignored):', fetchError.message);
          }
          return;
        }
        
        // Handle other errors
        if (fetchError?.message) {
          console.error('❌ Error in checkForNewNotifications:', fetchError.message);
        }
        // Don't re-throw - just return to prevent breaking the app
        return;
      }
    } catch (error: any) {
      // Catch all other errors
      console.error('❌ Error checking for new notifications:', error?.message || error);
      // Don't throw - just log and continue
    }
  };

  // Check for notifications every 30 seconds
  useEffect(() => {
    if (!isInitialized) return;

    // Only set up interval if user is logged in and is a customer
    const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
    if (!userSession.id || (userSession.role && userSession.role.toLowerCase() !== 'customer')) {
      return;
    }

    const interval = setInterval(() => {
      checkForNewNotifications();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialized]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    checkForNewNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
