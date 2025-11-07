
"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockUser } from "@/lib/mock-data";
import type { User } from '@/lib/types';

export function UserNav() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<User['role'] | 'guest'>('guest');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      // Check localStorage first (for backward compatibility)
      const localRole = localStorage.getItem("userRole") as User['role'] | null;
      
      // Check sessionStorage for Supabase authentication
      const sessionData = sessionStorage.getItem('userSession');
      let sessionRole: User['role'] | null = null;
      let sessionUserData: any = null;
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          sessionRole = session.role as User['role'];
          sessionUserData = session;
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }
      
      // Use session role if available, otherwise fall back to localStorage
      const role = sessionRole || localRole || 'guest';
      setUserRole(role);
      setUserData(sessionUserData);
    };
    
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    // Clear both localStorage and sessionStorage
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("userSession");
    window.dispatchEvent(new Event('storage'));
    router.push('/login');
  };
  
  const isLoggedIn = userRole !== 'guest';

  if (!isLoggedIn) {
    return <Button onClick={() => router.push('/login')}>Login</Button>;
  }

  // Use session data if available, otherwise fall back to mock data
  const displayUser = userData || mockUser;
  const displayName = userData?.name || mockUser.name;
  const displayEmail = userData?.email || mockUser.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={displayUser.avatar} alt={`@${displayName}`} data-ai-hint={displayName} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-headline">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
              Role: {userRole.replace('_', ' ')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>Profile</DropdownMenuItem>
          {userRole === 'customer' && (
            <DropdownMenuItem onClick={() => router.push('/dashboard/my-orders')}>My Orders</DropdownMenuItem>
          )}
           {userRole !== 'customer' && <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>Settings</DropdownMenuItem>}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
