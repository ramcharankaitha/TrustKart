'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopRegistrationCatchAll() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main shopkeeper registration page
    router.replace('/shopkeeper-registration');
  }, [router]);

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to the shop registration page</p>
      </div>
    </div>
  );
}
