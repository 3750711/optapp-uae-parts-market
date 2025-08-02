// Personal message handling logic

import { BOT_TOKEN, MAX_IMAGES_PER_GROUP } from "./config.ts";
import { logTelegramNotification } from "../shared/telegram-logger.ts";

// Function to wait between API calls to avoid rate limiting
const waitBetweenBatches = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendPersonalMessage(
  userId: string,
  messageText: string,
  images: string[] | undefined,
  supabaseClient: any,
  adminUser: any
) {
  console.log('=== SENDING PERSONAL MESSAGE ===');
  console.log('Target user ID:', userId);
  console.log('Message length:', messageText.length);
  console.log('Images count:', images?.length || 0);

  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  // Get user's telegram_id
  const { data: targetUser, error: userError } = await supabaseClient
    .from('profiles')
    .select('telegram_id, full_name, email')
    .eq('id', userId)
    .single();

  if (userError || !targetUser) {
    console.error('Target user not found:', userError?.message);
    throw new Error('User not found');
  }

  if (!targetUser.telegram_id) {
    console.error('Target user has no Telegram ID');
    throw new Error('User does not have Telegram ID');
  }

  console.log(`Sending message to user ${targetUser.full_name} (${targetUser.telegram_id})`);

  // Send message via Telegram Bot API
  let telegramResponse;
  let telegramResult;
  
  if (images && images.length > 0) {
    console.log('Sending media group with', images.length, 'images');
    
    // Split images into chunks if needed
    const imageChunks = [];
    for (let i = 0; i < images.length; i += MAX_IMAGES_PER_GROUP) {
      imageChunks.push(images.slice(i, i + MAX_IMAGES_PER_GROUP));
    }
    
    console.log('Divided into', imageChunks.length, 'chunks');
    
    // Send each chunk
    const results = [];
    for (let i = 0; i < imageChunks.length; i++) {
      const chunk = imageChunks[i];
      
      if (i > 0) {
        console.log('Waiting between chunks to avoid rate limits...');
        await waitBetweenBatches(2000);
      }
      
      const mediaGroup = chunk.map((imageUrl: string, index: number) => ({
        type: 'photo',
        media: imageUrl,
        caption: (i === 0 && index === 0) ? messageText : undefined,
        parse_mode: (i === 0 && index === 0) ? 'HTML' : undefined
      }));

      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetUser.telegram_id,
            media: mediaGroup
          })
        }
      );
      
      const result = await response.json();
      results.push(result);
      
      if (!response.ok) {
        console.error(`Chunk ${i + 1} failed:`, result);
        
        // Log failed notification
        await logTelegramNotification(supabaseClient, {
          function_name: 'send-personal-telegram-message',
          notification_type: 'admin_personal_message',
          recipient_type: 'personal',
          recipient_identifier: targetUser.telegram_id.toString(),
          recipient_name: targetUser.full_name || targetUser.email,
          message_text: messageText,
          status: 'failed',
          error_details: result,
          metadata: {
            admin_user_id: adminUser.id,
            admin_name: adminUser.full_name || adminUser.email,
            chunk_number: i + 1,
            total_chunks: imageChunks.length
          }
        });
        
        throw new Error(`Failed to send media group: ${result.description}`);
      }
      
      console.log(`Chunk ${i + 1} sent successfully`);
    }
    
    telegramResult = results[0]; // Use first result for logging
  } else {
    console.log('Sending text message only');
    
    // Send text message only
    telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetUser.telegram_id,
          text: messageText,
          parse_mode: 'HTML'
        })
      }
    );

    telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResult);
      
      // Log failed notification
      await logTelegramNotification(supabaseClient, {
        function_name: 'send-personal-telegram-message',
        notification_type: 'admin_personal_message',
        recipient_type: 'personal',
        recipient_identifier: targetUser.telegram_id.toString(),
        recipient_name: targetUser.full_name || targetUser.email,
        message_text: messageText,
        status: 'failed',
        error_details: telegramResult,
        metadata: {
          admin_user_id: adminUser.id,
          admin_name: adminUser.full_name || adminUser.email
        }
      });
      
      throw new Error(`Failed to send message via Telegram: ${telegramResult.description}`);
    }
  }

  console.log('Message sent successfully via Telegram');

  // Log to telegram notifications
  await logTelegramNotification(supabaseClient, {
    function_name: 'send-personal-telegram-message',
    notification_type: 'admin_personal_message',
    recipient_type: 'personal',
    recipient_identifier: targetUser.telegram_id.toString(),
    recipient_name: targetUser.full_name || targetUser.email,
    message_text: messageText,
    status: 'sent',
    telegram_message_id: telegramResult.result?.message_id?.toString() || telegramResult.result?.[0]?.message_id?.toString(),
    metadata: {
      admin_user_id: adminUser.id,
      admin_name: adminUser.full_name || adminUser.email,
      message_length: messageText.length,
      images_count: images?.length || 0,
      chunks_count: images && images.length > 0 ? Math.ceil(images.length / MAX_IMAGES_PER_GROUP) : 0
    }
  });

  // Log the action (legacy)
  try {
    await supabaseClient
      .from('event_logs')
      .insert({
        action_type: 'admin_telegram_message',
        entity_type: 'user',
        entity_id: userId,
        user_id: adminUser.id,
        details: {
          target_user: targetUser.full_name || targetUser.email,
          telegram_id: targetUser.telegram_id,
          message_length: messageText.length,
          images_count: images?.length || 0,
          telegram_message_id: telegramResult.result?.message_id || telegramResult.result?.[0]?.message_id
        }
      });
    console.log('Action logged successfully');
  } catch (logError) {
    console.error('Failed to log action:', logError);
    // Don't throw here, message was sent successfully
  }

  return {
    success: true,
    message: 'Message sent successfully',
    telegram_result: telegramResult.result
  };
}