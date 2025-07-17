import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  user_id: string;
  message_text?: string;
  images?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.user_type !== 'admin') {
      throw new Error('Admin access required');
    }

    // Parse request body
    const { user_id, message_text, images }: SendMessageRequest = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    if (!message_text && (!images || images.length === 0)) {
      throw new Error('Either message text or images are required');
    }

    // Get target user's telegram_id
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('telegram_id, full_name, email')
      .eq('id', user_id)
      .single();

    if (targetUserError || !targetUser) {
      throw new Error('User not found');
    }

    if (!targetUser.telegram_id) {
      throw new Error('User does not have a Telegram ID');
    }

    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramBotToken) {
      throw new Error('Telegram bot token not configured');
    }

    let success = false;
    let error_message = '';

    try {
      // If we have images, send as media group with caption
      if (images && images.length > 0) {
        if (images.length === 1) {
          // Single photo with caption
          const photoResponse = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetUser.telegram_id,
                photo: images[0],
                caption: message_text || '',
                parse_mode: 'HTML'
              })
            }
          );

          const photoResult = await photoResponse.json();
          if (!photoResult.ok) {
            throw new Error(`Telegram API error: ${photoResult.description}`);
          }
        } else {
          // Multiple photos as media group
          const media = images.map((url, index) => ({
            type: 'photo',
            media: url,
            caption: index === 0 ? (message_text || '') : undefined
          }));

          const mediaResponse = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/sendMediaGroup`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetUser.telegram_id,
                media: media
              })
            }
          );

          const mediaResult = await mediaResponse.json();
          if (!mediaResult.ok) {
            throw new Error(`Telegram API error: ${mediaResult.description}`);
          }
        }
      } else if (message_text) {
        // Text message only
        const textResponse = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetUser.telegram_id,
              text: message_text,
              parse_mode: 'HTML'
            })
          }
        );

        const textResult = await textResponse.json();
        if (!textResult.ok) {
          throw new Error(`Telegram API error: ${textResult.description}`);
        }
      }

      success = true;
      console.log(`Personal message sent successfully to user ${user_id} (${targetUser.full_name || targetUser.email})`);

    } catch (telegramError) {
      error_message = telegramError.message;
      console.error('Telegram send error:', telegramError);
    }

    // Log the attempt
    try {
      await supabase
        .from('event_logs')
        .insert({
          action_type: 'telegram_personal_message',
          entity_type: 'user',
          entity_id: user_id,
          user_id: user.id,
          details: {
            success,
            error_message,
            message_text: message_text || '',
            images_count: images?.length || 0,
            target_user: {
              name: targetUser.full_name,
              email: targetUser.email
            }
          }
        });
    } catch (logError) {
      console.error('Failed to log message attempt:', logError);
    }

    if (!success) {
      throw new Error(error_message || 'Failed to send message');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-personal-telegram-message:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});