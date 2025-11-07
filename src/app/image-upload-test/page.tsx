'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Upload, Image as ImageIcon, Package } from 'lucide-react';
import { SupabaseDB } from '@/lib/supabase-db';

export default function ImageUploadTest() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImageUpload = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const createProductWithImage = async () => {
    if (!productName || !price || !quantity) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const productData: any = {
        name: productName,
        description: 'Test product with image',
        price: Number(price),
        quantity: Number(quantity),
        shop_id: 'test-shop-id', // You'll need to replace this with an actual shop ID
        is_active: true,
        category: 'Test',
        unit: 'piece',
      };

      // Handle image upload
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result as string;
          productData.image_url = base64Image;
          
          console.log('🔍 Creating product with image:', productData);
          
          const { data, error } = await SupabaseDB.createProduct(productData);
          setResult({ data, error });
          setLoading(false);
        };
        reader.readAsDataURL(imageFile);
      } else {
        console.log('🔍 Creating product without image:', productData);
        const { data, error } = await SupabaseDB.createProduct(productData);
        setResult({ data, error });
        setLoading(false);
      }
    } catch (error) {
      setResult({ error: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Image Upload Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload Product Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image">Product Image</Label>
                  <Input 
                    id="image"
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null)} 
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input 
                    id="name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input 
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                
                <Button 
                  onClick={createProductWithImage} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Product...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Create Product with Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Image Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="space-y-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <div className="text-sm text-gray-600">
                      <p><strong>File:</strong> {imageFile?.name}</p>
                      <p><strong>Size:</strong> {imageFile ? Math.round(imageFile.size / 1024) : 0} KB</p>
                      <p><strong>Type:</strong> {imageFile?.type}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No image selected</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertDescription>
              <strong>How to test:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Select an image file (JPG, PNG, etc.)</li>
                <li>Fill in the product details</li>
                <li>Click "Create Product with Image"</li>
                <li>Check the result to see if the image was saved</li>
                <li>Go to customer dashboard to see if the image displays</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
