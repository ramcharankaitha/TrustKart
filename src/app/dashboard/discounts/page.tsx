import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent } from 'lucide-react';

export default function DiscountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">AI Expiry-Based Discounts</h1>
        <p className="text-muted-foreground">
          Use AI to get optimal discount suggestions for products nearing their expiry date to maximize sales and minimize waste.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Discount Management</CardTitle>
          <CardDescription>AI-powered discount suggestions for your products.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Percent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Products Available</h3>
            <p className="text-muted-foreground mb-4">
              Add products to your inventory to start receiving AI-powered discount suggestions.
            </p>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
              Add Products
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
