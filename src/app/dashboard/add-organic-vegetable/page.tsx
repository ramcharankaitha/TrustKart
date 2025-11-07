'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Leaf, 
  Upload, 
  Loader2, 
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const vegetableCategories = [
  'Leafy Greens',
  'Root Vegetables',
  'Fruits',
  'Herbs',
  'Legumes',
  'Other'
];

const units = ['kg', 'piece', 'bundle', 'dozen', 'pack'];

export default function AddOrganicVegetablePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    category: '',
    image_url: '',
    origin: '',
    certification: '',
    farmer_name: '',
    farmer_contact: '',
    quantity_available: '',
    min_order_quantity: '1',
    // Nutritional info
    calories: '',
    protein: '',
    carbohydrates: '',
    fat: '',
    fiber: '',
    vitamins: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 for preview/storage
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, image_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get user session
      const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      if (!userSession.id) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to add vegetables.",
        });
        router.push('/login');
        return;
      }

      // Prepare nutritional info
      const nutritional_info: any = {};
      if (formData.calories) nutritional_info.calories = parseFloat(formData.calories);
      if (formData.protein) nutritional_info.protein = parseFloat(formData.protein);
      if (formData.carbohydrates) nutritional_info.carbohydrates = parseFloat(formData.carbohydrates);
      if (formData.fat) nutritional_info.fat = parseFloat(formData.fat);
      if (formData.fiber) nutritional_info.fiber = parseFloat(formData.fiber);
      if (formData.vitamins) {
        nutritional_info.vitamins = formData.vitamins.split(',').map(v => v.trim()).filter(v => v);
      }

      // Get shop ID if user is a shopkeeper
      let shop_id = null;
      if (userSession.role?.toLowerCase() === 'shopkeeper') {
        // Try to get shop ID from shops table
        try {
          const response = await fetch('/api/shops?ownerId=' + userSession.id);
          const data = await response.json();
          if (data.success && data.shops && data.shops.length > 0) {
            shop_id = data.shops[0].id;
          }
        } catch (error) {
          console.log('Could not fetch shop ID, continuing without it');
        }
      }

      // Submit vegetable
      const response = await fetch('/api/organic-vegetables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          unit: formData.unit,
          category: formData.category || null,
          image_url: formData.image_url || null,
          nutritional_info: Object.keys(nutritional_info).length > 0 ? nutritional_info : null,
          origin: formData.origin || null,
          certification: formData.certification || null,
          farmer_name: formData.farmer_name || null,
          farmer_contact: formData.farmer_contact || null,
          quantity_available: formData.quantity_available || 0,
          min_order_quantity: formData.min_order_quantity || 1,
          shop_id: shop_id,
          submitted_by: userSession.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit vegetable');
      }

      setSuccess(true);
      toast({
        title: "Vegetable Submitted!",
        description: "Your organic vegetable has been submitted for admin approval. You'll be notified once it's reviewed.",
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          price: '',
          unit: 'kg',
          category: '',
          image_url: '',
          origin: '',
          certification: '',
          farmer_name: '',
          farmer_contact: '',
          quantity_available: '',
          min_order_quantity: '1',
          calories: '',
          protein: '',
          carbohydrates: '',
          fat: '',
          fiber: '',
          vitamins: '',
        });
        setSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error submitting vegetable:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit vegetable. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Add Organic Vegetable</h1>
            <p className="text-muted-foreground">Submit your organic vegetable for admin approval</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vegetable Information</CardTitle>
          <CardDescription>
            Fill in the details about your organic vegetable. All submissions require admin approval before being visible to customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Submitted Successfully!</h3>
              <p className="text-muted-foreground">
                Your organic vegetable has been submitted for admin approval.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vegetable Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Organic Tomatoes"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {vegetableCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the vegetable, its benefits, freshness, etc."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity_available">Available Quantity</Label>
                    <Input
                      id="quantity_available"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity_available}
                      onChange={(e) => handleInputChange('quantity_available', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_order_quantity">Minimum Order Quantity</Label>
                  <Input
                    id="min_order_quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.min_order_quantity}
                    onChange={(e) => handleInputChange('min_order_quantity', e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Image</h3>
                <div className="space-y-2">
                  <Label htmlFor="image">Vegetable Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Farmer/Origin Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Origin & Certification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmer_name">Farmer/Supplier Name</Label>
                    <Input
                      id="farmer_name"
                      value={formData.farmer_name}
                      onChange={(e) => handleInputChange('farmer_name', e.target.value)}
                      placeholder="Name of farmer or supplier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="farmer_contact">Farmer Contact</Label>
                    <Input
                      id="farmer_contact"
                      value={formData.farmer_contact}
                      onChange={(e) => handleInputChange('farmer_contact', e.target.value)}
                      placeholder="Phone or email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origin/Location</Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e) => handleInputChange('origin', e.target.value)}
                      placeholder="e.g., Local Farm, Karnataka"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certification">Organic Certification</Label>
                    <Input
                      id="certification"
                      value={formData.certification}
                      onChange={(e) => handleInputChange('certification', e.target.value)}
                      placeholder="e.g., NPOP Certified, USDA Organic"
                    />
                  </div>
                </div>
              </div>

              {/* Nutritional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Nutritional Information (Optional)</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories (per 100g)</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.calories}
                      onChange={(e) => handleInputChange('calories', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) => handleInputChange('protein', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbohydrates">Carbs (g)</Label>
                    <Input
                      id="carbohydrates"
                      type="number"
                      step="0.1"
                      value={formData.carbohydrates}
                      onChange={(e) => handleInputChange('carbohydrates', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      step="0.1"
                      value={formData.fat}
                      onChange={(e) => handleInputChange('fat', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiber">Fiber (g)</Label>
                    <Input
                      id="fiber"
                      type="number"
                      step="0.1"
                      value={formData.fiber}
                      onChange={(e) => handleInputChange('fiber', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vitamins">Vitamins (comma-separated)</Label>
                    <Input
                      id="vitamins"
                      value={formData.vitamins}
                      onChange={(e) => handleInputChange('vitamins', e.target.value)}
                      placeholder="e.g., Vitamin A, Vitamin C"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit for Approval
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Note:</p>
                    <p>Your vegetable will be reviewed by an admin before being made available to customers. You'll be notified once it's approved or if any changes are needed.</p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

