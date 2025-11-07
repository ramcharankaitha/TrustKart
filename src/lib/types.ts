export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'customer' | 'shopkeeper' | 'admin' | 'super_admin' | 'delivery';
  phone?: string;
  address?: string;
  gender?: string;
};

export type Shop = {
  id: string;
  name: string;
  location: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  imageUrl: string;
  imageHint: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'terminated' | 'closed';
  registrationDate: Date;
  approvalDate?: Date;
  documents: ShopDocument[];
  businessType: string;
  description?: string;
  phone: string;
  email: string;
  rating?: number;
  deliveryTime?: string;
  deliveryFee?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ShopDocument = {
  id: string;
  type: 'business_license' | 'gst_certificate' | 'pan_card' | 'aadhar_card' | 'shop_photo' | 'other';
  name: string;
  url: string;
  uploadedAt: Date;
  fileSize?: number;
  fileType?: string;
  isVerified?: boolean;
  verificationNotes?: string;
};

export type ShopRegistrationRequest = {
  id: string;
  shopkeeperId: string;
  shopDetails: {
    shopName: string; // Changed from 'name' to 'shopName' to match form data
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    businessType: string;
    description: string;
  };
  documents: ShopDocument[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  unit: string;
  stockQty: number;
  sku: string;
  imageUrl: string;
  imageHint: string;
  expiryDate?: Date;
  mfgDate?: Date;
  daysUntilExpiry?: number;
  averageDailySales: number;
  shopId: string;
  description: string;
  inStock: boolean;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrganicVegetable = {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string; // kg, piece, bundle, etc.
  category?: string;
  image_url?: string;
  nutritional_info?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    vitamins?: string[];
  };
  origin?: string;
  certification?: string;
  farmer_name?: string;
  farmer_contact?: string;
  quantity_available: number;
  min_order_quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: string;
  shop_id?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: Date;
  rejected_by?: string;
  rejected_at?: Date;
  created_at: Date;
  updated_at: Date;
};

export type Order = {
  id: string;
  customerId: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  shopId: string;
  shopName: string;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'upi' | 'cod' | 'netbanking';
  status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  preparedAt?: Date;
  readyAt?: Date;
  outForDeliveryAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  shopkeeperNotes?: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  imageUrl: string;
  imageHint: string;
  icon?: string;
};

export type Complaint = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  shopId: string;
  shopName: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  type: 'product_quality' | 'service_issue' | 'fraud' | 'hygiene' | 'pricing' | 'delivery' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'under_review' | 'resolved' | 'rejected' | 'escalated';
  subject: string;
  description: string;
  evidence?: {
    images: string[];
    documents: string[];
  };
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  resolution?: string;
  resolutionDate?: Date;
  adminNotes?: string;
  shopResponse?: string;
  shopResponseDate?: Date;
  customerSatisfaction?: 'satisfied' | 'dissatisfied' | 'neutral';
  followUpRequired?: boolean;
  followUpDate?: Date;
};

export type ComplaintAction = {
  id: string;
  complaintId: string;
  actionType: 'warning' | 'fine' | 'suspension' | 'termination' | 'shop_closure';
  description: string;
  amount?: number;
  duration?: number; // in days for suspension
  effectiveDate: Date;
  adminId: string;
  adminName: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
};
