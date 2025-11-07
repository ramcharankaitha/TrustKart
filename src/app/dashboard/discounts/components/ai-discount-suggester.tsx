"use client";

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { suggestExpiryDiscounts, type SuggestExpiryDiscountsOutput } from '@/ai/flows/suggest-expiry-discounts';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export function AiDiscountSuggester({ product }: { product: Product }) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestExpiryDiscountsOutput | null>(null);
  const { toast } = useToast();

  const handleSuggestDiscount = async () => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestExpiryDiscounts({
        productName: product.name,
        daysToExpiry: product.daysToExpiry,
        currentPrice: product.price,
        averageDailySales: product.averageDailySales,
        shopId: product.shopId,
      });
      setSuggestion(result);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get a discount suggestion. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-4">
        <div className="flex items-start gap-4">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={80}
            height={80}
            className="rounded-lg object-cover"
            data-ai-hint={product.imageHint}
          />
          <div className="flex-1">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription className="text-sm">
              Expires in {product.daysToExpiry} days ({format(product.expiryDate, 'MMM d')})
            </CardDescription>
             <p className="text-sm font-semibold">₹{product.price.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {suggestion && (
          <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
            <p className="text-sm text-muted-foreground">Suggested Discount:</p>
            <p className="text-3xl font-bold text-accent">{suggestion.discountPercentage}% OFF</p>
            <p className="text-xs text-muted-foreground mt-2 font-code">{suggestion.reasoning}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4">
        <Button onClick={handleSuggestDiscount} disabled={isLoading} className="w-full bg-primary/90 hover:bg-primary text-primary-foreground">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Thinking...' : (suggestion ? 'Regenerate Suggestion' : 'Suggest Discount with AI')}
        </Button>
      </CardFooter>
    </Card>
  );
}
