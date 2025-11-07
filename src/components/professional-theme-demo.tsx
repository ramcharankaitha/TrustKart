'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Star, 
  Heart, 
  Search, 
  Bell, 
  User, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react';

export default function ProfessionalThemeDemo() {
  return (
    <div className="container-professional section-padding">
      {/* Hero Section */}
      <div className="bg-gradient-hero rounded-3xl p-12 text-center text-white mb-16 animate-fade-in">
        <h1 className="text-gradient-hero font-display font-bold mb-6">
          Professional TrustKart Theme
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Experience our modern, professional design with Flora and Vordana-inspired typography, 
          enhanced user interactions, and competitive aesthetics.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button className="btn-primary text-lg px-8 py-4">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Start Shopping
          </Button>
          <Button className="btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary">
            Learn More
          </Button>
        </div>
      </div>

      {/* Typography Showcase */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Typography
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="font-display">Flora-Inspired Fonts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-semibold mb-2">Display Headings</h3>
                <p className="font-body text-muted-foreground">
                  Clean, modern typography using Inter and Poppins for professional readability.
                </p>
              </div>
              <div>
                <h4 className="font-display text-xl font-medium mb-2">Body Text</h4>
                <p className="font-body leading-relaxed">
                  Optimized for readability with proper line height and character spacing. 
                  Perfect for e-commerce content and user interfaces.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="font-display">Vordana-Inspired Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-semibold mb-2">Professional Layout</h3>
                <p className="font-body text-muted-foreground">
                  Structured layouts with consistent spacing and professional hierarchy.
                </p>
              </div>
              <div>
                <h4 className="font-display text-xl font-medium mb-2">Interactive Elements</h4>
                <p className="font-body leading-relaxed">
                  Enhanced user interactions with smooth animations and professional feedback.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Button Showcase */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Buttons
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Button className="btn-primary">
            Primary
          </Button>
          <Button className="btn-secondary">
            Secondary
          </Button>
          <Button className="btn-accent">
            Accent
          </Button>
          <Button className="btn-ghost">
            Ghost
          </Button>
          <Button className="btn-outline">
            Outline
          </Button>
        </div>
      </div>

      {/* Card Showcase */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Cards
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="font-display">Standard Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-body text-muted-foreground">
                Clean, professional card design with subtle shadows and smooth transitions.
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-display">Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-body text-muted-foreground">
                Enhanced shadow and hover effects for important content and CTAs.
              </p>
            </CardContent>
          </Card>

          <Card className="card-interactive">
            <CardHeader>
              <CardTitle className="font-display">Interactive Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-body text-muted-foreground">
                Hover and click animations for engaging user interactions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Input Showcase */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Inputs
        </h2>
        <div className="max-w-md mx-auto space-y-4">
          <Input 
            className="input-professional" 
            placeholder="Professional input with focus states"
          />
          <Input 
            className="input-floating" 
            placeholder="Floating input with enhanced shadows"
          />
        </div>
      </div>

      {/* Badge Showcase */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Badges
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Badge className="badge-success">
            <CheckCircle className="mr-1 h-3 w-3" />
            Success
          </Badge>
          <Badge className="badge-warning">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
          <Badge className="badge-error">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
          <Badge className="badge-info">
            <Info className="mr-1 h-3 w-3" />
            Info
          </Badge>
          <Badge className="badge-neutral">
            Neutral
          </Badge>
        </div>
      </div>

      {/* Navigation Showcase */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Navigation
        </h2>
        <div className="bg-card rounded-2xl p-6">
          <nav className="flex flex-wrap gap-2">
            <a href="#" className="nav-item-active">
              <User className="mr-2 h-4 w-4" />
              Dashboard
            </a>
            <a href="#" className="nav-item">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Products
            </a>
            <a href="#" className="nav-item">
              <Heart className="mr-2 h-4 w-4" />
              Favorites
            </a>
            <a href="#" className="nav-item">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </a>
            <a href="#" className="nav-item">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </a>
          </nav>
        </div>
      </div>

      {/* Animation Showcase */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Animations
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-professional animate-fade-in">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary rounded-full mx-auto mb-4 animate-pulse-slow"></div>
              <h3 className="font-display font-semibold">Fade In</h3>
            </CardContent>
          </Card>

          <Card className="card-professional animate-slide-up">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-success-500 rounded-full mx-auto mb-4 animate-bounce-subtle"></div>
              <h3 className="font-display font-semibold">Slide Up</h3>
            </CardContent>
          </Card>

          <Card className="card-professional animate-scale-in">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-warning-500 rounded-full mx-auto mb-4 animate-wiggle"></div>
              <h3 className="font-display font-semibold">Scale In</h3>
            </CardContent>
          </Card>

          <Card className="card-professional">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-error-500 rounded-full mx-auto mb-4 animate-float"></div>
              <h3 className="font-display font-semibold">Float</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Colors */}
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gradient-primary">
          Professional Status Colors
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="status-success p-6 rounded-2xl text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-display font-semibold">Success</h3>
            <p className="text-sm">Positive actions and confirmations</p>
          </div>
          <div className="status-warning p-6 rounded-2xl text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-display font-semibold">Warning</h3>
            <p className="text-sm">Attention-grabbing elements</p>
          </div>
          <div className="status-error p-6 rounded-2xl text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-display font-semibold">Error</h3>
            <p className="text-sm">Critical issues and alerts</p>
          </div>
          <div className="status-info p-6 rounded-2xl text-center">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-display font-semibold">Info</h3>
            <p className="text-sm">Information and neutral states</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-primary rounded-3xl p-12 text-center text-white">
        <h2 className="text-gradient-hero font-display font-bold text-3xl mb-6">
          Ready to Experience Professional Design?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Our professional theme provides the perfect foundation for a competitive e-commerce platform.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4">
            Get Started
          </Button>
          <Button className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
