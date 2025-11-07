'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, CheckCircle } from 'lucide-react';

export default function ExpiryNotifications() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Expiry & Stock Notifications
        </CardTitle>
        <CardDescription>Important alerts regarding your product inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mr-4" />
          <span>All clear! Your inventory looks good.</span>
        </div>
      </CardContent>
    </Card>
  );
}