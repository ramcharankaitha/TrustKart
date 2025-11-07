
'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUser } from "@/lib/mock-data";
import { ChevronRight, User as UserIcon, MapPin, Package, CreditCard, Bell } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const user = mockUser;

  const profileLinks = [
    { title: "My Details", description: "Edit your name and email", icon: UserIcon, href: "#" },
    { title: "My Addresses", description: "Manage your delivery addresses", icon: MapPin, href: "/dashboard/addresses" },
    { title: "My Orders", description: "View your order history", icon: Package, href: "/dashboard/orders" },
    { title: "My Wallet", description: "Check balance and transactions", icon: CreditCard, href: "/dashboard/wallet" },
    { title: "Notifications", description: "Manage your preferences", icon: Bell, href: "/dashboard/settings" },
  ];

  return (
    <div className="flex flex-col gap-6">
       <h1 className="text-3xl font-bold font-headline tracking-tight">My Profile</h1>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profileLinks.map(link => (
              <Button
                key={link.title}
                variant="ghost"
                className="w-full justify-start h-auto p-4"
                onClick={() => {
                  if (link.href !== "#") {
                    router.push(link.href);
                  }
                }}
                disabled={link.href === "#"}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="bg-muted p-3 rounded-lg">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{link.title}</p>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
