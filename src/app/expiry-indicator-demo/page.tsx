'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Heart, Plus, Minus, ShoppingCart } from 'lucide-react';

// Sample products with different expiry dates
const sampleProducts = [
  {
    id: '1',
    name: 'Fresh Apples',
    description: 'Crisp and juicy red apples',
    price: 100,
    unit: 'kg',
    stockQty: 50,
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    imageUrl: '/api/placeholder/200/200'
  },
  {
    id: '2',
    name: 'Bananas',
    description: 'Sweet yellow bananas',
    price: 60,
    unit: 'kg',
    stockQty: 30,
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    imageUrl: '/api/placeholder/200/200'
  },
  {
    id: '3',
    name: 'Milk',
    description: 'Fresh dairy milk',
    price: 45,
    unit: 'L',
    stockQty: 20,
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    imageUrl: '/api/placeholder/200/200'
  },
  {
    id: '4',
    name: 'Bread',
    description: 'Fresh baked bread',
    price: 25,
    unit: 'pack',
    stockQty: 15,
    expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
    imageUrl: '/api/placeholder/200/200'
  },
  {
    id: '5',
    name: 'Rice',
    description: 'Long grain basmati rice',
    price: 80,
    unit: 'kg',
    stockQty: 100,
    expiryDate: null, // No expiry date
    imageUrl: '/api/placeholder/200/200'
  }
];

const ProductCard = ({ product }: { product: any }) => {
  const [quantity, setQuantity] = useState(0);
  
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
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Stock: {product.stockQty}
            </div>
          </div>

          {quantity > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuantity(quantity - 1)}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-slate-800 dark:text-white">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" className="btn-primary">
                <ShoppingCart className="h-4 w-4 mr-1" />
                In Cart
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full btn-primary" 
              onClick={() => setQuantity(1)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ExpiryIndicatorDemo() {
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
          Product Expiry Date Indicators Demo
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Color-coded glow effects based on product freshness
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {sampleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Expiry Date Indicator Legend
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
              <div>
                <div className="font-medium text-slate-800 dark:text-white">Fresh</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">More than 7 days</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>
              <div>
                <div className="font-medium text-slate-800 dark:text-white">Mid Expiry</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">4-7 days</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
              <div>
                <div className="font-medium text-slate-800 dark:text-white">Expires Soon</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">1-3 days</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
              <div>
                <div className="font-medium text-slate-800 dark:text-white">Expired</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Past expiry date</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
