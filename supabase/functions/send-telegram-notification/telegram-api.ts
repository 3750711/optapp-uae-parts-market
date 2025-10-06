// ======================== IMPORTANT NOTICE ========================
// This file contains critical API interaction functionality.
// DO NOT EDIT unless absolutely necessary!
// 
// Any changes may affect both order and product notifications
// that send messages to Telegram. This system is currently working properly.
// 
// Version: 1.0.1
// Last Modified: 2025-10-06 - Fixed successfulBatches bug
// Last Verified Working: 2025-05-22
// ================================================================

// Utility functions for sending messages via Telegram API

import { MAX_IMAGES_PER_GROUP } from "./config.ts";
import { logTelegramNotification } from "../shared/telegram-logger.ts";

// Function to wait between API calls to avoid rate limiting
export const waitBetweenBatches = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends images in media groups with optional message text
 */
export async function sendImageMediaGroups(
  imageUrls: string[], 
  messageText: string, 
  supabaseClient: any, 
  productId: string | null,
  chatId: string,
  corsHeaders: Record<string, string>,
  botToken: string
) {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      console.log('No images to send');
      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent successfully (no images)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Preparing to send', imageUrls.length, 'images in media group(s)');
    
    // Split images into chunks of MAX_IMAGES_PER_GROUP (10) for media groups
    const imageChunks = [];
    for (let i = 0; i < imageUrls.length; i += MAX_IMAGES_PER_GROUP) {
      imageChunks.push(imageUrls.slice(i, i + MAX_IMAGES_PER_GROUP));
    }
    
    console.log('Divided', imageUrls.length, 'images into', imageChunks.length, 'chunks');
    
    // Send each chunk as a media group
    let allMediaGroupsSuccessful = true;
    let successfulBatches = 0; // Track successful batches
    
    for (let i = 0; i < imageChunks.length; i++) {
      const chunk = imageChunks[i];
      const mediaItems = [];
      
      // Wait between chunks to avoid rate limits
      if (i > 0) {
        console.log(`Waiting 5 seconds before sending chunk ${i+1} to avoid rate limits...`);
        await waitBetweenBatches(5000);
      }
      
      // Add each image to the group
      for (let j = 0; j < chunk.length; j++) {
        const imageUrl = chunk[j];
        console.log(`Adding image to ${i === 0 ? 'first' : 'next'} group:`, imageUrl);
        
        // Add caption only to the first image of the first group
        const isFirstImageOfFirstGroup = i === 0 && j === 0;
        const mediaItem: any = {
          type: 'photo',
          media: imageUrl,
        };
        
        if (isFirstImageOfFirstGroup && messageText) {
          mediaItem.caption = messageText;
          mediaItem.parse_mode = 'HTML';
        }
        
        mediaItems.push(mediaItem);
      }
      
      console.log(`Sending ${i === 0 ? 'first' : 'next'} chunk with ${chunk.length} images${i === 0 ? ' and caption' : ''}`);
      
      // Retry media group sending up to 5 times in case of failure
      let mediaGroupResult = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        try {
          // Send the media group to the appropriate chat ID
          const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              media: mediaItems,
            }),
          });
          
          mediaGroupResult = await mediaGroupResponse.json();
          console.log(`Media group ${i + 1} attempt ${retryCount + 1} response:`, 
            mediaGroupResult.ok ? 'SUCCESS' : 'FAILED');
          
          if (mediaGroupResult.ok) {
            successfulBatches++; // Increment successful batch counter
            break; // Exit retry loop on success
          } else {
            const retryAfter = mediaGroupResult.parameters?.retry_after || 10;
            console.error(`Error sending media group ${i + 1}, attempt ${retryCount + 1}:`, 
              mediaGroupResult.description || 'Unknown error',
              `Retry after: ${retryAfter} seconds`);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait longer between retries (exponential backoff + retry_after)
              const waitTime = (Math.pow(2, retryCount) * 1000) + (retryAfter * 1000);
              console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
              await waitBetweenBatches(waitTime);
              console.log(`Retrying media group ${i + 1}, attempt ${retryCount + 1}...`);
            }
          }
        } catch (error) {
          console.error(`Network error sending media group ${i + 1}, attempt ${retryCount + 1}:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait longer between retries for network errors
            const waitTime = Math.pow(2, retryCount) * 2000;
            console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
            await waitBetweenBatches(waitTime);
            console.log(`Retrying media group ${i + 1} after network error, attempt ${retryCount + 1}...`);
          }
        }
      }
      
      // Check if we exceeded retry count
      if (retryCount >= maxRetries) {
        console.error(`Failed to send media group ${i + 1} after ${maxRetries} attempts`);
        allMediaGroupsSuccessful = false;
        
        // Try with a smaller number of images if batch failed
        if (chunk.length > 5) {
          const smallerChunk = chunk.slice(0, 5);
          const smallerItems = smallerChunk.map((imageUrl, index) => {
            if (index === 0 && i === 0) {
              return {
                type: 'photo',
                media: imageUrl,
                caption: messageText,
                parse_mode: 'HTML'
              };
            }
            return {
              type: 'photo',
              media: imageUrl
            };
          });
          
          console.log(`Trying with smaller batch of ${smallerChunk.length} images...`);
          await waitBetweenBatches(3000);
          
          try {
            const smallerResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: chatId,
                media: smallerItems
              }),
            });
            
            const smallerResult = await smallerResponse.json();
            console.log(`Smaller batch result:`, smallerResult.ok ? 'SUCCESS' : 'FAILED');
            
            if (smallerResult.ok) {
              successfulBatches++; // Increment if smaller batch succeeded
            }
          } catch (error) {
            console.error(`Error sending smaller batch:`, error);
          }
        }
      }
      
      if (i === 0 && mediaGroupResult && mediaGroupResult.ok) {
        console.log('First media group detailed response:', JSON.stringify(mediaGroupResult));
        
        // Log successful media group send (for first group with caption)
        await logTelegramNotification(supabaseClient, {
          function_name: 'send-telegram-notification',
          notification_type: productId ? 'product_published' : 'media_group',
          recipient_type: 'group',
          recipient_identifier: chatId,
          recipient_name: productId ? 'Product Group' : 'Media Group',
          message_text: messageText,
          status: 'sent',
          telegram_message_id: mediaGroupResult.result?.[0]?.message_id?.toString(),
          related_entity_type: productId ? 'product' : 'media',
          related_entity_id: productId,
          metadata: {
            media_group_size: chunk.length,
            total_images: imageUrls.length,
            chunk_number: i + 1,
            total_chunks: imageChunks.length
          }
        });
      }
    }
    
    // Only reset notification timestamp if all media groups failed (to allow retry)
    // If notification was partially successful, keep the timestamp to prevent spam
    if (!allMediaGroupsSuccessful && productId && successfulBatches === 0) {
      console.log('All media groups failed - resetting timestamp to allow retry');
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ 
          last_notification_sent_at: null,
          telegram_notification_status: 'failed',
          telegram_last_error: 'All media groups failed to send after multiple retries'
        })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error resetting notification timestamp after complete failure:', updateError);
      } else {
        console.log('Reset notification timestamp to allow retry after complete failure');
      }
    }
    
    // Return success response with detailed batch information
    const responseMessage = allMediaGroupsSuccessful 
      ? 'Notification sent successfully' 
      : successfulBatches > 0
        ? `Notification partially sent (${successfulBatches}/${imageChunks.length} groups succeeded)`
        : 'All media groups failed to send';
    
    return new Response(
      JSON.stringify({ 
        success: allMediaGroupsSuccessful,
        partial_success: successfulBatches > 0 && !allMediaGroupsSuccessful,
        successful_batches: successfulBatches,
        total_batches: imageChunks.length,
        message: responseMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending media groups:', error);
    
    // Update product status to failed on exception
    if (productId) {
      try {
        await supabaseClient
          .from('products')
          .update({ 
            telegram_notification_status: 'failed',
            telegram_last_error: error.message || 'Unknown error in sendImageMediaGroups'
          })
          .eq('id', productId);
      } catch (updateError) {
        console.error('Error updating product status after exception:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
