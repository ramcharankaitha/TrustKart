// Demo data for testing admin approval workflow
export const demoShops = [
  {
    id: 'shop-1',
    name: 'Fresh Grocery Store',
    location: 'Mumbai, Maharashtra',
    address: '123 Market Street, Near Bus Stand',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    imageUrl: 'https://picsum.photos/seed/fresh-grocery/600/200',
    imageHint: 'fresh grocery store',
    ownerId: 'owner-1',
    status: 'approved' as const,
    registrationDate: new Date('2024-01-01'),
    approvalDate: new Date('2024-01-02'),
    documents: [],
    businessType: 'grocery',
    description: 'Fresh vegetables and daily essentials',
    phone: '+91 98765 43210',
    email: 'fresh@example.com'
  },
  {
    id: 'shop-2',
    name: 'Quick Mart',
    location: 'Delhi, Delhi',
    address: '456 Commercial Road',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    imageUrl: 'https://picsum.photos/seed/quick-mart/600/200',
    imageHint: 'quick mart store',
    ownerId: 'owner-2',
    status: 'pending' as const,
    registrationDate: new Date('2024-01-15'),
    documents: [],
    businessType: 'supermarket',
    description: 'Modern supermarket with wide variety',
    phone: '+91 98765 43211',
    email: 'quick@example.com'
  },
  {
    id: 'shop-3',
    name: 'Corner Store',
    location: 'Bangalore, Karnataka',
    address: '789 Residential Area',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    imageUrl: 'https://picsum.photos/seed/corner-store/600/200',
    imageHint: 'corner store',
    ownerId: 'owner-3',
    status: 'rejected' as const,
    registrationDate: new Date('2024-01-10'),
    documents: [],
    businessType: 'provision',
    description: 'Traditional provision store',
    phone: '+91 98765 43212',
    email: 'corner@example.com'
  },
  {
    id: 'shop-4',
    name: 'Organic Foods',
    location: 'Pune, Maharashtra',
    address: '321 Organic Street',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    imageUrl: 'https://picsum.photos/seed/organic-foods/600/200',
    imageHint: 'organic foods store',
    ownerId: 'owner-4',
    status: 'approved' as const,
    registrationDate: new Date('2024-01-05'),
    approvalDate: new Date('2024-01-06'),
    documents: [],
    businessType: 'organic',
    description: 'Premium organic and natural products',
    phone: '+91 98765 43213',
    email: 'organic@example.com'
  }
];

// Function to initialize demo shops in localStorage
export function initializeDemoShops() {
  const existingShops = localStorage.getItem('shops');
  if (!existingShops) {
    localStorage.setItem('shops', JSON.stringify(demoShops));
    console.log('Demo shops initialized in localStorage');
  }
}

// Function to add a new pending shop for testing
export function addPendingShop() {
  const newShop = {
    id: `shop-${Date.now()}`,
    name: 'New Test Shop',
    location: 'Test City, Test State',
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    imageUrl: 'https://picsum.photos/seed/test-shop/600/200',
    imageHint: 'test shop',
    ownerId: 'test-owner',
    status: 'pending' as const,
    registrationDate: new Date(),
    documents: [],
    businessType: 'test',
    description: 'This is a test shop for admin approval',
    phone: '+91 00000 00000',
    email: 'test@example.com'
  };

  const existingShops = JSON.parse(localStorage.getItem('shops') || '[]');
  existingShops.push(newShop);
  localStorage.setItem('shops', JSON.stringify(existingShops));
  
  return newShop;
}

