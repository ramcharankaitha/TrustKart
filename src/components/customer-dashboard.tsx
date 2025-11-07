'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Star, Clock, ShoppingCart, Heart, 
  Filter, SortAsc, Leaf, Sparkles, Truck, Shield,
  ArrowRight, Plus, Minus, Eye, EyeOff, CheckCircle,
  Bell, AlertCircle
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useNotifications } from "@/context/notification-context";
import type { Shop, Product, ProductCategory } from "@/lib/types";
import { CustomerDatabasePlugin } from "@/lib/plugins/customer-database-plugin";
import { SupabaseDB } from "@/lib/supabase-db";
import { useToast } from "@/hooks/use-toast";
import { useAutoLocation } from "@/hooks/use-auto-location";
import { Chatbot } from "@/components/chatbot";

// Categories matching shopkeeper registration form - Updated to match user requirements
const categories: ProductCategory[] = [
  { 
    id: 'cat-1', 
    name: 'Grocery Store', 
    icon: '🛒', 
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80', 
    imageHint: 'General grocery items' 
  },
  { 
    id: 'cat-2', 
    name: 'Pharmacy', 
    icon: '💊', 
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop&q=80', 
    imageHint: 'Pharmacy and medical products' 
  },
  { 
    id: 'cat-3', 
    name: 'Restaurant', 
    icon: '🍽️', 
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80', 
    imageHint: 'Restaurant and food service' 
  },
  { 
    id: 'cat-4', 
    name: 'Bakery', 
    icon: '🍞', 
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop&q=80', 
    imageHint: 'Fresh bakery items and bread' 
  },
  { 
    id: 'cat-5', 
    name: 'Dairy Products', 
    icon: '🥛', 
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&h=600&fit=crop&q=80', 
    imageHint: 'Fresh dairy products and eggs' 
  },
];

// Map categories to business types that shops might use (matching shopkeeper registration)
const categoryToBusinessType = (categoryName: string): string[] => {
  const mapping: { [key: string]: string[] } = {
    'Grocery Store': ['grocery', 'general store', 'supermarket', 'convenience store', 'grocery store'],
    'Pharmacy': ['pharmacy', 'medical', 'health', 'medicine', 'pharmaceutical'],
    'Restaurant': ['restaurant', 'food', 'dining', 'eatery', 'cafe', 'café'],
    'Bakery': ['bakery', 'bread', 'cakes', 'pastries', 'baker'],
    'Dairy Products': ['dairy', 'dairy products', 'milk', 'eggs', 'dairy shop'],
  };
  return mapping[categoryName] || [categoryName.toLowerCase()];
};

// Approved shops will be fetched from database
const mockShops: Shop[] = [];

// Products will be fetched from database for each shop
const mockProducts: Product[] = [];

const ShopCard = ({ shop, onSelect }: { shop: Shop; onSelect: () => void }) => (
  <Card className="card-interactive border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={onSelect}>
    <div className="relative">
      <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-t-2xl flex items-center justify-center">
        <div className="text-6xl">🏪</div>
      </div>
      <div className="absolute top-4 right-4">
        <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
          <Shield className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      </div>
    </div>
    
    <CardContent className="p-6">
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-primary transition-colors">
            {shop.name}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {shop.description || 'Quality products and fast delivery'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <MapPin className="h-4 w-4" />
          <span>{shop.address}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-slate-800 dark:text-white">{shop.rating}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{shop.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              <span>{shop.deliveryFee}</span>
            </div>
          </div>
        </div>
        
        <Button className="w-full btn-primary group-hover:scale-105 transition-transform duration-200">
          Browse Products
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ProductCard = ({ product, onAddToCart, onRemoveFromCart, getQuantity }: { 
  product: Product; 
  onAddToCart: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  getQuantity: (productId: string) => number;
}) => {
  const quantity = getQuantity(product.id);
  const daysUntilExpiry = product.expiryDate ? Math.ceil((product.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  // Determine expiry status and glow color
  const getExpiryStatus = () => {
    if (!product.expiryDate) return { status: 'no-expiry', color: 'gray', glow: '' };
    
    if (daysUntilExpiry > 7) {
      return { status: 'fresh', color: 'green', glow: 'shadow-green-500/50' };
    } else if (daysUntilExpiry > 3) {
      return { status: 'mid-expiry', color: 'yellow', glow: 'shadow-yellow-500/50' };
    } else if (daysUntilExpiry > 0) {
      return { status: 'near-expiry', color: 'red', glow: 'shadow-red-500/50' };
    } else {
      return { status: 'expired', color: 'red', glow: 'shadow-red-500/50' };
    }
  };

  const expiryStatus = getExpiryStatus();

  return (
    <Card className="card-interactive border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl flex items-center justify-center overflow-hidden">
          {product.imageUrl && product.imageUrl !== '/api/placeholder/200/200' ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover rounded-t-2xl"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`text-5xl ${product.imageUrl && product.imageUrl !== '/api/placeholder/200/200' ? 'hidden' : 'flex items-center justify-center'}`}>
            🍎
          </div>
        </div>
        {expiryStatus.status === 'near-expiry' || expiryStatus.status === 'expired' ? (
          <div className="absolute top-4 right-4">
            <Badge className={`px-2 py-1 ${
              expiryStatus.status === 'expired' ? 'bg-red-100 text-red-700 border-red-200' :
              'bg-orange-100 text-orange-700 border-orange-200'
            }`}>
              <Clock className="h-3 w-3 mr-1" />
              {expiryStatus.status === 'expired' ? 'Expired' : 'Expires Soon'}
            </Badge>
          </div>
        ) : expiryStatus.status === 'fresh' ? (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-100 text-green-700 border-green-200 px-2 py-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Fresh
            </Badge>
          </div>
        ) : expiryStatus.status === 'mid-expiry' ? (
          <div className="absolute top-4 right-4">
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-2 py-1">
              <Clock className="h-3 w-3 mr-1" />
              Mid Expiry
            </Badge>
          </div>
        ) : null}
        <button className="absolute top-4 left-4 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors">
          <Heart className="h-4 w-4 text-slate-600 hover:text-red-500" />
        </button>
            </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors flex-1">
                {product.name}
              </h3>
              {expiryStatus.status !== 'no-expiry' && (
                <div className={`w-3 h-3 rounded-full ${
                  expiryStatus.color === 'green' ? 'bg-green-500' :
                  expiryStatus.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                } ${
                  expiryStatus.glow ? `shadow-lg ${expiryStatus.glow} animate-pulse` : ''
                }`}></div>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              {product.description}
            </p>
            {expiryStatus.status !== 'no-expiry' && (
              <div className="mb-2">
                <span className={`px-2 py-1 rounded-full text-white text-xs ${
                  expiryStatus.color === 'green' ? 'bg-green-500' :
                  expiryStatus.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {expiryStatus.status === 'fresh' ? 'Fresh' :
                   expiryStatus.status === 'mid-expiry' ? 'Mid Expiry' :
                   expiryStatus.status === 'near-expiry' ? 'Expires Soon' :
                   'Expired'} ({daysUntilExpiry} days)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              ₹{product.price}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/{product.unit}</span>
            </div>
            <div className={`text-sm font-medium ${
              product.stockQty === 0 
                ? 'text-red-600 dark:text-red-400' 
                : product.stockQty < 10 
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {product.stockQty === 0 ? (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Out of Stock
                </span>
              ) : product.stockQty < 10 ? (
                <span className="flex items-center gap-1">
                  <span>Only {product.stockQty} left</span>
                </span>
              ) : (
                <span>In Stock ({product.stockQty})</span>
              )}
            </div>
          </div>

          {/* Stock Status Warning */}
          {product.stockQty === 0 ? (
            <div className="space-y-2">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Out of Stock
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  This product is currently unavailable
                </p>
              </div>
              <Button 
                className="w-full btn-primary" 
                disabled
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Out of Stock
              </Button>
            </div>
          ) : quantity > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onRemoveFromCart(product.id)}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-slate-800 dark:text-white min-w-[2rem] text-center">{quantity}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAddToCart(product.id)}
                    disabled={quantity >= product.stockQty}
                    className={`w-8 h-8 p-0 rounded-full ${
                      quantity >= product.stockQty ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={quantity >= product.stockQty ? `Only ${product.stockQty} items available` : 'Add more'}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" className="btn-primary">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  In Cart
                </Button>
              </div>
              
              {/* Stock Warning */}
              {quantity >= product.stockQty && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Maximum stock reached ({product.stockQty} {product.stockQty === 1 ? 'item' : 'items'} available)
                  </p>
                </div>
              )}
              
              {quantity > product.stockQty * 0.8 && quantity < product.stockQty && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Only {product.stockQty - quantity} {product.stockQty - quantity === 1 ? 'item' : 'items'} remaining
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Button 
              className="w-full btn-primary" 
              onClick={() => onAddToCart(product.id)}
              disabled={product.stockQty === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stockQty === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ShopSelection = ({ onSelectShop }: { onSelectShop: (shop: Shop) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const location = useAutoLocation(false); // Get customer location for filtering
  const [customerLocation, setCustomerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Load customer location from localStorage or hook
  useEffect(() => {
    const stored = localStorage.getItem('customer_location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.data?.coordinates) {
          setCustomerLocation({
            latitude: parsed.data.coordinates.latitude,
            longitude: parsed.data.coordinates.longitude,
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Also check location hook
    if (location.location?.coordinates) {
      setCustomerLocation({
        latitude: location.location.coordinates.latitude,
        longitude: location.location.coordinates.longitude,
      });
    }
  }, [location.location]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };
  
  // Fetch approved shops from database - DIRECT SUPABASE QUERY
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        console.log('🔍 CustomerDashboard: Fetching shops directly from Supabase...');
        
        // Use direct Supabase query instead of plugin
        const { data: shops, error } = await SupabaseDB.getAllShops();
        
        console.log('🔍 CustomerDashboard: Direct Supabase shops query result:', { 
          shopsCount: shops?.length || 0, 
          error: error?.message || 'No error',
          rawShops: shops
        });

        if (error) {
          console.error('❌ Error fetching shops:', error);
          setError(`Failed to load shops: ${error.message}`);
          return;
        }

        // Transform the data to match the Shop type - only APPROVED shops
        const transformedShops = (shops || [])
          .filter((shop: any) => shop.status === 'APPROVED' || shop.status === 'approved')
          .map((shop: any) => ({
            id: shop.id,
            name: shop.name,
            description: shop.description || 'Quality products and fast delivery',
            address: shop.address || 'Address not available',
            city: shop.city || 'City not available',
            state: shop.state || 'State not available',
            pincode: shop.pincode || '000000',
            phone: shop.phone || 'Phone not available',
            email: shop.email || 'Email not available',
            status: shop.status?.toLowerCase() || 'approved',
            businessType: shop.business_type || 'general',
            latitude: shop.latitude || null,
            longitude: shop.longitude || null,
            rating: 0,
            deliveryTime: '20-30 min',
            deliveryFee: 'Free',
            imageUrl: '/api/placeholder/300/200',
            imageHint: `${shop.name} storefront`,
            ownerId: shop.owner_id || 'unknown',
            location: 'Unknown',
            createdAt: new Date(shop.created_at),
            updatedAt: new Date(shop.updated_at)
          }));

        setShops(transformedShops);
        console.log('🔍 CustomerDashboard: Shops set:', transformedShops.length, 'shops');
        console.log('🔍 CustomerDashboard: Sample shop:', transformedShops[0] || 'No shops');

      } catch (err) {
        setError('Failed to load shops');
        console.error('🔍 CustomerDashboard: Shops fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  // Search shops
  useEffect(() => {
    if (searchTerm.trim()) {
      const searchShops = async () => {
        try {
          const result = await CustomerDatabasePlugin.searchApprovedShops(searchTerm);
          if (result.success) {
            setShops(result.shops);
          }
        } catch (err) {
          console.error('Search error:', err);
        }
      };
      
      const timeoutId = setTimeout(searchShops, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    } else {
      // Reset to all shops when search is cleared
      const fetchShops = async () => {
        try {
          const result = await CustomerDatabasePlugin.getApprovedShops();
          if (result.success) {
            setShops(result.shops);
          }
        } catch (err) {
          console.error('Fetch error:', err);
        }
      };
      fetchShops();
    }
  }, [searchTerm]);

  // Filter shops by category, location, and search term
  const filteredShops = shops.filter(shop => {
    // Only show APPROVED shops
    if (shop.status !== 'approved' && shop.status !== 'APPROVED') {
      return false;
    }
    
    // First filter by category if one is selected
    if (selectedCategory) {
      const businessTypeKeywords = categoryToBusinessType(selectedCategory.name);
      const shopBusinessType = shop.businessType?.toLowerCase() || '';
      const categoryMatch = businessTypeKeywords.some(keyword => 
        shopBusinessType.includes(keyword.toLowerCase())
      );
      
      if (!categoryMatch) return false;
    }
    
    // Filter by location if customer location is available
    if (customerLocation && shop.latitude && shop.longitude) {
      const distance = calculateDistance(
        customerLocation.latitude,
        customerLocation.longitude,
        shop.latitude,
        shop.longitude
      );
      
      // Only show shops within 50km radius (configurable)
      const maxDistance = 50; // kilometers
      if (distance > maxDistance) {
        return false;
      }
    }
    
    // Then filter by search term
    if (searchTerm.trim()) {
      return shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (shop.description && shop.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
             (shop.city && shop.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
             (shop.businessType && shop.businessType.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return true;
  }).map(shop => {
    // Add distance to shop if customer location is available
    if (customerLocation && shop.latitude && shop.longitude) {
      const distance = calculateDistance(
        customerLocation.latitude,
        customerLocation.longitude,
        shop.latitude,
        shop.longitude
      );
      return {
        ...shop,
        distance: distance
      };
    }
    return shop;
  }).sort((a: any, b: any) => {
    // Sort by distance if available (closest first), then by name
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    if (a.distance !== undefined) return -1;
    if (b.distance !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });

    return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">
              Find Fresh Products
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Discover local shops with fresh, quality products delivered to your doorstep
          </p>
        </div>

      {/* Search and Filters */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="search"
              placeholder="Search for shops or products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-xl">
            <SortAsc className="h-4 w-4 mr-2" />
            Sort
          </Button>
        </div>
      </div>

        {/* Categories - Horizontal format like shopkeeper registration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Filter by Category:
          </h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory?.id === category.id ? null : category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  selectedCategory?.id === category.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
          
      {/* Shops Grid - Always show shops, filter by category */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Loading Shops...
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Please wait while we fetch the latest shops for you.
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Error Loading Shops
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
            {error}
          </p>
          <Button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
          </Button>
        </div>
      ) : filteredShops.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                {selectedCategory 
                  ? `${selectedCategory.name} Shops (${filteredShops.length})`
                  : `All Shops (${filteredShops.length})`
                }
              </h3>
              {customerLocation && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Showing shops within 50km of your location
                </p>
              )}
              {selectedCategory && !customerLocation && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Set your location to see nearby shops in this category
                </p>
              )}
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop: any) => (
              <div key={shop.id} className="relative">
                <ShopCard shop={shop} onSelect={() => onSelectShop(shop)} />
                {shop.distance !== undefined && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-primary text-white">
                      <MapPin className="h-3 w-3 mr-1" />
                      {shop.distance.toFixed(1)} km away
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Leaf className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            {selectedCategory 
              ? `No ${selectedCategory.name} Shops Available`
              : 'No Shops Available'
            }
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
            {selectedCategory 
              ? `We don't have any shops in the ${selectedCategory.name.toLowerCase()} category yet. Try selecting a different category or clear the filter.`
              : 'There are currently no shops available. Please check back later.'
            }
          </p>
          {selectedCategory && (
            <Button 
              onClick={() => setSelectedCategory(null)} 
              className="btn-primary"
            >
              Clear Filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const ShopView = ({ shop, onClearShop }: { shop: Shop; onClearShop: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, getProductQuantity, updateQuantity } = useCart();

  // Fetch products for this shop - DIRECT SUPABASE QUERY
  // Also refresh periodically to get updated stock
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('🔍 CustomerDashboard: Fetching products for shop:', shop.id);
        
        // Use direct Supabase query instead of plugin
        const { data: products, error } = await SupabaseDB.getProductsByShop(shop.id);
        
        console.log('🔍 CustomerDashboard: Direct Supabase query result:', { 
          shopId: shop.id, 
          productsCount: products?.length || 0, 
          error: error?.message || 'No error',
          rawProducts: products
        });

        if (error) {
          console.error('❌ Error fetching products:', error);
          const errorMessage = error?.message || error?.details || JSON.stringify(error) || 'Unknown error';
          setError(`Failed to load products: ${errorMessage}`);
          // Don't return, continue with empty products array instead
          setProducts([]);
          return;
        }

        // Transform the data to match the Product type
        const transformedProducts = (products || []).map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: parseFloat(product.price.toString()),
          unit: product.unit || 'piece',
          stockQty: product.quantity || 0,
          category: product.category || 'General',
          sku: product.sku || '',
          expiryDate: product.expiry_date ? new Date(product.expiry_date) : undefined,
          mfgDate: product.mfg_date ? new Date(product.mfg_date) : undefined,
          shopId: product.shop_id,
          imageUrl: product.image_url || '/api/placeholder/200/200',
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at)
        }));

        setProducts(transformedProducts);
        console.log('🔍 CustomerDashboard: Products set:', transformedProducts.length, 'products');
        console.log('🔍 CustomerDashboard: Sample product:', transformedProducts[0] || 'No products');

      } catch (err) {
        setError('Failed to load products');
        console.error('🔍 CustomerDashboard: Product fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchProducts();

    // Refresh products every 30 seconds to get updated stock
    // This ensures customers see current stock levels even when other customers place orders
    const refreshInterval = setInterval(() => {
      console.log('🔄 Refreshing product stock...');
      fetchProducts();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [shop.id]);

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Get unique categories from products
  const availableCategories = Object.keys(productsByCategory).sort();

  // Filter products by search term and category
  const getFilteredProducts = (productList: Product[]) => {
    let filtered = productList;
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by selected category
    if (selectedCategoryFilter) {
      filtered = filtered.filter(product => 
        product.category === selectedCategoryFilter
      );
    }
    
    return filtered;
  };

  // Get products grouped and filtered
  const getFilteredProductsByCategory = () => {
    const result: Record<string, Product[]> = {};
    
    Object.keys(productsByCategory).forEach(category => {
      const filtered = getFilteredProducts(productsByCategory[category]);
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    });
    
    return result;
  };

  const filteredProductsByCategory = getFilteredProductsByCategory();
  
  // Get total filtered products count
  const totalFilteredProducts = Object.values(filteredProductsByCategory).reduce(
    (sum, products) => sum + products.length, 0
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Shop Header */}
      <Card className="card-elevated border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl flex items-center justify-center">
                <div className="text-3xl">🏪</div>
              </div>
          <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{shop.name}</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">{shop.description || 'Quality products and fast delivery'}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{shop.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{shop.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{shop.deliveryTime}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onClearShop} className="rounded-xl">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Shops
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="search"
              placeholder="Search products in this shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
            // Refresh products
            const fetchProducts = async () => {
              try {
                setLoading(true);
                console.log('🔄 Refreshing products for shop:', shop.id);
                const { data: products, error } = await SupabaseDB.getProductsByShop(shop.id);
                
                if (error) {
                  console.error('❌ Error refreshing products:', error);
                  setError(`Failed to refresh products: ${error.message}`);
                  return;
                }

                const transformedProducts = (products || []).map(product => ({
                  id: product.id,
                  name: product.name,
                  description: product.description || '',
                  price: parseFloat(product.price.toString()),
                  unit: product.unit || 'piece',
                  stockQty: product.quantity || 0,
                  category: product.category || 'General',
                  sku: product.sku || '',
                  expiryDate: product.expiry_date ? new Date(product.expiry_date) : undefined,
                  mfgDate: product.mfg_date ? new Date(product.mfg_date) : undefined,
                  shopId: product.shop_id,
                  imageUrl: product.image_url || '/api/placeholder/200/200',
                  createdAt: new Date(product.created_at),
                  updatedAt: new Date(product.updated_at)
                }));
                
                setProducts(transformedProducts);
                console.log('🔄 Products refreshed:', transformedProducts.length, 'products');
              } catch (err) {
                console.error('Error refreshing products:', err);
                setError('Failed to refresh products');
              } finally {
                setLoading(false);
              }
            };
            fetchProducts();
          }}
          className="h-12 px-6 rounded-xl"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

        {/* Category Filter Buttons */}
        {availableCategories.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
              Filter by Category:
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className={`px-4 py-2 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
                  selectedCategoryFilter === null
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }`}
              >
                All Categories ({products.length})
              </button>
              {availableCategories.map((category) => {
                const categoryData = categories.find(c => c.name === category) || categories[0];
                const productCount = productsByCategory[category]?.length || 0;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategoryFilter(
                      selectedCategoryFilter === category ? null : category
                    )}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
                      selectedCategoryFilter === category
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-lg">{categoryData.icon}</span>
                    <span>{category}</span>
                    <span className="text-xs opacity-75">({productCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Products by Category Sections */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Loading Products...
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Please wait while we fetch the products for this shop.
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Error Loading Products
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
            {error}
          </p>
          <Button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
          </Button>
        </div>
      ) : totalFilteredProducts > 0 ? (
        <div className="space-y-8">
          {Object.keys(filteredProductsByCategory).map((category) => {
            const categoryProducts = filteredProductsByCategory[category];
            const categoryData = categories.find(c => c.name === category) || categories[0];
            
            return (
              <div key={category} className="space-y-4">
                {/* Category Header with Realistic Image */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                  {/* Category Background Image */}
                  {categoryData.imageUrl && (
                    <div className="absolute inset-0 opacity-15 dark:opacity-10">
                      <img 
                        src={categoryData.imageUrl} 
                        alt={categoryData.imageHint || category}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Category Content */}
                  <div className="relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6">
                    {/* Category Image/Icon */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 border-2 border-white/50 dark:border-slate-700/50">
                      {categoryData.imageUrl ? (
                        <img 
                          src={categoryData.imageUrl} 
                          alt={categoryData.imageHint || category}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement;
                            if (fallback) {
                              fallback.innerHTML = `<span class="text-3xl sm:text-4xl">${categoryData.icon}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-3xl sm:text-4xl md:text-5xl">{categoryData.icon}</span>
                      )}
                    </div>
                    
                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-1">
                        {category}
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} available
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Products Grid for this Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(productId) => {
                        const product = products.find(p => p.id === productId);
                        if (product) addToCart(product);
                      }}
                      onRemoveFromCart={(productId) => updateQuantity(productId, getProductQuantity(productId) - 1)}
                      getQuantity={getProductQuantity}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            No Products Available
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            This shop doesn't have any products available yet. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
};

export default function CustomerDashboard() {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { toast } = useToast();
  const { addNotification, checkForNewNotifications } = useNotifications();
  
  // Automatic location detection for customers
  const location = useAutoLocation(true);

  // Save location to database when detected
  useEffect(() => {
    const saveLocationToDatabase = async () => {
      if (!location.location || location.isLoading) return;
      
      try {
        // Get current user ID from session
        const userData = sessionStorage.getItem('userSession');
        if (!userData) return;
        
        const user = JSON.parse(userData);
        if (!user?.id) return;

        // Save location to database
        const response = await fetch('/api/customer/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            latitude: location.location.coordinates.latitude,
            longitude: location.location.coordinates.longitude,
            address: location.location.address,
            city: location.location.city,
            state: location.location.state,
            country: location.location.country,
            pincode: location.location.pincode,
          }),
        });

        const result = await response.json();
        
        if (result.success && location.location.city) {
          // Silently update location - no toast needed (automatic)
          console.log('Location saved:', location.location.city, location.location.state);
        }
      } catch (error) {
        // Silently fail - location detection should not interrupt user experience
        console.log('Location save failed (non-critical):', error);
      }
    };

    // Only save if location is newly detected (not from cache)
    if (location.location && location.permissionGranted) {
      saveLocationToDatabase();
    }
  }, [location.location, location.permissionGranted, location.isLoading]);

  // Check for order approvals on component mount
  useEffect(() => {
    checkForNewNotifications();
  }, [checkForNewNotifications]);

  // Get user role from session
  const [userRole, setUserRole] = useState<'customer' | 'shopkeeper' | 'admin' | 'guest'>('customer');
  
  useEffect(() => {
    const session = sessionStorage.getItem('userSession');
    if (session) {
      try {
        const user = JSON.parse(session);
        setUserRole(user.role || 'customer');
      } catch (e) {
        setUserRole('guest');
      }
    } else {
      setUserRole('guest');
    }
  }, []);

  return (
    <>
      {selectedShop ? (
        <ShopView shop={selectedShop} onClearShop={() => setSelectedShop(null)} />
      ) : (
        <ShopSelection onSelectShop={setSelectedShop} />
      )}
      <Chatbot userRole={userRole} />
    </>
  );
}