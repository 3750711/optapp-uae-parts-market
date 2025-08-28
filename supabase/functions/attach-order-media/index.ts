import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Get JWT token and verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Create Supabase client to verify JWT and check admin role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAuth
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse request body (support both new batch format and legacy single file)
    const payload = await req.json();
    
    // Validate Cloudinary URLs
    const CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const validateCloudinaryUrl = (url: string): boolean => {
      if (!CLOUD_NAME) return false;
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
          error: 'Missing or invalid fields. Required: order_id, items (array)' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate all URLs and file types
    for (const item of mediaItems) {
      if (!item.url || item.type !== 'photo') {
        return new Response(
          JSON.stringify({ error: 'Invalid item: url and type:"photo" required' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      if (!validateCloudinaryUrl(item.url)) {
        return new Response(
          JSON.stringify({ error: 'Invalid URL: only Cloudinary URLs allowed' }),
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
      source: 'admin'
    }));

    const { data, error } = await supabase
      .from('order_media')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save media to database' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Successfully attached ${mediaItems.length} media items to order ${orderId}`);

    return new Response(
      JSON.stringify({ success: true, data, count: mediaItems.length }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});