'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  MessageSquare, 
  Flag, 
  Search,
  Filter,
  Calendar,
  User,
  Store,
  Package,
  DollarSign,
  Shield,
  Ban,
  AlertCircle
} from 'lucide-react';
import type { Complaint, ComplaintAction } from '@/lib/types';

export default function ComplaintsPage() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [actions, setActions] = useState<ComplaintAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionForm, setActionForm] = useState({
    actionType: '',
    description: '',
    amount: '',
    duration: ''
  });

  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>(complaints);

  useEffect(() => {
    // Load complaints from localStorage
    const storedComplaints = localStorage.getItem('complaints');
    if (storedComplaints) {
      try {
        const parsedComplaints = JSON.parse(storedComplaints);
        setComplaints(parsedComplaints);
      } catch (error) {
        console.error('Error parsing stored complaints:', error);
        setComplaints([]);
      }
    } else {
      setComplaints([]);
    }
  }, []);

  useEffect(() => {
    let filtered = complaints;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.type === typeFilter);
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, priorityFilter, typeFilter]);

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
      case 'delivery': return <Package className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fine': return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'suspension': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'termination': return <Ban className="h-4 w-4 text-red-500" />;
      case 'shop_closure': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleTakeAction = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsActionDialogOpen(true);
  };

  const handleSubmitAction = () => {
    if (!selectedComplaint || !actionForm.actionType || !actionForm.description) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    const newAction: ComplaintAction = {
      id: `action-${Date.now()}`,
      complaintId: selectedComplaint.id,
      actionType: actionForm.actionType as ComplaintAction['actionType'],
      description: actionForm.description,
      amount: actionForm.amount ? parseFloat(actionForm.amount) : undefined,
      duration: actionForm.duration ? parseInt(actionForm.duration) : undefined,
      effectiveDate: new Date(),
      adminId: 'admin-1',
      adminName: 'Admin User',
      status: 'active',
      createdAt: new Date()
    };

    setActions(prev => [...prev, newAction]);

    // Update complaint status based on action
    let newStatus = selectedComplaint.status;
    if (actionForm.actionType === 'shop_closure' || actionForm.actionType === 'termination') {
      newStatus = 'resolved';
    } else if (actionForm.actionType === 'suspension') {
      newStatus = 'under_review';
    }

    const updatedComplaints = complaints.map(complaint => 
      complaint.id === selectedComplaint.id 
        ? { 
            ...complaint, 
            status: newStatus,
            reviewedAt: new Date(),
            reviewedBy: 'admin-1',
            adminNotes: actionForm.description
          }
        : complaint
    );

    setComplaints(updatedComplaints);

    // Update localStorage
    localStorage.setItem('complaints', JSON.stringify(updatedComplaints));

    // Update shop status based on admin action
    const shopId = selectedComplaint.shopId;
    let newShopStatus = 'approved'; // Default status
    
    switch (actionForm.actionType) {
      case 'suspension':
        newShopStatus = 'suspended';
        break;
      case 'termination':
        newShopStatus = 'terminated';
        break;
      case 'shop_closure':
        newShopStatus = 'closed';
        break;
      case 'warning':
      case 'fine':
        // Keep shop active for warnings and fines
        newShopStatus = 'approved';
        break;
    }

    // Update shop status in localStorage
    const storedShops = localStorage.getItem('shops');
    if (storedShops) {
      try {
        const shops = JSON.parse(storedShops);
        const updatedShops = shops.map((shop: any) => 
          shop.id === shopId 
            ? { ...shop, status: newShopStatus }
            : shop
        );
        localStorage.setItem('shops', JSON.stringify(updatedShops));
      } catch (error) {
        console.error('Error updating shop status:', error);
      }
    }

    toast({
      title: "Action Taken",
      description: `${actionForm.actionType} action has been applied to the complaint.`,
    });

    setIsActionDialogOpen(false);
    setActionForm({ actionType: '', description: '', amount: '', duration: '' });
    setSelectedComplaint(null);
  };

  const getComplaintActions = (complaintId: string) => {
    return actions.filter(action => action.complaintId === complaintId);
  };

  const getComplaintStats = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const underReview = complaints.filter(c => c.status === 'under_review').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const urgent = complaints.filter(c => c.priority === 'urgent').length;

    return { total, pending, underReview, resolved, urgent };
  };

  const stats = getComplaintStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complaint Management</h1>
          <p className="text-muted-foreground">Manage customer complaints and take appropriate actions</p>
        </div>
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
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Urgent</p>
                <p className="text-2xl font-bold">{stats.urgent}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
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
              <Label>Status</Label>
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
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product_quality">Product Quality</SelectItem>
                  <SelectItem value="service_issue">Service Issue</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                  <SelectItem value="hygiene">Hygiene</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                      <User className="h-4 w-4" />
                      <span>{complaint.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span>{complaint.shopName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(complaint.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>

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

                  {/* Actions taken */}
                  {getComplaintActions(complaint.id).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Actions Taken:</p>
                      <div className="flex flex-wrap gap-2">
                        {getComplaintActions(complaint.id).map((action) => (
                          <Badge key={action.id} variant="outline" className="flex items-center gap-1">
                            {getActionIcon(action.actionType)}
                            <span className="capitalize">{action.actionType.replace('_', ' ')}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
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
                            <p className="font-medium">Customer</p>
                            <p>{complaint.customerName} ({complaint.customerEmail})</p>
                          </div>
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
                        </div>

                        <div>
                          <p className="font-medium mb-2">Description</p>
                          <p className="text-sm text-muted-foreground">{complaint.description}</p>
                        </div>

                        {complaint.adminNotes && (
                          <div>
                            <p className="font-medium mb-2">Admin Notes</p>
                            <p className="text-sm text-muted-foreground">{complaint.adminNotes}</p>
                          </div>
                        )}

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

                  {complaint.status !== 'resolved' && complaint.status !== 'rejected' && (
                    <Button 
                      onClick={() => handleTakeAction(complaint)}
                      size="sm"
                      variant="default"
                    >
                      Take Action
                    </Button>
                  )}
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
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more complaints.'
                  : 'No complaints have been submitted yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Action on Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedComplaint && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedComplaint.subject}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedComplaint.customerName} • {selectedComplaint.shopName}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select value={actionForm.actionType} onValueChange={(value) => setActionForm(prev => ({ ...prev, actionType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="fine">Fine</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="termination">Termination</SelectItem>
                  <SelectItem value="shop_closure">Shop Closure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the action being taken..."
                value={actionForm.description}
                onChange={(e) => setActionForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {actionForm.actionType === 'fine' && (
              <div className="space-y-2">
                <Label htmlFor="amount">Fine Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter fine amount"
                  value={actionForm.amount}
                  onChange={(e) => setActionForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            )}

            {actionForm.actionType === 'suspension' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Suspension Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Enter suspension duration"
                  value={actionForm.duration}
                  onChange={(e) => setActionForm(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitAction}>
                Submit Action
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
