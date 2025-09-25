import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OrderMediaItem {
  url: string;
  public_id?: string;
  type: 'photo';
}

interface OrderMediaPayload {
  order_id: string;
  items: OrderMediaItem[];
  uploaded_by?: number; // telegram user_id
}

// Legacy single file interface for backward compatibility
interface LegacyOrderMediaPayload {
  order_id: string;
  file_url: string;
  file_type: 'photo';
  uploaded_by?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Get JWT token and verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey, serviceRoleKey: !!serviceRoleKey });
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error', detail: 'Missing environment variables' }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication', detail: authError?.message }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAuth
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Profile lookup failed', detail: profileError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (profile?.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse request body (support both new batch format and legacy single file)
    let payload;
    try {
      payload = await req.json();
      console.log('Received payload:', payload);
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body', detail: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate Cloudinary URLs
    const CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    if (!CLOUD_NAME) {
      console.error('Missing CLOUDINARY_CLOUD_NAME environment variable');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error', detail: 'Missing Cloudinary configuration' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const validateCloudinaryUrl = (url: string): boolean => {
      return url.startsWith(`https://res.cloudinary.com/${CLOUD_NAME}/`) || 
             url.startsWith(`https://cloudinary.com/${CLOUD_NAME}/`);
    };

    let mediaItems: OrderMediaItem[] = [];
    let orderId: string;
    let uploadedBy: number | undefined;

    // Handle both new batch format and legacy single file format
    if ('items' in payload) {
      // New batch format
      const batchPayload = payload as OrderMediaPayload;
      orderId = batchPayload.order_id;
      uploadedBy = batchPayload.uploaded_by;
      mediaItems = batchPayload.items;
    } else {
      // Legacy single file format
      const legacyPayload = payload as LegacyOrderMediaPayload;
      orderId = legacyPayload.order_id;
      uploadedBy = legacyPayload.uploaded_by;
      mediaItems = [{
        url: legacyPayload.file_url,
        type: 'photo'
      }];
    }

    // Validate required fields
    if (!orderId || !mediaItems || mediaItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing or invalid fields. Required: order_id, items (array)',
          detail: `Received: order_id=${orderId}, items_length=${mediaItems?.length}`
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate all URLs and file types
    for (const item of mediaItems) {
      if (!item.url || item.type !== 'photo') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid item: url and type:"photo" required',
            detail: `Item: ${JSON.stringify(item)}`
          }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      if (!validateCloudinaryUrl(item.url)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid URL: only Cloudinary URLs allowed',
            detail: `URL: ${item.url}`
          }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Create Supabase client with service role key for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert order media records in batch
    const insertData = mediaItems.map(item => ({
      order_id: orderId,
      file_url: item.url,
      public_id: item.public_id,
      file_type: item.type,
      uploaded_by: uploadedBy,
      source: 'web'
    }));

    const { data, error } = await supabase
      .from('order_media')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to save media to database',
          detail: `${error.code}: ${error.message}`
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Successfully attached ${mediaItems.length} media items to order ${orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: mediaItems.length,
        data 
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});