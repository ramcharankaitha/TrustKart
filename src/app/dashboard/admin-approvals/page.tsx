'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  AlertCircle,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Loader2,
  Truck,
  Leaf,
  Sprout,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ShopRegistrationRequest, ShopDocument, OrganicVegetable } from '@/lib/types';
import DocumentPreviewModal from '@/components/document-preview-modal';
import { LoginDatabasePlugin } from '@/lib/plugins/login-database-plugin';
import { AdminDatabasePlugin } from '@/lib/plugins/admin-database-plugin';

export default function AdminApprovalDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ShopRegistrationRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ShopRegistrationRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ShopRegistrationRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<ShopRegistrationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ShopRegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewDocument, setPreviewDocument] = useState<ShopDocument | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Delivery Agent Management State
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);
  const [deliveryAgentLoading, setDeliveryAgentLoading] = useState(false);
  
  // Farmer Management State
  const [farmers, setFarmers] = useState<any[]>([]);
  const [farmerLoading, setFarmerLoading] = useState(false);
  
  // Organic Vegetables State
  const [organicVegetables, setOrganicVegetables] = useState<OrganicVegetable[]>([]);
  const [pendingVegetables, setPendingVegetables] = useState<OrganicVegetable[]>([]);
  const [approvedVegetables, setApprovedVegetables] = useState<OrganicVegetable[]>([]);
  const [rejectedVegetables, setRejectedVegetables] = useState<OrganicVegetable[]>([]);
  const [selectedVegetable, setSelectedVegetable] = useState<OrganicVegetable | null>(null);
  const [vegetableRejectionReason, setVegetableRejectionReason] = useState('');
  const [vegetableLoading, setVegetableLoading] = useState(false);

  const fetchAllRequests = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching all shop requests...');
      
      // Load all shops from LoginDatabasePlugin
      const result = await LoginDatabasePlugin.getAllShopRequests();
      
      if (!result.success) {
        console.error('❌ Error fetching shops:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to fetch shop requests",
        });
        return;
      }

      console.log('✅ Fetched all shops:', result.shops);
      
      // Transform the data to match the expected format
      const transformedRequests: ShopRegistrationRequest[] = result.shops.map((shop: any) => ({
        id: shop.id,
        shopkeeperId: shop.owner_id,
        shopkeeperName: shop.owner?.name || 'Unknown',
        shopkeeperEmail: shop.owner?.email || 'Unknown',
        shopkeeperPhone: shop.owner?.phone || 'Unknown',
        shopDetails: {
          shopName: shop.name,
          address: shop.address || '',
          city: shop.city || 'Not specified',
          state: shop.state || 'Not specified',
          pincode: shop.pincode || 'Not specified',
          phone: shop.phone || 'Not specified',
          email: shop.email || 'Not specified',
          businessType: shop.business_type || 'Not specified',
          description: shop.description || 'No description provided',
        },
        status: (shop.status || 'PENDING').toString().toLowerCase(),
        submittedAt: shop.created_at,
        documents: [], // Documents are not stored - preview only
        rejectionReason: shop.rejection_reason,
        reviewedAt: shop.approved_at || shop.rejected_at || null,
      }));

      // Organize requests by status
      const pending = transformedRequests.filter(req => req.status === 'pending');
      const approved = transformedRequests.filter(req => req.status === 'approved');
      const rejected = transformedRequests.filter(req => req.status === 'rejected');

      setRequests(transformedRequests);
      setPendingRequests(pending);
      setApprovedRequests(approved);
      setRejectedRequests(rejected);
      
      console.log('✅ Organized requests:', { 
        total: transformedRequests.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length
      });
      
    } catch (error) {
      console.error('❌ Error fetching requests:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch shop requests. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true);
    try {
      console.log('✅ Approving shop request:', requestId);
      
      // Get current user session for admin ID
      const currentUser = await LoginDatabasePlugin.getCurrentUser();
      if (!currentUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Admin session not found. Please login again.",
        });
        return;
      }

      const result = await LoginDatabasePlugin.approveShop(requestId, currentUser.id);
      
      if (result.success) {
        toast({
          title: "Shop Approved!",
          description: "The shop has been approved successfully. Shopkeeper can now login.",
        });
        
        // Immediately update the local state to reflect the change
        const updatedRequest = { 
          ...pendingRequests.find(req => req.id === requestId)!, 
          status: 'approved', 
          reviewedAt: new Date().toISOString() 
        };
        
        // Move from pending to approved
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        setApprovedRequests(prev => [...prev, updatedRequest]);
        
        // Close any open request details
        setSelectedRequest(null);
        
        // Refresh the requests list after a short delay to ensure database consistency
        setTimeout(async () => {
          await fetchAllRequests();
        }, 1000);
        
      } else {
        toast({
          variant: "destructive",
          title: "Approval Failed",
          description: result.error || "Failed to approve shop request.",
        });
      }
    } catch (error) {
      console.error('❌ Error approving request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while approving the request.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
    loadDeliveryAgents();
    loadFarmers();
    fetchOrganicVegetables();
  }, []);

  // Fetch organic vegetables
  const fetchOrganicVegetables = async () => {
    setVegetableLoading(true);
    try {
      const response = await fetch('/api/organic-vegetables?includePending=true');
      const data = await response.json();
      
      if (data.success) {
        const vegetables = data.vegetables.map((veg: any) => ({
          ...veg,
          created_at: new Date(veg.created_at),
          updated_at: new Date(veg.updated_at),
          approved_at: veg.approved_at ? new Date(veg.approved_at) : undefined,
          rejected_at: veg.rejected_at ? new Date(veg.rejected_at) : undefined,
          nutritional_info: typeof veg.nutritional_info === 'string' 
            ? JSON.parse(veg.nutritional_info) 
            : veg.nutritional_info
        }));
        
        setOrganicVegetables(vegetables);
        setPendingVegetables(vegetables.filter((v: OrganicVegetable) => v.status === 'pending'));
        setApprovedVegetables(vegetables.filter((v: OrganicVegetable) => v.status === 'approved'));
        setRejectedVegetables(vegetables.filter((v: OrganicVegetable) => v.status === 'rejected'));
      }
    } catch (error: any) {
      console.error('Error fetching organic vegetables:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch organic vegetables",
      });
    } finally {
      setVegetableLoading(false);
    }
  };

  // Documents are not stored - no auto-fetch needed
  useEffect(() => {
    // Documents are preview-only, not stored
  }, [selectedRequest?.id]);

  // Farmer Management Functions
  const loadFarmers = async () => {
    try {
      setFarmerLoading(true);
      console.log('🔍 Loading farmers from database...');
      
      const result = await AdminDatabasePlugin.getAllFarmers();
      
      if (result.success) {
        console.log('✅ Loaded farmers:', result.farmers.length);
        setFarmers(result.farmers);
      } else {
        console.error('❌ Failed to load farmers:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load farmers",
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading farmers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load farmers from database",
      });
    } finally {
      setFarmerLoading(false);
    }
  };

  const handleApproveFarmer = async (farmerId: string) => {
    try {
      setFarmerLoading(true);
      const adminId = 'admin_001';
      const result = await AdminDatabasePlugin.approveFarmer(farmerId, adminId);
      
      if (result.success) {
        toast({
          title: "Farmer Approved",
          description: "Farmer has been approved successfully.",
        });
        await loadFarmers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error approving farmer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve farmer",
      });
    } finally {
      setFarmerLoading(false);
    }
  };

  const handleRejectFarmer = async (farmerId: string) => {
    try {
      setFarmerLoading(true);
      const adminId = 'admin_001';
      const reason = 'Does not meet requirements';
      const result = await AdminDatabasePlugin.rejectFarmer(farmerId, adminId, reason);
      
      if (result.success) {
        toast({
          title: "Farmer Rejected",
          description: "Farmer has been rejected.",
        });
        await loadFarmers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error rejecting farmer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject farmer",
      });
    } finally {
      setFarmerLoading(false);
    }
  };

  const handleSuspendFarmer = async (farmerId: string) => {
    try {
      setFarmerLoading(true);
      const adminId = 'admin_001';
      const reason = 'Policy violation';
      const result = await AdminDatabasePlugin.suspendFarmer(farmerId, adminId, reason);
      
      if (result.success) {
        toast({
          title: "Farmer Suspended",
          description: "Farmer has been suspended.",
        });
        await loadFarmers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error('❌ Error suspending farmer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suspend farmer",
      });
    } finally {
      setFarmerLoading(false);
    }
  };

  const getFarmerStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      APPROVED: { variant: 'outline' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      REJECTED: { variant: 'outline' as const, className: 'bg-red-100 text-red-800 border-red-200' },
      SUSPENDED: { variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
    };
    return variants[status as keyof typeof variants] || variants.PENDING;
  };

  const getFarmerStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      case 'SUSPENDED': return <AlertCircle className="h-4 w-4" />;
      default: return <Sprout className="h-4 w-4" />;
    }
  };

  // Delivery Agent Management Functions
  const loadDeliveryAgents = async () => {
    try {
      setDeliveryAgentLoading(true);
      console.log('🔍 Loading delivery agents from API...');
      const response = await fetch('/api/delivery-agents');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Response:', data);
        
        if (data.success && data.deliveryAgents) {
          console.log('✅ Loaded delivery agents:', data.deliveryAgents.length);
          setDeliveryAgents(data.deliveryAgents);
        } else {
          console.error('❌ API returned error:', data.error);
          throw new Error(data.error || 'Failed to load delivery agents');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load delivery agents');
      }
    } catch (error: any) {
      console.error('❌ Error loading delivery agents:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load delivery agents",
        variant: "destructive",
      });
    } finally {
      setDeliveryAgentLoading(false);
    }
  };

  const handleApproveDeliveryAgent = async (agentId: string) => {
    try {
      setDeliveryAgentLoading(true);
      const response = await fetch(`/api/delivery-agents/${agentId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery agent approved successfully",
        });
        loadDeliveryAgents();
      } else {
        throw new Error('Failed to approve agent');
      }
    } catch (error) {
      console.error('Error approving agent:', error);
      toast({
        title: "Error",
        description: "Failed to approve delivery agent",
        variant: "destructive",
      });
    } finally {
      setDeliveryAgentLoading(false);
    }
  };

  const handleRejectDeliveryAgent = async (agentId: string) => {
    try {
      setDeliveryAgentLoading(true);
      const response = await fetch(`/api/delivery-agents/${agentId}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery agent rejected successfully",
        });
        loadDeliveryAgents();
      } else {
        throw new Error('Failed to reject agent');
      }
    } catch (error) {
      console.error('Error rejecting agent:', error);
      toast({
        title: "Error",
        description: "Failed to reject delivery agent",
        variant: "destructive",
      });
    } finally {
      setDeliveryAgentLoading(false);
    }
  };

  const handleSuspendDeliveryAgent = async (agentId: string) => {
    try {
      setDeliveryAgentLoading(true);
      const response = await fetch(`/api/delivery-agents/${agentId}/suspend`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery agent suspended successfully",
        });
        loadDeliveryAgents();
      } else {
        throw new Error('Failed to suspend agent');
      }
    } catch (error) {
      console.error('Error suspending agent:', error);
      toast({
        title: "Error",
        description: "Failed to suspend delivery agent",
        variant: "destructive",
      });
    } finally {
      setDeliveryAgentLoading(false);
    }
  };

  const getDeliveryAgentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' };
      case 'approved':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { variant: 'destructive' as const };
      case 'suspended':
        return { variant: 'outline' as const, className: 'border-orange-500 text-orange-600' };
      default:
        return { variant: 'secondary' as const };
    }
  };

  const getDeliveryAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    setLoading(true);
    try {
      console.log('❌ Rejecting shop request:', requestId, 'reason:', reason);
      
      // Get current user session for admin ID
      const currentUser = await LoginDatabasePlugin.getCurrentUser();
      if (!currentUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Admin session not found. Please login again.",
        });
        return;
      }

      const result = await LoginDatabasePlugin.rejectShop(requestId, currentUser.id, reason);
      
      if (result.success) {
        toast({
          title: "Shop Rejected",
          description: "The shop has been rejected. Shopkeeper cannot login until re-approved.",
        });
        
        // Immediately update the local state to reflect the change
        const updatedRequest = { 
          ...pendingRequests.find(req => req.id === requestId)!, 
          status: 'rejected', 
          reviewedAt: new Date().toISOString(),
          rejectionReason: reason 
        };
        
        // Move from pending to rejected
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        setRejectedRequests(prev => [...prev, updatedRequest]);
        
        // Close any open request details
        setSelectedRequest(null);
        setRejectionReason('');
        
        // Refresh the requests list after a short delay to ensure database consistency
        setTimeout(async () => {
          await fetchAllRequests();
        }, 1000);
        
      } else {
        toast({
          variant: "destructive",
          title: "Rejection Failed",
          description: result.error || "Failed to reject shop request.",
        });
      }
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while rejecting the request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const handleDownloadDocument = (doc: ShopDocument) => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      toast({
        variant: "destructive",
        title: "Download Not Available",
        description: "Document download is only available in the browser.",
      });
      return;
    }

    try {
      // Check if we have actual file content (base64)
      if (doc.url && doc.url.startsWith('data:')) {
        // This is a real uploaded file
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.name;
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Document Downloaded",
          description: `${doc.name} downloaded successfully.`,
        });
      } else {
        // Demo file - create a simple text file for download
        const demoContent = `Demo ${doc.type} document for ${doc.name}\n\nThis is a placeholder document for demonstration purposes.\n\nFile Type: ${doc.fileType}\nFile Size: ${doc.fileSize} bytes\nUploaded: ${doc.uploadedAt.toLocaleString()}`;
        
        const blob = new Blob([demoContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.name.replace(/\.[^/.]+$/, '.txt'); // Change extension to .txt
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        URL.revokeObjectURL(url);
        
        toast({
          title: "Demo Document Downloaded",
          description: `Demo version of ${doc.name} downloaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Unable to download the document. Please try again.",
      });
    }
  };

  const handlePreviewDocument = (document: ShopDocument) => {
    setPreviewDocument(document);
  };

  // Documents are not stored - return empty array
  const fetchShopDocuments = async (shopId: string): Promise<ShopDocument[]> => {
    console.log('ℹ️ Documents are not stored. Preview only during registration.');
    return [];
  };

  // Documents are not stored - verification disabled
  const handleVerifyDocument = async (documentId: string, isVerified: boolean, notes?: string) => {
    toast({
      variant: "default",
      title: "Documents Not Stored",
      description: "Documents are preview-only and not stored. Verification is not available.",
    });
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
      });
      return;
    }

    setLoading(true);
    try {
      // Handle database rejection
      const shopId = requestId.replace('db-', '');
      
      // Update shop status in database to REJECTED
      const { error } = await SupabaseDB.updateShopStatus(shopId, 'REJECTED');
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Rejection Failed",
          description: "Failed to reject shop in database.",
        });
        return;
      }
      
      toast({
        title: "Shop Rejected",
        description: "Shop registration has been rejected.",
      });
      
      // Refresh the requests list
      await fetchAllRequests();
      
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: "There was an error rejecting the request.",
      });
    } finally {
      setLoading(false);
    }
  };

  // getStatusBadge defined above (normalized); removed duplicate

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shop Registration Approval</h1>
            <p className="text-muted-foreground">Review and approve shopkeeper registration requests</p>
          </div>
          <Button onClick={fetchAllRequests} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shops ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="vegetables" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Vegetables ({pendingVegetables.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{request.shopDetails.shopName}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {request.shopDetails.city}, {request.shopDetails.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {request.shopDetails.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {request.shopDetails.email}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('🔍 Opening review for shop ID:', request.id);
                            setSelectedRequest(request);
                            toast({
                              variant: "default",
                              title: "Documents Not Stored",
                              description: "Documents are preview-only during registration and are not stored.",
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No approved requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{request.shopDetails.shopName}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {request.shopDetails.city}, {request.shopDetails.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {request.shopDetails.phone}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <span className="text-sm text-muted-foreground">
                          Approved on {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No rejected requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{request.shopDetails.shopName}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {request.shopDetails.city}, {request.shopDetails.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {request.shopDetails.phone}
                          </span>
                        </CardDescription>
                        {request.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-700">
                              <strong>Reason:</strong> {request.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <span className="text-sm text-muted-foreground">
                          Rejected on {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Organic Vegetables Tab */}
        <TabsContent value="vegetables" className="space-y-4">
          {vegetableLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading vegetables...
              </CardContent>
            </Card>
          ) : pendingVegetables.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No pending vegetables</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingVegetables.map((vegetable) => (
                <Card key={vegetable.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {vegetable.image_url && (
                          <img 
                            src={vegetable.image_url} 
                            alt={vegetable.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-xl">{vegetable.name}</CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            {vegetable.description && (
                              <p className="text-sm">{vegetable.description}</p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="font-semibold text-primary">₹{vegetable.price} / {vegetable.unit}</span>
                              {vegetable.category && (
                                <Badge variant="outline">{vegetable.category}</Badge>
                              )}
                              {vegetable.origin && (
                                <span className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3" />
                                  {vegetable.origin}
                                </span>
                              )}
                              {vegetable.farmer_name && (
                                <span className="flex items-center gap-1 text-xs">
                                  <User className="h-3 w-3" />
                                  {vegetable.farmer_name}
                                </span>
                              )}
                            </div>
                            {vegetable.certification && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ {vegetable.certification}
                              </p>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVegetable(vegetable)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vegetable Review Modal */}
      {selectedVegetable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Leaf className="h-6 w-6 text-green-600" />
                  Review Organic Vegetable
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedVegetable(null);
                    setVegetableRejectionReason('');
                  }}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vegetable Image */}
              {selectedVegetable.image_url && (
                <div className="flex justify-center">
                  <img 
                    src={selectedVegetable.image_url} 
                    alt={selectedVegetable.name}
                    className="w-64 h-64 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm text-muted-foreground font-semibold">{selectedVegetable.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground">{selectedVegetable.category || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{selectedVegetable.description || 'No description'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price</Label>
                    <p className="text-sm text-muted-foreground font-semibold">₹{selectedVegetable.price} / {selectedVegetable.unit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Available Quantity</Label>
                    <p className="text-sm text-muted-foreground">{selectedVegetable.quantity_available} {selectedVegetable.unit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Min Order Quantity</Label>
                    <p className="text-sm text-muted-foreground">{selectedVegetable.min_order_quantity} {selectedVegetable.unit}</p>
                  </div>
                </div>
              </div>

              {/* Origin & Certification */}
              {(selectedVegetable.origin || selectedVegetable.certification || selectedVegetable.farmer_name) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Origin & Certification</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedVegetable.origin && (
                      <div>
                        <Label className="text-sm font-medium">Origin</Label>
                        <p className="text-sm text-muted-foreground">{selectedVegetable.origin}</p>
                      </div>
                    )}
                    {selectedVegetable.certification && (
                      <div>
                        <Label className="text-sm font-medium">Certification</Label>
                        <p className="text-sm text-green-600 font-semibold">{selectedVegetable.certification}</p>
                      </div>
                    )}
                    {selectedVegetable.farmer_name && (
                      <div>
                        <Label className="text-sm font-medium">Farmer/Supplier</Label>
                        <p className="text-sm text-muted-foreground">{selectedVegetable.farmer_name}</p>
                      </div>
                    )}
                    {selectedVegetable.farmer_contact && (
                      <div>
                        <Label className="text-sm font-medium">Contact</Label>
                        <p className="text-sm text-muted-foreground">{selectedVegetable.farmer_contact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nutritional Information */}
              {selectedVegetable.nutritional_info && Object.keys(selectedVegetable.nutritional_info).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Nutritional Information</h3>
                  <div className="grid gap-3 md:grid-cols-4">
                    {selectedVegetable.nutritional_info.calories && (
                      <div>
                        <Label className="text-sm font-medium">Calories</Label>
                        <p className="text-sm text-muted-foreground">{selectedVegetable.nutritional_info.calories} kcal</p>
                      </div>
                    )}
                    {selectedVegetable.nutritional_info.protein && (
                      <div>
                        <Label className="text-sm font-medium">Protein</Label>
                        <p className="text-sm text-muted-foreground">{selectedVegetable.nutritional_info.protein}g</p>
                      </div>
                    )}
                    {selectedVegetable.nutritional_info.carbohydrates && (
                      <div>
                        <Label className="text-sm font-medium">Carbs</Label>
                        <p className="text-sm text-muted-foreground">{selectedVegetable.nutritional_info.carbohydrates}g</p>
                      </div>
                    )}
                    {selectedVegetable.nutritional_info.fat && (
                      <div>
                        <Label className="text-sm font-medium">Fat</Label>
                        <p className="text-sm text-muted-foreground">{selectedVegetable.nutritional_info.fat}g</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  onClick={async () => {
                    try {
                      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
                      const response = await fetch(`/api/organic-vegetables/${selectedVegetable.id}/approve`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'approve',
                          approved_by: userSession.id
                        })
                      });
                      
                      const data = await response.json();
                      if (data.success) {
                        toast({
                          title: "Vegetable Approved",
                          description: `${selectedVegetable.name} has been approved and is now visible to customers.`,
                        });
                        setSelectedVegetable(null);
                        fetchOrganicVegetables();
                      } else {
                        throw new Error(data.error);
                      }
                    } catch (error: any) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message || "Failed to approve vegetable",
                      });
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Rejection reason (optional)"
                    value={vegetableRejectionReason}
                    onChange={(e) => setVegetableRejectionReason(e.target.value)}
                    rows={2}
                  />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
                        const response = await fetch(`/api/organic-vegetables/${selectedVegetable.id}/approve`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'reject',
                            rejection_reason: vegetableRejectionReason,
                            approved_by: userSession.id
                          })
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                          toast({
                            title: "Vegetable Rejected",
                            description: `${selectedVegetable.name} has been rejected.`,
                          });
                          setSelectedVegetable(null);
                          setVegetableRejectionReason('');
                          fetchOrganicVegetables();
                        } else {
                          throw new Error(data.error);
                        }
                      } catch (error: any) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: error.message || "Failed to reject vegetable",
                        });
                      }
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Review Shop Registration
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shop Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Shop Information</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Shop Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.shopName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Business Type</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.businessType}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">City</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.city}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">State</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.state}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Pincode</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.pincode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.email}</p>
                  </div>
                  {selectedRequest.shopDetails.description && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{selectedRequest.shopDetails.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <div className="mb-3">
                  <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                  <p className="text-xs text-muted-foreground">Shop ID: {selectedRequest.id}</p>
                </div>
                <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50 text-blue-600" />
                  <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Documents Preview Only</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                    Documents are not stored in the system.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                    During registration, shopkeepers can preview their documents, but they are not saved to localStorage or database. 
                    Documents are only for review during the registration process.
                  </p>
                </div>
                {false && (
                  <div className="grid gap-2">
                    {selectedRequest.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{doc.name}</p>
                              {doc.isVerified !== undefined && (
                                <Badge 
                                  variant={doc.isVerified ? "default" : "secondary"}
                                  className={doc.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                >
                                  {doc.isVerified ? "Verified" : "Pending"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{doc.type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                              {doc.fileSize && ` • ${(doc.fileSize / 1024).toFixed(1)} KB`}
                              {doc.fileType && ` • ${doc.fileType}`}
                            </p>
                            {doc.verificationNotes && (
                              <p className="text-xs text-blue-600 mt-1">
                                <strong>Notes:</strong> {doc.verificationNotes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePreviewDocument(doc)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {doc.isVerified === false && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleVerifyDocument(doc.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="mt-1"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectRequest(selectedRequest.id, rejectionReason)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveRequest(selectedRequest.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery Agent Management Section */}
      <div className="mt-12">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Delivery Agent Management</h2>
              <p className="text-muted-foreground">Review and approve delivery agent registration requests</p>
            </div>
            <Button onClick={loadDeliveryAgents} disabled={deliveryAgentLoading} variant="outline">
              {deliveryAgentLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Agents
                </>
              )}
            </Button>
          </div>
        </div>

        {deliveryAgents.length === 0 ? (
          <Card className="p-8 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Delivery Agents Found</h3>
            <p className="text-muted-foreground">No delivery agents have registered yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {deliveryAgents.map(agent => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{agent.name}</h3>
                        <Badge {...getDeliveryAgentStatusBadge(agent.status)}>
                          {getDeliveryAgentStatusIcon(agent.status)}
                          <span className="ml-1 capitalize">{agent.status}</span>
                        </Badge>
                        {agent.isAvailable && agent.status === 'approved' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Email:</span> {agent.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Phone:</span> {agent.phone}
                        </div>
                        <div>
                          <span className="font-medium">Vehicle:</span> {agent.vehicleType?.toUpperCase() || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Vehicle Number:</span> {agent.vehicleNumber || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">License:</span> {agent.licenseNumber || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">Aadhaar:</span> {agent.aadhaarNumber || 'Not provided'}
                        </div>
                        <div className="col-span-2 flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">Address:</span> {agent.address || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Rating:</span> {agent.rating.toFixed(1)}/5.0
                        </div>
                        <div>
                          <span className="font-medium">Total Deliveries:</span> {agent.totalDeliveries}
                        </div>
                        <div>
                          <span className="font-medium">Registered:</span> {new Date(agent.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Last Updated:</span> {new Date(agent.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {agent.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleApproveDeliveryAgent(agent.id)}
                            disabled={deliveryAgentLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleRejectDeliveryAgent(agent.id)}
                            disabled={deliveryAgentLoading}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {agent.status === 'approved' && (
                        <Button 
                          onClick={() => handleSuspendDeliveryAgent(agent.id)}
                          disabled={deliveryAgentLoading}
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Suspend
                        </Button>
                      )}
                      
                      {agent.status === 'suspended' && (
                        <Button 
                          onClick={() => handleApproveDeliveryAgent(agent.id)}
                          disabled={deliveryAgentLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Farmer Management Section */}
      <div className="mt-12">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Farmer Management</h2>
              <p className="text-muted-foreground">Review and approve farmer registration requests</p>
            </div>
            <Button onClick={loadFarmers} disabled={farmerLoading} variant="outline">
              {farmerLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Farmers
                </>
              )}
            </Button>
          </div>
        </div>

        {farmers.length === 0 ? (
          <Card className="p-8 text-center">
            <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Farmers Found</h3>
            <p className="text-muted-foreground">No farmers have registered yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {farmers.map(farmer => (
              <Card key={farmer.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{farmer.name}</h3>
                        <Badge {...getFarmerStatusBadge(farmer.status)}>
                          {getFarmerStatusIcon(farmer.status)}
                          <span className="ml-1">{farmer.status}</span>
                        </Badge>
                        {farmer.isActive && farmer.status === 'APPROVED' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Email:</span> {farmer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Phone:</span> {farmer.phone}
                        </div>
                        <div>
                          <span className="font-medium">Farm Name:</span> {farmer.farmName || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">Farm Size:</span> {farmer.farmSize || 'Not provided'}
                        </div>
                        <div className="col-span-2 flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">Address:</span> {farmer.address || 'Not provided'}
                            {farmer.city && `, ${farmer.city}`}
                            {farmer.state && `, ${farmer.state}`}
                            {farmer.pincode && ` - ${farmer.pincode}`}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Aadhaar:</span> {farmer.aadhaarNumber || 'Not provided'}
                        </div>
                        <div>
                          <span className="font-medium">Organic Certification:</span> {farmer.organicCertification || 'Not provided'}
                        </div>
                        {farmer.cropsGrown && farmer.cropsGrown.length > 0 && (
                          <div className="col-span-2">
                            <span className="font-medium">Crops Grown:</span> {farmer.cropsGrown.join(', ')}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Rating:</span> {farmer.rating.toFixed(1)}/5.0
                        </div>
                        <div>
                          <span className="font-medium">Vegetables Submitted:</span> {farmer.totalVegetablesSubmitted} ({farmer.totalVegetablesApproved} approved)
                        </div>
                        <div>
                          <span className="font-medium">Registered:</span> {new Date(farmer.createdAt).toLocaleDateString()}
                        </div>
                        {farmer.reviewedAt && (
                          <div>
                            <span className="font-medium">Reviewed:</span> {new Date(farmer.reviewedAt).toLocaleDateString()}
                          </div>
                        )}
                        {farmer.rejectionReason && (
                          <div className="col-span-2">
                            <span className="font-medium text-red-600">Rejection Reason:</span> {farmer.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {farmer.status === 'PENDING' && (
                        <>
                          <Button 
                            onClick={() => handleApproveFarmer(farmer.id)}
                            disabled={farmerLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleRejectFarmer(farmer.id)}
                            disabled={farmerLoading}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {farmer.status === 'APPROVED' && (
                        <Button 
                          onClick={() => handleSuspendFarmer(farmer.id)}
                          disabled={farmerLoading}
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Suspend
                        </Button>
                      )}
                      
                      {farmer.status === 'SUSPENDED' && (
                        <Button 
                          onClick={() => handleApproveFarmer(farmer.id)}
                          disabled={farmerLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
