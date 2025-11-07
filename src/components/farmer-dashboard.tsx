'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Plus, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Star,
  Sprout,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { OrganicVegetable } from '@/lib/types';

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  farmName?: string;
  status: string;
  isActive: boolean;
  rating: number;
  totalVegetablesSubmitted: number;
  totalVegetablesApproved: number;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [vegetables, setVegetables] = useState<OrganicVegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    loadFarmerData();
    loadVegetables();
  }, []);

  const loadFarmerData = () => {
    try {
      const sessionData = sessionStorage.getItem('farmerSession');
      if (sessionData) {
        const farmerData = JSON.parse(sessionData);
        setFarmer(farmerData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading farmer session:', error);
      router.push('/login');
    }
  };

  const loadVegetables = async () => {
    try {
      const sessionData = sessionStorage.getItem('farmerSession');
      if (!sessionData) return;

      const farmerData = JSON.parse(sessionData);
      const response = await fetch(`/api/organic-vegetables?submitted_by=${farmerData.id}&includePending=true`);
      const data = await response.json();

      if (data.success && data.vegetables) {
        const vegs = data.vegetables.map((veg: any) => ({
          ...veg,
          created_at: new Date(veg.created_at),
          updated_at: new Date(veg.updated_at),
          nutritional_info: typeof veg.nutritional_info === 'string' 
            ? JSON.parse(veg.nutritional_info) 
            : veg.nutritional_info
        }));
        setVegetables(vegs);
        
        setStats({
          pending: vegs.filter((v: OrganicVegetable) => v.status === 'pending').length,
          approved: vegs.filter((v: OrganicVegetable) => v.status === 'approved').length,
          rejected: vegs.filter((v: OrganicVegetable) => v.status === 'rejected').length,
          total: vegs.length
        });
      }
    } catch (error) {
      console.error('Error loading vegetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!farmer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              Farmer Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Welcome back, {farmer.name}!
            </p>
          </div>
          <Link href="/dashboard/add-organic-vegetable">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Vegetable
            </Button>
          </Link>
        </div>

        {/* Status Banner */}
        {farmer.status !== 'APPROVED' && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Application Pending Approval
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your farmer application is under review. You can still submit vegetables, but they will need admin approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Vegetables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-2xl font-bold">{farmer.rating || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Farm Information */}
        {farmer.farmName && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-600" />
                Farm Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Farm Name</p>
                  <p className="font-semibold">{farmer.farmName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={farmer.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {farmer.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vegetables List */}
        <Card>
          <CardHeader>
            <CardTitle>My Vegetables</CardTitle>
            <CardDescription>Vegetables you've submitted for approval</CardDescription>
          </CardHeader>
          <CardContent>
            {vegetables.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No vegetables submitted yet</p>
                <Link href="/dashboard/add-organic-vegetable">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Vegetable
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {vegetables.map((vegetable) => (
                  <Card key={vegetable.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {vegetable.image_url && (
                            <img 
                              src={vegetable.image_url} 
                              alt={vegetable.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{vegetable.name}</h3>
                              {getStatusBadge(vegetable.status)}
                            </div>
                            {vegetable.description && (
                              <p className="text-sm text-muted-foreground mb-2">{vegetable.description}</p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap text-sm">
                              <span className="font-semibold text-green-600">₹{vegetable.price} / {vegetable.unit}</span>
                              {vegetable.category && (
                                <Badge variant="outline">{vegetable.category}</Badge>
                              )}
                              {vegetable.origin && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {vegetable.origin}
                                </span>
                              )}
                            </div>
                            {vegetable.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                <strong>Rejection Reason:</strong> {vegetable.rejection_reason}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Submitted: {new Date(vegetable.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

