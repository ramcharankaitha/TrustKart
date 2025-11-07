'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Tag,
  DollarSign,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { SupabaseDB } from '@/lib/supabase-db';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  shop_name: string;
  shop_id: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  created_at: string;
  expiry_date?: string;
}

export default function ProductsManagementPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Open Add Product dialog if ?add=1 present
    try {
      const add = searchParams?.get('add');
      if (add === '1') setShowAddProduct(true);
    } catch {}
  }, [searchParams]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Fetch products for the logged-in shopkeeper's shop
      const session = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
      let ownerId: string | null = null;
      if (session) {
        try { ownerId = JSON.parse(session).id as string; } catch {}
      }

      if (ownerId) {
        const { data: shops, error: shopErr } = await SupabaseDB.getShopsByOwner(ownerId);
        if (!shopErr && shops && shops.length > 0) {
          const shop = shops[0];
          const { data, error } = await SupabaseDB.getProductsByShop(shop.id);
          if (!error && Array.isArray(data)) {
            const mapped: Product[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              price: Number(p.price),
              category: p.category || 'General', // Default category if column doesn't exist
              stock: p.quantity ?? 0,
              shop_name: shop.name,
              shop_id: shop.id,
              status: p.is_active === false ? 'inactive' : (p.quantity === 0 ? 'out_of_stock' : 'active'),
              created_at: p.created_at,
              expiry_date: p.expiry_date,
            }));
            setProducts(mapped);
            return;
          }
        }
      }

      // Fallback: keep list empty if no DB
      setProducts([]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'out_of_stock':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Fruits & Vegetables': 'bg-green-100 text-green-800',
      'Dairy & Eggs': 'bg-blue-100 text-blue-800',
      'Bakery': 'bg-yellow-100 text-yellow-800',
      'Meat & Seafood': 'bg-red-100 text-red-800',
      'Beverages': 'bg-purple-100 text-purple-800',
      'Snacks': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge variant="secondary" className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.shop_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    lowStock: products.filter(p => p.stock < 10 && p.stock > 0).length,
    categories: [...new Set(products.map(p => p.category))].length,
  };

  // Category options matching customer dashboard
  const categories = [
    { value: 'Fruits & Vegetables', label: 'Fruits & Vegetables', icon: '🥬' },
    { value: 'Dairy & Eggs', label: 'Dairy & Eggs', icon: '🥛' },
    { value: 'Meat & Seafood', label: 'Meat & Seafood', icon: '🥩' },
    { value: 'Bakery', label: 'Bakery', icon: '🍞' },
    { value: 'Beverages', label: 'Beverages', icon: '🥤' },
    { value: 'Snacks', label: 'Snacks', icon: '🍿' },
    { value: 'Grocery Store', label: 'Grocery Store', icon: '🛒' },
    { value: 'Pharmacy', label: 'Pharmacy', icon: '💊' },
    { value: 'General', label: 'General', icon: '📦' }
  ];

  return (
    <div className="container mx-auto my-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Products Management</h1>
        <p className="text-muted-foreground">View all products, Add new product, Manage categories</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{stats.categories}</p>
              </div>
              <Tag className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, description, or shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter by Category
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterCategory('all')}>
              All Categories
            </DropdownMenuItem>
            {categories.map(category => (
              <DropdownMenuItem key={category} onClick={() => setFilterCategory(category)}>
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[92vw] max-w-lg md:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your shop
              </DialogDescription>
            </DialogHeader>
            { /* Add Product Form - detailed */ }
            <AddProductForm onSaved={() => { setShowAddProduct(false); loadProducts(); }} onCancel={() => setShowAddProduct(false)} />
          </DialogContent>
        </Dialog>
        <Button onClick={loadProducts} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">No products match your search criteria.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        {getStatusBadge(product.status)}
                        {getCategoryBadge(product.category)}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{product.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">₹{product.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Stock: {product.stock}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{product.shop_name}</span>
                        </div>
                        {product.expiry_date && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <span>Expires: {new Date(product.expiry_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>View Analytics</DropdownMenuItem>
                          <DropdownMenuItem>Update Stock</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddProductForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [finalPrice, setFinalPrice] = useState(0);
  const [stockQty, setStockQty] = useState<number | ''>('');
  const [unit, setUnit] = useState('piece');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [expiry, setExpiry] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    const p = Number(price) || 0;
    const d = Number(discount) || 0;
    const calc = Math.max(0, p - (p * d) / 100);
    setFinalPrice(Number.isFinite(calc) ? Math.round(calc * 100) / 100 : 0);
  }, [price, discount]);

  useEffect(() => {
    // Prefill shop info from session / DB
    const loadShop = async () => {
      try {
        const session = sessionStorage.getItem('userSession');
        if (!session) return;
        const user = JSON.parse(session);
        // Try DB first
        const res = await SupabaseDB.getShopsByOwner(user.id);
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const s = res.data[0];
          setShopId(s.id);
          setShopName(s.name || '');
          setShopLocation(s.address || '');
          localStorage.setItem('currentShopName', s.name || '');
          localStorage.setItem('currentShopLocation', s.address || '');
          return;
        }
        // Fallback to local cache
        const cachedShop = localStorage.getItem('currentShopName');
        if (cachedShop) setShopName(cachedShop);
        const cachedLoc = localStorage.getItem('currentShopLocation');
        if (cachedLoc) setShopLocation(cachedLoc);
      } catch {}
    };
    loadShop();
  }, []);

  const handleImage = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setName('');
    setCategory('General');
    setBrand('');
    setDescription('');
    setSku('');
    setPrice('');
    setDiscount('');
    setStockQty('');
    setUnit('piece');
    setImageFile(null);
    setImagePreview(null);
    setActive(true);
    setExpiry('');
  };

  const save = async () => {
    if (!name || !price || !stockQty) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Name, Price and Stock are required.' });
      return;
    }
    if (!shopId) {
      toast({ variant: 'destructive', title: 'No shop found', description: 'Could not determine your shop. Please register/approve your shop first.' });
      return;
    }
    try {
      // Create product with all available fields
      const productData: any = {
        name,
        description: description || '',
        price: Number(price),
        quantity: Number(stockQty),
        shop_id: shopId,
        is_active: active,
        category: category || 'General',
        unit: unit || 'piece',
      };

      // Handle image upload - convert to base64 for now (in production, upload to cloud storage)
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result as string;
          productData.image_url = base64Image;
          
          // Only add optional fields if they have values
          if (expiry) {
            productData.expiry_date = expiry;
          }
          if (sku) {
            productData.sku = sku;
          }
          if (brand) {
            productData.brand = brand;
          }

          console.log('🔍 Creating product with data:', productData);

          const { data, error } = await SupabaseDB.createProduct(productData);
          if (error) {
            toast({ variant: 'destructive', title: 'Save failed', description: error.message || 'Could not save product' });
            return;
          }
          toast({ title: 'Product Added', description: `${name} saved successfully with image.` });
          onSaved();
        };
        reader.readAsDataURL(imageFile);
      } else {
        // No image, save product directly
        // Only add optional fields if they have values
        if (expiry) {
          productData.expiry_date = expiry;
        }
        if (sku) {
          productData.sku = sku;
        }
        if (brand) {
          productData.brand = brand;
        }

        console.log('🔍 Creating product with data:', productData);

        const { data, error } = await SupabaseDB.createProduct(productData);
        if (error) {
          toast({ variant: 'destructive', title: 'Save failed', description: error.message || 'Could not save product' });
          return;
        }
        toast({ title: 'Product Added', description: `${name} saved successfully.` });
        onSaved();
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e?.message || 'Unexpected error' });
    }
  };

  // Category options for shopkeeper (matching customer categories)
  const categoryOptions = [
    { value: 'Fruits & Vegetables', label: 'Fruits & Vegetables', icon: '🥬' },
    { value: 'Dairy & Eggs', label: 'Dairy & Eggs', icon: '🥛' },
    { value: 'Meat & Seafood', label: 'Meat & Seafood', icon: '🥩' },
    { value: 'Bakery', label: 'Bakery', icon: '🍞' },
    { value: 'Beverages', label: 'Beverages', icon: '🥤' },
    { value: 'Snacks', label: 'Snacks', icon: '🍿' },
    { value: 'Grocery Store', label: 'Grocery Store', icon: '🛒' },
    { value: 'Pharmacy', label: 'Pharmacy', icon: '💊' },
    { value: 'General', label: 'General', icon: '📦' }
  ];
  const units = ['kg', 'g', 'L', 'ml', 'piece', 'pack'];

  return (
    <div className="grid gap-3 py-1 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Product Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter product name" />
        </div>
        <div>
          <Label>Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Select the category so customers can easily find your product
          </p>
        </div>
        <div>
          <Label>Brand Name</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" />
        </div>
        <div>
          <Label>SKU / Product Code</Label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU / Code" />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the product" />
        </div>
        <div>
          <Label>Price (₹)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
        </div>
        <div>
          <Label>Discount (%)</Label>
          <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
        </div>
        <div>
          <Label>Final Price</Label>
          <Input value={finalPrice.toString()} readOnly />
        </div>
        <div>
          <Label>Stock Quantity</Label>
          <Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
        </div>
        <div>
          <Label>Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Expiry Date</Label>
          <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Product Image Upload</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleImage(e.target.files?.[0] || null)} />
          </div>
          <div className="flex items-end justify-start gap-2">
            {imagePreview ? (
              <Image src={imagePreview} alt="preview" width={64} height={64} className="rounded border" />
            ) : (
              <div className="w-16 h-16 rounded border flex items-center justify-center text-xs text-muted-foreground">Preview</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} id="status" />
          <Label htmlFor="status">Status: {active ? 'Active' : 'Inactive'}</Label>
        </div>
        <div>
          <Label>Shop Name</Label>
          <Input value={shopName} readOnly />
        </div>
        <div>
          <Label>Shop Location</Label>
          <Input value={shopLocation} readOnly />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel}>Cancel / Back</Button>
        <Button variant="outline" onClick={reset}>Reset</Button>
        <Button onClick={save}>Save / Add Product</Button>
      </div>
    </div>
  );
}