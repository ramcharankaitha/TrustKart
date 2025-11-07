import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not set')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone = formData.get('phone') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const vehicleNumber = formData.get('vehicleNumber') as string;
    const licenseNumber = formData.get('licenseNumber') as string;
    const aadhaarNumber = formData.get('aadhaarNumber') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const pincode = formData.get('pincode') as string;
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    
    // Build full address
    const addressParts: string[] = [];
    if (address) addressParts.push(address);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (pincode) addressParts.push(pincode);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : address;
    
    // Parse coordinates
    const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null;

    // Validate required fields
    if (!name || !email || !password || !phone || !vehicleType || !address) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, password, phone, vehicleType, address'
      }, { status: 400 });
    }

    // Check if delivery agent already exists
    const supabase = getSupabaseClient();
    const { data: existingAgent, error: checkError } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAgent) {
      return NextResponse.json({
        success: false,
        error: 'A delivery agent with this email already exists'
      }, { status: 400 });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare insert data
    const insertData: any = {
      name,
      email,
      password: passwordHash,
      phone,
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber,
      license_number: licenseNumber,
      aadhaar_number: aadhaarNumber,
      address: fullAddress,
      status: 'PENDING', // Always pending approval
      is_available: false, // Not available until approved
      rating: 0,
      total_deliveries: 0
    };
    
    // Add location data if available
    if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
      insertData.latitude = latitude;
      insertData.longitude = longitude;
    }

    // Create delivery agent
    const { data: deliveryAgent, error } = await supabase
      .from('delivery_agents')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Delivery agent registration error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to register delivery agent'
      }, { status: 500 });
    }

    console.log('✅ Delivery agent created successfully:', deliveryAgent.id);

    // Handle document uploads
    const documentTypes = ['driving_license', 'aadhaar_card', 'vehicle_rc', 'pan_card', 'profile_photo'];
    const uploadedDocuments = [];

    for (const docType of documentTypes) {
      const file = formData.get(`document_${docType}`) as File;
      if (file) {
        // For demo purposes, we'll store file metadata instead of actual file content
        // In production, you would upload to a file storage service like AWS S3, Cloudinary, etc.
        const documentData = {
          delivery_agent_id: deliveryAgent.id,
          document_type: docType,
          document_name: file.name,
          document_url: `demo-upload-${docType}-${Date.now()}`, // Placeholder URL
          file_size: file.size,
          file_type: file.type,
          is_verified: false
        };

        const { data: document, error: docError } = await supabase
          .from('delivery_agent_documents')
          .insert([documentData])
          .select()
          .single();

        if (docError) {
          console.error(`Error uploading ${docType}:`, docError);
        } else {
          uploadedDocuments.push(document);
          console.log(`✅ Document ${docType} uploaded successfully`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery agent registration successful. Your application is pending approval.',
      deliveryAgent: {
        id: deliveryAgent.id,
        name: deliveryAgent.name,
        email: deliveryAgent.email,
        phone: deliveryAgent.phone,
        vehicleType: deliveryAgent.vehicle_type,
        vehicleNumber: deliveryAgent.vehicle_number,
        licenseNumber: deliveryAgent.license_number,
        aadhaarNumber: deliveryAgent.aadhaar_number,
        address: deliveryAgent.address,
        status: deliveryAgent.status?.toLowerCase() || 'pending',
        isAvailable: deliveryAgent.is_available || false,
        rating: deliveryAgent.rating || 0,
        totalDeliveries: deliveryAgent.total_deliveries || 0,
        createdAt: deliveryAgent.created_at,
        updatedAt: deliveryAgent.updated_at
      },
      documents: uploadedDocuments
    });

  } catch (error: any) {
    console.error('Delivery agent registration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data: deliveryAgents, error } = await supabase
      .from('delivery_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching delivery agents:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deliveryAgents: deliveryAgents || []
    });

  } catch (error: any) {
    console.error('Error fetching delivery agents:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
