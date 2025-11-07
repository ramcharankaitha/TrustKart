'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  Clock,
  MoreHorizontal,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { useNotifications, type Notification } from '@/context/notification-context';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'order_approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'order_rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'order_ready':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'order_delivered':
      return <Truck className="h-4 w-4 text-green-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { markAsRead, removeNotification } = useNotifications();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };

  return (
    <div
      className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <NotificationIcon type={notification.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${
              !notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {notification.title}
            </h4>
            {isHovered && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAllAsRead, clearAllNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-8 px-2 text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-8 px-2 text-xs text-red-500 hover:text-red-600"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No notifications yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  You'll see order updates and important messages here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <NotificationItem notification={notification} />
                      {index < notifications.length - 1 && (
                        <Separator className="mx-3" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
