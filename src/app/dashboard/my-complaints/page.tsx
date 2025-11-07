'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Flag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Store,
  Package,
  MessageSquare,
  Shield,
  AlertCircle,
  DollarSign,
  Truck,
  User
} from 'lucide-react';
import type { Complaint } from '@/lib/types';

export default function ComplaintStatusPage() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Simulate loading user's complaints
  useEffect(() => {
    // In a real app, this would filter by current user ID
    // For now, show empty state since we removed mock data
    setComplaints([]);
  }, []);

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'under_review': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'escalated': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product_quality': return <Package className="h-4 w-4" />;
      case 'service_issue': return <MessageSquare className="h-4 w-4" />;
      case 'fraud': return <Shield className="h-4 w-4" />;
      case 'hygiene': return <AlertCircle className="h-4 w-4" />;
      case 'pricing': return <DollarSign className="h-4 w-4" />;
      case 'delivery': return <Truck className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Your complaint is waiting to be reviewed by our admin team.';
      case 'under_review': return 'Your complaint is currently being investigated by our admin team.';
      case 'resolved': return 'Your complaint has been resolved. Please check the resolution details.';
      case 'rejected': return 'Your complaint was not found to be valid after investigation.';
      case 'escalated': return 'Your complaint has been escalated to higher management for review.';
      default: return 'Status unknown.';
    }
  };

  const getComplaintStats = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const underReview = complaints.filter(c => c.status === 'under_review').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const rejected = complaints.filter(c => c.status === 'rejected').length;

    return { total, pending, underReview, resolved, rejected };
  };

  const stats = getComplaintStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Complaints</h1>
          <p className="text-muted-foreground">Track the status of your submitted complaints</p>
        </div>
        <Button asChild>
          <a href="/complaint">
            <Flag className="h-4 w-4 mr-2" />
            Submit New Complaint
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flag className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Complaints</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Under Review</p>
                <p className="text-2xl font-bold">{stats.underReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="search">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label>Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(complaint.type)}
                    <h3 className="text-lg font-semibold">{complaint.subject}</h3>
                    <Badge className={getPriorityColor(complaint.priority)}>
                      {complaint.priority.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(complaint.status)}
                      <span className="text-sm capitalize">{complaint.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span>{complaint.shopName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Submitted: {new Date(complaint.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {complaint.reviewedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Reviewed: {new Date(complaint.reviewedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Status Update:</p>
                    <p className="text-sm text-muted-foreground">
                      {getStatusDescription(complaint.status)}
                    </p>
                  </div>

                  {complaint.resolution && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Resolution:</p>
                      <p className="text-sm text-green-700">{complaint.resolution}</p>
                    </div>
                  )}

                  {complaint.evidence?.images && complaint.evidence.images.length > 0 && (
                    <div className="flex gap-2">
                      {complaint.evidence.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Evidence ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedComplaint(complaint)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {getTypeIcon(complaint.type)}
                          {complaint.subject}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Shop</p>
                            <p>{complaint.shopName}</p>
                          </div>
                          <div>
                            <p className="font-medium">Priority</p>
                            <Badge className={getPriorityColor(complaint.priority)}>
                              {complaint.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">Status</p>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(complaint.status)}
                              <span className="capitalize">{complaint.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Submitted</p>
                            <p>{new Date(complaint.submittedAt).toLocaleString()}</p>
                          </div>
                          {complaint.reviewedAt && (
                            <div>
                              <p className="font-medium">Reviewed</p>
                              <p>{new Date(complaint.reviewedAt).toLocaleString()}</p>
                            </div>
                          )}
                          {complaint.resolutionDate && (
                            <div>
                              <p className="font-medium">Resolved</p>
                              <p>{new Date(complaint.resolutionDate).toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-medium mb-2">Description</p>
                          <p className="text-sm text-muted-foreground">{complaint.description}</p>
                        </div>

                        {complaint.resolution && (
                          <div>
                            <p className="font-medium mb-2">Resolution</p>
                            <p className="text-sm text-muted-foreground">{complaint.resolution}</p>
                          </div>
                        )}

                        {complaint.evidence?.images && complaint.evidence.images.length > 0 && (
                          <div>
                            <p className="font-medium mb-2">Evidence</p>
                            <div className="grid grid-cols-2 gap-2">
                              {complaint.evidence.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Evidence ${index + 1}`}
                                  className="w-full h-32 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredComplaints.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more complaints.'
                  : 'You haven\'t submitted any complaints yet.'}
              </p>
              <Button asChild>
                <a href="/complaint">
                  <Flag className="h-4 w-4 mr-2" />
                  Submit Your First Complaint
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
