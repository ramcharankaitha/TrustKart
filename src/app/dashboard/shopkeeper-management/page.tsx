'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Flag,
  AlertTriangle
} from 'lucide-react';
import type { ShopRegistrationRequest } from '@/lib/types';
import { mockComplaints } from '@/lib/mock-data';

export default function ShopkeeperManagementPage() {
  const [requests, setRequests] = useState<ShopRegistrationRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRequests, setFilteredRequests] = useState<ShopRegistrationRequest[]>([]);

  useEffect(() => {
    // Load registration requests from localStorage
    const storedRequests = JSON.parse(localStorage.getItem('shopRegistrationRequests') || '[]');
    setRequests(storedRequests);
    setFilteredRequests(storedRequests);
  }, []);

  useEffect(() => {
    // Filter requests based on search term
    const filtered = requests.filter(request => {
      const shopName = request.shopDetails?.shopName || '';
      const city = request.shopDetails?.city || '';
      const email = request.shopDetails?.email || '';
      const phone = request.shopDetails?.phone || '';
      
      return (
        shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm)
      );
    });
    setFilteredRequests(filtered);
  }, [searchTerm, requests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    const updatedRequests = requests.filter(req => req.id !== requestId);
    setRequests(updatedRequests);
    localStorage.setItem('shopRegistrationRequests', JSON.stringify(updatedRequests));
  };

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Shopkeeper Management</h1>
        <p className="text-muted-foreground">Manage all shopkeeper registrations and details</p>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by shop name, city, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {requests.length}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            All ({filteredRequests.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Complaints ({mockComplaints.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No shopkeeper registrations found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
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
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {request.shopDetails.email}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">Business Information</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>Type:</strong> {request.shopDetails.businessType}</p>
                          <p><strong>Address:</strong> {request.shopDetails.address}</p>
                          <p><strong>Pincode:</strong> {request.shopDetails.pincode}</p>
                          {request.shopDetails.description && (
                            <p><strong>Description:</strong> {request.shopDetails.description}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Registration Details</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>Submitted:</strong> {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A'}</p>
                          {request.reviewedAt && (
                            <p><strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleDateString()}</p>
                          )}
                          {request.reviewedBy && (
                            <p><strong>Reviewed By:</strong> {request.reviewedBy}</p>
                          )}
                          {request.rejectionReason && (
                            <p><strong>Rejection Reason:</strong> {request.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

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
                <Card key={request.id} className="border-orange-200">
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
                            <Calendar className="h-4 w-4" />
                            Submitted: {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
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
                <Card key={request.id} className="border-green-200">
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
                            <Calendar className="h-4 w-4" />
                            Approved: {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
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
                <Card key={request.id} className="border-red-200">
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
                            <Calendar className="h-4 w-4" />
                            Rejected: {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
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
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          <div className="grid gap-4">
            {mockComplaints.map((complaint) => (
              <Card key={complaint.id} className={`border-l-4 ${
                complaint.priority === 'urgent' ? 'border-red-500' :
                complaint.priority === 'high' ? 'border-orange-500' :
                complaint.priority === 'medium' ? 'border-yellow-500' :
                'border-green-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flag className="h-5 w-5" />
                        {complaint.subject}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {complaint.shopName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {complaint.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(complaint.submittedAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        complaint.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        complaint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {complaint.priority.toUpperCase()}
                      </Badge>
                      <Badge variant={
                        complaint.status === 'resolved' ? 'default' :
                        complaint.status === 'rejected' ? 'destructive' :
                        complaint.status === 'pending' ? 'secondary' :
                        'outline'
                      }>
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{complaint.description}</p>
                    
                    {complaint.resolution && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <strong>Resolution:</strong> {complaint.resolution}
                        </p>
                      </div>
                    )}

                    {complaint.adminNotes && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Admin Notes:</strong> {complaint.adminNotes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Flag className="h-4 w-4 mr-2" />
                        Take Action
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
