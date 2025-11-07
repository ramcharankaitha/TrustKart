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
    const aadhaarNumber = formData.get('aadhaarNumber') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const pincode = formData.get('pincode') as string;
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    const farmName = formData.get('farmName') as string;
    const farmAddress = formData.get('farmAddress') as string;
    const farmSize = formData.get('farmSize') as string;
    const cropsGrown = formData.get('cropsGrown') as string; // Comma-separated
    const organicCertification = formData.get('organicCertification') as string;
    
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
    if (!name || !email || !password || !phone || !address) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, password, phone, address'
      }, { status: 400 });
    }

    // Check if farmer already exists
    const supabase = getSupabaseClient();
    const { data: existingFarmer, error: checkError } = await supabase
      .from('farmers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingFarmer) {
      return NextResponse.json({
        success: false,
        error: 'A farmer with this email already exists'
      }, { status: 400 });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Parse crops grown
    const cropsArray = cropsGrown 
      ? cropsGrown.split(',').map(crop => crop.trim()).filter(crop => crop.length > 0)
      : [];

    // Prepare insert data
    const insertData: any = {
      name,
      email,
      password: passwordHash,
      phone,
      aadhaar_number: aadhaarNumber || null,
      address: fullAddress,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      farm_name: farmName || null,
      farm_address: farmAddress || null,
      farm_size: farmSize || null,
      crops_grown: cropsArray.length > 0 ? cropsArray : null,
      organic_certification: organicCertification || null,
      status: 'PENDING', // Always pending approval
      is_active: false, // Not active until approved
      rating: 0,
      total_vegetables_submitted: 0,
      total_vegetables_approved: 0
    };
    
    // Add location data if available
    if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
      insertData.latitude = latitude;
      insertData.longitude = longitude;
    }

    // Create farmer
    const { data: farmer, error } = await supabase
      .from('farmers')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Farmer registration error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to register farmer'
      }, { status: 500 });
    }

    console.log('✅ Farmer created successfully:', farmer.id);

    // Handle document uploads
    const documentTypes = ['aadhaar_card', 'pan_card', 'farm_license', 'organic_certificate', 'profile_photo'];
    const uploadedDocuments = [];

    for (const docType of documentTypes) {
      const file = formData.get(`document_${docType}`) as File;
      if (file) {
        const documentData = {
          farmer_id: farmer.id,
          document_type: docType,
          document_name: file.name,
          document_url: `demo-upload-${docType}-${Date.now()}`, // Placeholder URL
          file_size: file.size,
          file_type: file.type,
          is_verified: false
        };

        const { data: document, error: docError } = await supabase
          .from('farmer_documents')
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
      message: 'Farmer registration successful. Your application is pending approval.',
      farmer: {
        id: farmer.id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        farmName: farmer.farm_name,
        address: farmer.address,
        status: farmer.status?.toLowerCase() || 'pending',
        isActive: farmer.is_active || false,
        rating: farmer.rating || 0,
        totalVegetablesSubmitted: farmer.total_vegetables_submitted || 0,
        totalVegetablesApproved: farmer.total_vegetables_approved || 0,
        createdAt: farmer.created_at,
        updatedAt: farmer.updated_at
      },
      documents: uploadedDocuments
    });

  } catch (error: any) {
    console.error('Farmer registration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data: farmers, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farmers:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      farmers: farmers || []
    });

  } catch (error: any) {
    console.error('Error fetching farmers:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

