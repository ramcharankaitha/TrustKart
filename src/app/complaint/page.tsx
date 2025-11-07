'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Flag, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  MessageSquare, 
  Shield, 
  AlertCircle, 
  DollarSign, 
  Truck,
  Store,
  User,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { mockShops, mockProducts } from '@/lib/mock-data';
import type { Complaint } from '@/lib/types';

export default function SubmitComplaintPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    shopId: '',
    productId: '',
    orderId: '',
    type: '',
    priority: 'medium',
    subject: '',
    description: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const complaintTypes = [
    { value: 'product_quality', label: 'Product Quality Issue', icon: Package, description: 'Product is damaged, expired, or not as described' },
    { value: 'service_issue', label: 'Service Issue', icon: MessageSquare, description: 'Poor customer service or staff behavior' },
    { value: 'fraud', label: 'Fraud/Counterfeit', icon: Shield, description: 'Suspected fake or counterfeit products' },
    { value: 'hygiene', label: 'Hygiene Concerns', icon: AlertCircle, description: 'Poor hygiene standards or food safety issues' },
    { value: 'pricing', label: 'Pricing Issues', icon: DollarSign, description: 'Overcharging or incorrect pricing' },
    { value: 'delivery', label: 'Delivery Issues', icon: Truck, description: 'Problems with order delivery or packaging' },
    { value: 'other', label: 'Other', icon: Flag, description: 'Any other complaint not listed above' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const selectedShop = mockShops.find(shop => shop.id === formData.shopId);
  const selectedProduct = mockProducts.find(product => product.id === formData.productId);
  const selectedType = complaintTypes.find(type => type.value === formData.type);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newImages.push(result);
          if (newImages.length === files.length) {
            setEvidenceImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.shopId || !formData.type || !formData.subject || !formData.description || !formData.customerName || !formData.customerEmail) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}`,
      customerId: `customer-${Date.now()}`,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      shopId: formData.shopId,
      shopName: selectedShop?.name || '',
      productId: formData.productId || undefined,
      productName: selectedProduct?.name || undefined,
      orderId: formData.orderId || undefined,
      type: formData.type as Complaint['type'],
      priority: formData.priority as Complaint['priority'],
      status: 'pending',
      subject: formData.subject,
      description: formData.description,
      evidence: {
        images: evidenceImages,
        documents: []
      },
      submittedAt: new Date(),
      followUpRequired: formData.priority === 'urgent' || formData.priority === 'high',
      followUpDate: formData.priority === 'urgent' || formData.priority === 'high' 
        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        : undefined
    };

    // Store complaint in localStorage for admin dashboard to access
    const existingComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    existingComplaints.push(newComplaint);
    localStorage.setItem('complaints', JSON.stringify(existingComplaints));

    // In a real app, this would be sent to the backend
    console.log('New complaint submitted:', newComplaint);

    toast({
      title: "Complaint Submitted Successfully",
      description: "Your complaint has been submitted and will be reviewed by our admin team.",
    });

    // Reset form
    setFormData({
      shopId: '',
      productId: '',
      orderId: '',
      type: '',
      priority: 'medium',
      subject: '',
      description: '',
      customerName: '',
      customerEmail: '',
      customerPhone: ''
    });
    setEvidenceImages([]);
    setIsSubmitting(false);

    // Redirect to shopping page after 2 seconds
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Submit a Complaint</h1>
        <p className="text-muted-foreground">
          Help us improve our service by reporting any issues you've encountered
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shop and Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop & Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopId">Shop *</Label>
              <Select value={formData.shopId} onValueChange={(value) => handleInputChange('shopId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the shop" />
                </SelectTrigger>
                <SelectContent>
                  {mockShops.filter(shop => shop.status === 'approved').map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name} - {shop.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedShop && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-4 w-4" />
                  <span className="font-medium">{selectedShop.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedShop.address}</p>
                <p className="text-sm text-muted-foreground">{selectedShop.phone}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="productId">Product (Optional)</Label>
              <Select value={formData.productId} onValueChange={(value) => handleInputChange('productId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the product (if applicable)" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.filter(product => product.shopId === formData.shopId).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₹{product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{selectedProduct.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">Price: ₹{selectedProduct.price}</p>
                <p className="text-sm text-muted-foreground">Category: {selectedProduct.category}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID (Optional)</Label>
              <Input
                id="orderId"
                value={formData.orderId}
                onChange={(e) => handleInputChange('orderId', e.target.value)}
                placeholder="Enter order ID if applicable"
              />
            </div>
          </CardContent>
        </Card>

        {/* Complaint Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Complaint Type *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaintTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-medium">{type.label}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Priority Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {priorityLevels.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.priority === priority.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => handleInputChange('priority', priority.value)}
                >
                  <Badge className={priority.color}>
                    {priority.label}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complaint Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Complaint Details *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Brief description of your complaint"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Please provide detailed information about the issue..."
                rows={6}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Evidence Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Evidence (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evidence">Upload Images</Label>
              <Input
                id="evidence"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Upload photos or screenshots that support your complaint (max 5 images)
              </p>
            </div>

            {evidenceImages.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {evidenceImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {formData.type && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Complaint Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Complaint Type:</p>
                  <p className="text-muted-foreground">{selectedType?.label}</p>
                </div>
                <div>
                  <p className="font-medium">Priority:</p>
                  <Badge className={priorityLevels.find(p => p.value === formData.priority)?.color}>
                    {priorityLevels.find(p => p.value === formData.priority)?.label}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">Shop:</p>
                  <p className="text-muted-foreground">{selectedShop?.name || 'Not selected'}</p>
                </div>
                <div>
                  <p className="font-medium">Product:</p>
                  <p className="text-muted-foreground">{selectedProduct?.name || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-32">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2" />
                Submit Complaint
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Submission
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this complaint? Once submitted, it will be reviewed by our admin team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Complaint Summary:</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Type:</span> {selectedType?.label}</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Priority:</span>
                  <Badge className={priorityLevels.find(p => p.value === formData.priority)?.color}>
                    {priorityLevels.find(p => p.value === formData.priority)?.label}
                  </Badge>
                </div>
                <p><span className="font-medium">Shop:</span> {selectedShop?.name}</p>
                <p><span className="font-medium">Subject:</span> {formData.subject}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="min-w-24"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
