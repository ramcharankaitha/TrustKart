'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Store, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [shopCreated, setShopCreated] = useState(false);
  const [shopData, setShopData] = useState(null);

  const createShop = () => {
    setIsCreating(true);
    
    try {
      // Create shop registration request
      const shopRegistrationRequest = {
        id: `reg-${Date.now()}`,
        shopkeeperId: 'shopkeeper-rc',
        shopDetails: {
          shopName: 'RC',
          address: '456 Business District, Central Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
          phone: '+91 9876543211',
          email: 'rc@shopkeeper.com',
          businessType: 'grocery',
          description: 'Premium grocery store with fresh products and excellent service'
        },
        documents: [
          {
            id: 'doc-1',
            type: 'business_license',
            name: 'Business License.pdf',
            url: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDIgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoyMCA3MDAgVGQKKFJDIHN0b3JlcyBidXNpbmVzcyBsaWNlbnNlKSBUagoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgMiAwIFIKPj4KPj4KL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago3IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKOCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFs1IDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagp4cmVmCjAgOQowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAwOSAwMDAwMCBuCjAwMDAwMDAwNTggMDAwMDAgbgowMDAwMDAwMTE1IDAwMDAwIG4KMDAwMDAwMDI2MiAwMDAwMCBuCjAwMDAwMDAzNzcgMDAwMDAgbgowMDAwMDAwNDQzIDAwMDAwIG4KMDAwMDAwMDUwOCAwMDAwMCBuCjAwMDAwMDA2NjMgMDAwMDAgbgp0cmFpbGVyCjw8Ci9TaXplIDkKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjc1NQolJUVPRgo=',
            uploadedAt: new Date(),
            fileSize: 1024,
            fileType: 'application/pdf'
          },
          {
            id: 'doc-2',
            type: 'gst_certificate',
            name: 'GST Certificate.pdf',
            url: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDIgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoyMCA3MDAgVGQKKFJDIHN0b3JlcyBHU1QpIFRqCgpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAyIDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzUgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCnhyZWYKMCA5CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA1OCAwMDAwMCBuCjAwMDAwMDAxMTUgMDAwMDAgbgowMDAwMDAwMjYyIDAwMDAwIG4KMDAwMDAwMDM3NyAwMDAwMCBuCjAwMDAwMDA0NDMgMDAwMDAgbgowMDAwMDAwNTA4IDAwMDAwIG4KMDAwMDAwMDY2MyAwMDAwMCBuCnRyYWlsZXIKPDwKL1NpemUgOQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNzU1CiUlRU9GCg==',
            uploadedAt: new Date(),
            fileSize: 1024,
            fileType: 'application/pdf'
          },
          {
            id: 'doc-3',
            type: 'pan_card',
            name: 'PAN Card.pdf',
            url: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDIgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoyMCA3MDAgVGQKKFJDIHN0b3JlcyBQQU4pIFRqCgpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAyIDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzUgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCnhyZWYKMCA5CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA1OCAwMDAwMCBuCjAwMDAwMDAxMTUgMDAwMDAgbgowMDAwMDAwMjYyIDAwMDAwIG4KMDAwMDAwMDM3NyAwMDAwMCBuCjAwMDAwMDA0NDMgMDAwMDAgbgowMDAwMDAwNTA4IDAwMDAwIG4KMDAwMDAwMDY2MyAwMDAwMCBuCnRyYWlsZXIKPDwKL1NpemUgOQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNzU1CiUlRU9GCg==',
            uploadedAt: new Date(),
            fileSize: 1024,
            fileType: 'application/pdf'
          },
          {
            id: 'doc-4',
            type: 'aadhar_card',
            name: 'Aadhar Card.pdf',
            url: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDIgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoyMCA3MDAgVGQKKFJDIHN0b3JlcyBBYWRoYXIpIFRqCgpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAyIDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzUgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCnhyZWYKMCA5CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA1OCAwMDAwMCBuCjAwMDAwMDAxMTUgMDAwMDAgbgowMDAwMDAwMjYyIDAwMDAwIG4KMDAwMDAwMDM3NyAwMDAwMCBuCjAwMDAwMDA0NDMgMDAwMDAgbgowMDAwMDAwNTA4IDAwMDAwIG4KMDAwMDAwMDY2MyAwMDAwMCBuCnRyYWlsZXIKPDwKL1NpemUgOQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNzU1CiUlRU9GCg==',
            uploadedAt: new Date(),
            fileSize: 1024,
            fileType: 'application/pdf'
          },
          {
            id: 'doc-5',
            type: 'shop_photo',
            name: 'Shop Photo.jpg',
            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            uploadedAt: new Date(),
            fileSize: 2048,
            fileType: 'image/jpeg'
          }
        ],
        status: 'pending',
        submittedAt: new Date()
      };

      // Store the registration request
      const existingRequests = JSON.parse(localStorage.getItem('shopRegistrationRequests') || '[]');
      existingRequests.push(shopRegistrationRequest);
      localStorage.setItem('shopRegistrationRequests', JSON.stringify(existingRequests));

      // Approve the registration immediately
      const updatedRequests = existingRequests.map(req => {
        if (req.id === shopRegistrationRequest.id) {
          return {
            ...req,
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: 'admin-user-id'
          };
        }
        return req;
      });
      localStorage.setItem('shopRegistrationRequests', JSON.stringify(updatedRequests));

      // Create the shop
      const newShop = {
        id: `shop-${Date.now()}`,
        name: shopRegistrationRequest.shopDetails.shopName,
        location: `${shopRegistrationRequest.shopDetails.city}, ${shopRegistrationRequest.shopDetails.state}`,
        imageUrl: 'https://picsum.photos/seed/rc-shop/600/200',
        imageHint: 'RC shop image',
        address: shopRegistrationRequest.shopDetails.address,
        city: shopRegistrationRequest.shopDetails.city,
        state: shopRegistrationRequest.shopDetails.state,
        pincode: shopRegistrationRequest.shopDetails.pincode,
        coordinates: {
          latitude: 19.0760 + (Math.random() - 0.5) * 0.1,
          longitude: 72.8777 + (Math.random() - 0.5) * 0.1
        },
        businessType: shopRegistrationRequest.shopDetails.businessType,
        description: shopRegistrationRequest.shopDetails.description,
        phone: shopRegistrationRequest.shopDetails.phone,
        email: shopRegistrationRequest.shopDetails.email,
        status: 'approved',
        shopkeeperId: shopRegistrationRequest.shopkeeperId,
        ownerId: shopRegistrationRequest.shopkeeperId,
        registrationDate: new Date(),
        approvalDate: new Date(),
        documents: shopRegistrationRequest.documents
      };

      // Add shop to shops list
      const existingShops = JSON.parse(localStorage.getItem('shops') || '[]');
      existingShops.push(newShop);
      localStorage.setItem('shops', JSON.stringify(existingShops));

      // Create shopkeeper login credentials
      const shopkeeperCredentials = {
        id: 'shopkeeper-rc',
        email: 'rc@shopkeeper.com',
        password: 'rc123456',
        name: 'RC Shopkeeper',
        role: 'shopkeeper',
        shopId: newShop.id,
        shopName: newShop.name,
        phone: newShop.phone,
        address: newShop.address,
        city: newShop.city,
        state: newShop.state,
        pincode: newShop.pincode,
        status: 'active',
        createdAt: new Date()
      };

      // Store shopkeeper credentials
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      existingUsers.push(shopkeeperCredentials);
      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Set user role and shop status for the shopkeeper
      localStorage.setItem('userRole', 'shopkeeper');
      localStorage.setItem('shopStatus', 'approved');
      localStorage.setItem('currentShopId', newShop.id);
      localStorage.setItem('shopRegistrationId', shopRegistrationRequest.id);
      localStorage.setItem('currentUserId', shopkeeperCredentials.id);

      setShopData(newShop);
      setShopCreated(true);

      toast({
        title: "Shop Created Successfully!",
        description: `${newShop.name} is now live and visible to customers.`,
      });

    } catch (error) {
      console.error('Error creating shop:', error);
      toast({
        variant: "destructive",
        title: "Error Creating Shop",
        description: "There was an error creating the shop. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto my-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Create Shop Demo</h1>
          <p className="text-muted-foreground">
            This will create a complete shop registration and make it visible to customers.
          </p>
        </div>

        {!shopCreated ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Create RC Shop
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Shop Details</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Name: RC</li>
                    <li>• Type: Grocery Store</li>
                    <li>• Location: Mumbai, Maharashtra</li>
                    <li>• Address: 456 Business District, Central Area</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Phone: +91 9876543211</li>
                    <li>• Email: rc@shopkeeper.com</li>
                    <li>• Pincode: 400002</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Documents Included</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Business License</Badge>
                  <Badge variant="secondary">GST Certificate</Badge>
                  <Badge variant="secondary">PAN Card</Badge>
                  <Badge variant="secondary">Aadhar Card</Badge>
                  <Badge variant="secondary">Shop Photo</Badge>
                </div>
              </div>

              <Button 
                onClick={createShop} 
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? 'Creating Shop...' : 'Create Shop & Make Visible'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Shop Created Successfully!</h2>
                    <p className="text-green-600">RC is now live and visible to customers.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Shop Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Shop Name:</span>
                      <span>{shopData?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Shop ID:</span>
                      <span className="font-mono text-sm">{shopData?.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{shopData?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{shopData?.email}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Address:</span>
                      <span className="text-sm">{shopData?.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Location:</span>
                      <span>{shopData?.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Status:</span>
                      <Badge variant="default" className="bg-green-600">Approved</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <User className="h-5 w-5" />
                  Login Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold mb-3 text-blue-800">Shopkeeper Login Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Email:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">rc@shopkeeper.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Password:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">rc123456</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Role:</span>
                      <Badge variant="default" className="bg-blue-600">Shopkeeper</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                  <strong>Demo Instructions:</strong> Use these credentials to login as the RC shopkeeper and manage the shop. The shop is now visible to customers on the dashboard.
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
                size="lg"
              >
                Go to Customer Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Go to Shopkeeper Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
