'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDB } from '@/lib/supabase-db';

interface ShopkeeperStatusCardProps {
  shopkeeperId: string;
}

export default function ShopkeeperStatusCard({ shopkeeperId }: ShopkeeperStatusCardProps) {
  const [shopStatus, setShopStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [registrationRequest, setRegistrationRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadStatus = async () => {
      try {
        // If we have a logged-in user, fetch their shops from DB
        const session = sessionStorage.getItem('userSession');
        let ownerId: string | null = null;
        if (session) {
          try {
            ownerId = JSON.parse(session).id as string;
          } catch {}
        }

        if (ownerId) {
          const { data, error } = await SupabaseDB.getShopsByOwner(ownerId);
          if (!error && data && data.length > 0) {
            // Assume the latest shop is relevant
            const latest = data[0];
            const normalized = (latest.status || 'PENDING').toString().toLowerCase() as 'pending' | 'approved' | 'rejected';
            setShopStatus(normalized);
            setRegistrationRequest({ id: latest.id, rejectionReason: latest.rejection_reason });
            setIsLoading(false);
            return;
          }
        }

        // Fallback to localStorage-only behavior if no DB record
        const status = localStorage.getItem('shopStatus') as 'pending' | 'approved' | 'rejected' | null;
        setShopStatus(status);
        const registrationId = localStorage.getItem('shopRegistrationId');
        if (registrationId) {
          const requests = JSON.parse(localStorage.getItem('shopRegistrationRequests') || '[]');
          const request = requests.find((req: any) => req.id === registrationId);
          setRegistrationRequest(request);
        }
      } catch (e) {
        // Keep UI functional even if DB call fails
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();

    const handleStatusChange = () => {
      const newStatus = localStorage.getItem('shopStatus') as 'pending' | 'approved' | 'rejected' | null;
      setShopStatus(newStatus);
    };
    window.addEventListener('shopStatusChanged', handleStatusChange);
    return () => window.removeEventListener('shopStatusChanged', handleStatusChange);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Not Registered
          </Badge>
        );
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Registration Under Review',
          description: 'Your shop registration is being reviewed by our admin team. You can add products and manage your shop while waiting for approval.',
          icon: Clock,
          variant: 'default' as const
        };
      case 'approved':
        return {
          title: 'Shop Active',
          description: 'Your shop is now active and visible to customers.',
          icon: CheckCircle,
          variant: 'default' as const
        };
      case 'rejected':
        return {
          title: 'Registration Rejected',
          description: registrationRequest?.rejectionReason || 'Your shop registration was rejected. Please review the requirements and submit a new application.',
          icon: XCircle,
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Register Your Shop',
          description: 'Complete your shop registration to start selling on TrustKart.',
          icon: Building,
          variant: 'default' as const
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show anything for approved shops - clean UI
  if (shopStatus === 'approved') {
    return null;
  }

  if (!shopStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Shop Registration
          </CardTitle>
          <CardDescription>
            Register your shop to start selling on TrustKart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You haven't registered your shop yet. Complete the registration process to start selling.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => window.location.href = '/shopkeeper-registration'}>
            Register Shop
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusMessage(shopStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Shop Status
          </div>
          {getStatusBadge(shopStatus)}
        </CardTitle>
        <CardDescription>
          Current status of your shop registration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={statusInfo.variant}>
          <StatusIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>{statusInfo.title}</strong>
            <br />
            {statusInfo.description}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          {shopStatus === 'pending' && (
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Application
            </Button>
          )}
          {shopStatus === 'rejected' && (
            <Button size="sm" onClick={() => window.location.href = '/shopkeeper-registration'}>
              <Edit className="h-4 w-4 mr-2" />
              Re-register
            </Button>
          )}
        </div>

        {shopStatus === 'pending' && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Note:</strong> While your shop is pending approval, you can still add products and manage your inventory. 
            Your shop will become visible to customers once approved.
          </div>
        )}
      </CardContent>
    </Card>
  );
}