import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🔄 Retry Failed Notifications Function starting...');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Starting retry check for failed notifications...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find products with failed notifications that haven't been retried recently
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: failedProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, lot_number, title, telegram_notification_status, telegram_last_error, last_notification_sent_at')
      .eq('status', 'active')
      .eq('telegram_notification_status', 'failed')
      .lt('last_notification_sent_at', fifteenMinutesAgo) // Only retry if last attempt was >15 min ago
      .limit(5); // Process max 5 at a time to avoid overload

    if (fetchError) {
      console.error('❌ Error fetching failed products:', fetchError);
      throw fetchError;
    }

    if (!failedProducts || failedProducts.length === 0) {
      console.log('✅ No failed notifications found needing retry');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No failed notifications to retry',
          retried: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Found ${failedProducts.length} failed notifications to retry`);

    const results = [];
    
    for (const product of failedProducts) {
      console.log(`🔄 Retrying notification for product ${product.id} (LOT #${product.lot_number})`);
      console.log(`   Last error: ${product.telegram_last_error}`);
      
      try {
        // Reset status to allow retry
        const { error: resetError } = await supabase
          .from('products')
          .update({
            telegram_notification_status: 'not_sent',
            telegram_last_error: null,
            last_notification_sent_at: null
          })
          .eq('id', product.id);
        
        if (resetError) {
          console.error(`❌ Error resetting status for ${product.id}:`, resetError);
          results.push({ product_id: product.id, success: false, error: 'Reset failed' });
          continue;
        }

        // Update timestamp to trigger notification
        const { error: updateError } = await supabase.rpc('resend_product_notification', {
          p_product_id: product.id
        });

        if (updateError) {
          console.error(`❌ Error updating timestamp for ${product.id}:`, updateError);
          results.push({ product_id: product.id, success: false, error: 'Timestamp update failed' });
          continue;
        }

        // Call notification function
        const { error: notifyError } = await supabase.functions.invoke(
          'send-telegram-notification',
          {
            body: {
              productId: product.id,
              notificationType: 'product_published'
            }
          }
        );

        if (notifyError) {
          console.error(`❌ Error sending notification for ${product.id}:`, notifyError);
          results.push({ product_id: product.id, success: false, error: notifyError.message });
        } else {
          console.log(`✅ Successfully retried notification for ${product.id}`);
          results.push({ product_id: product.id, success: true });
        }

        // Wait 2 seconds between retries to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Exception retrying ${product.id}:`, error);
        results.push({ product_id: product.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Retry completed: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Retried ${results.length} notifications`,
        successful: successCount,
        failed: results.length - successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Retry function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
