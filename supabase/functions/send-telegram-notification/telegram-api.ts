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
 * Pre-validate image URL accessibility
 * Returns true if image is accessible, false otherwise
 */
async function validateImageUrl(imageUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log(`🔍 Validating image: ${imageUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = `HTTP ${response.status}: ${response.statusText}`;
      console.error(`❌ Image validation failed: ${error}`);
      return { valid: false, error };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      const error = `Invalid content-type: ${contentType}`;
      console.error(`❌ Image validation failed: ${error}`);
      return { valid: false, error };
    }
    
    console.log(`✅ Image validation passed`);
    return { valid: true };
  } catch (error) {
    const errorMsg = error.name === 'AbortError' ? 'Timeout (5s)' : error.message;
    console.error(`❌ Image validation error: ${errorMsg}`);
    return { valid: false, error: errorMsg };
  }
}

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
  const allAttempts: any[] = []; // Track all attempts for logging
  const problematicImages: string[] = []; // Track problematic image URLs
  
  try {
    if (!imageUrls || imageUrls.length === 0) {
      console.log('No images to send');
      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent successfully (no images)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📸 Preparing to send', imageUrls.length, 'images in media group(s)');
    
    // STEP 1: Pre-validate all images
    console.log('🔍 Step 1: Pre-validating all images...');
    const validationResults = await Promise.all(
      imageUrls.map(url => validateImageUrl(url))
    );
    
    // Filter out invalid images
    const validImages: string[] = [];
    imageUrls.forEach((url, index) => {
      if (validationResults[index].valid) {
        validImages.push(url);
      } else {
        console.warn(`⚠️ Skipping invalid image ${index + 1}: ${url}`);
        console.warn(`   Reason: ${validationResults[index].error}`);
        problematicImages.push(url);
        
        // Log validation failure
        allAttempts.push({
          image_url: url,
          image_index: index + 1,
          attempt_number: 0,
          status: 'validation_failed',
          error: validationResults[index].error,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    if (validImages.length === 0) {
      console.error('❌ No valid images found after validation');
      
      // Log complete failure
      await logTelegramNotification(supabaseClient, {
        function_name: 'send-telegram-notification',
        notification_type: productId ? 'product_notification' : 'media_group',
        recipient_type: 'group',
        recipient_identifier: chatId,
        message_text: messageText,
        status: 'failed',
        related_entity_type: productId ? 'product' : 'media',
        related_entity_id: productId,
        error_details: {
          error_code: 'ALL_IMAGES_INVALID',
          total_images: imageUrls.length,
          problematic_images: problematicImages,
          all_attempts: allAttempts
        }
      });
      
      // Update product status
      if (productId) {
        await supabaseClient
          .from('products')
          .update({ 
            telegram_notification_status: 'failed',
            telegram_last_error: `All ${imageUrls.length} images failed validation. Check image URLs.`,
            tg_notify_status: 'failed',
            tg_notify_error: 'ALL_IMAGES_INVALID',
            tg_notify_attempts: (await supabaseClient.from('products').select('tg_notify_attempts').eq('id', productId).single()).data?.tg_notify_attempts + 1 || 1
          })
          .eq('id', productId);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'All images failed validation',
          problematic_images: problematicImages,
          validation_results: validationResults.map((r, i) => ({ url: imageUrls[i], error: r.error }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`✅ Validation complete: ${validImages.length}/${imageUrls.length} images valid`);
    if (problematicImages.length > 0) {
      console.warn(`⚠️ Skipped ${problematicImages.length} problematic images`);
    }
    
    // Split valid images into chunks of MAX_IMAGES_PER_GROUP (10) for media groups
    const imageChunks = [];
    for (let i = 0; i < validImages.length; i += MAX_IMAGES_PER_GROUP) {
      imageChunks.push(validImages.slice(i, i + MAX_IMAGES_PER_GROUP));
    }
    
    console.log('📦 Divided', validImages.length, 'valid images into', imageChunks.length, 'chunks');
    
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
        const imageIndex = (i * MAX_IMAGES_PER_GROUP) + j + 1;
        console.log(`📎 Adding image ${imageIndex}/${validImages.length} to chunk ${i + 1}:`, imageUrl.substring(0, 80) + '...');
        
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
      
      console.log(`📤 Sending chunk ${i + 1}/${imageChunks.length} with ${chunk.length} images${i === 0 ? ' and caption' : ''}`);
      
      // Retry media group sending up to 5 times in case of failure
      let mediaGroupResult = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        const attemptLog = {
          chunk_number: i + 1,
          chunk_size: chunk.length,
          attempt_number: retryCount + 1,
          timestamp: new Date().toISOString()
        };
        
        try {
          console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} for chunk ${i + 1}`);
          
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
          
          // Log detailed response
          console.log(`📊 Chunk ${i + 1} attempt ${retryCount + 1} result:`, 
            mediaGroupResult.ok ? '✅ SUCCESS' : '❌ FAILED');
          
          if (!mediaGroupResult.ok) {
            console.error(`🔴 Telegram API Error:`, {
              error_code: mediaGroupResult.error_code,
              description: mediaGroupResult.description,
              parameters: mediaGroupResult.parameters
            });
          }
          
          // Add to attempts log
          Object.assign(attemptLog, {
            status: mediaGroupResult.ok ? 'success' : 'failed',
            error_code: mediaGroupResult.error_code,
            error_description: mediaGroupResult.description,
            telegram_message_id: mediaGroupResult.result?.[0]?.message_id,
            retry_after: mediaGroupResult.parameters?.retry_after
          });
          allAttempts.push(attemptLog);
          
          if (mediaGroupResult.ok) {
            console.log(`✅ Chunk ${i + 1} sent successfully`);
            successfulBatches++; // Increment successful batch counter
            break; // Exit retry loop on success
          } else {
            const retryAfter = mediaGroupResult.parameters?.retry_after || 10;
            console.error(`❌ Chunk ${i + 1} failed, attempt ${retryCount + 1}:`, 
              mediaGroupResult.description || 'Unknown error',
              `Retry after: ${retryAfter} seconds`);
            
            // Check if error is related to specific images
            if (mediaGroupResult.error_code === 'WEBPAGE_MEDIA_EMPTY' || 
                mediaGroupResult.description?.includes('media_empty') ||
                mediaGroupResult.description?.includes('wrong file identifier')) {
              console.warn(`⚠️ Image-related error detected: ${mediaGroupResult.error_code || mediaGroupResult.description}`);
              // Mark images in this chunk as potentially problematic
              chunk.forEach(url => {
                if (!problematicImages.includes(url)) {
                  problematicImages.push(url);
                }
              });
            }
            
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait longer between retries (exponential backoff + retry_after)
              const waitTime = (Math.pow(2, retryCount) * 1000) + (retryAfter * 1000);
              console.log(`⏳ Waiting ${(waitTime/1000).toFixed(1)}s before retry ${retryCount+1}...`);
              await waitBetweenBatches(waitTime);
              console.log(`🔄 Retrying chunk ${i + 1}, attempt ${retryCount + 1}...`);
            }
          }
        } catch (error) {
          console.error(`💥 Network error sending chunk ${i + 1}, attempt ${retryCount + 1}:`, error);
          
          // Add to attempts log
          Object.assign(attemptLog, {
            status: 'network_error',
            error: error.message
          });
          allAttempts.push(attemptLog);
          
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait longer between retries for network errors
            const waitTime = Math.pow(2, retryCount) * 2000;
            console.log(`⏳ Waiting ${(waitTime/1000).toFixed(1)}s before retry ${retryCount+1}...`);
            await waitBetweenBatches(waitTime);
            console.log(`🔄 Retrying chunk ${i + 1} after network error, attempt ${retryCount + 1}...`);
          }
        }
      }
      
      // Check if we exceeded retry count
      if (retryCount >= maxRetries) {
        console.error(`🔴 Failed to send chunk ${i + 1} after ${maxRetries} attempts`);
        allMediaGroupsSuccessful = false;
        
        // Try with a smaller number of images if batch failed
        if (chunk.length > 5) {
          console.log(`🔄 Attempting graceful degradation: trying with ${chunk.length > 7 ? 5 : 3} images instead of ${chunk.length}...`);
          const smallerChunk = chunk.slice(0, chunk.length > 7 ? 5 : 3);
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
            console.log(`📊 Smaller batch result:`, smallerResult.ok ? '✅ SUCCESS' : '❌ FAILED');
            
            // Log graceful degradation attempt
            allAttempts.push({
              chunk_number: i + 1,
              chunk_size: smallerChunk.length,
              attempt_number: 'graceful_degradation',
              status: smallerResult.ok ? 'success' : 'failed',
              error_code: smallerResult.error_code,
              error_description: smallerResult.description,
              timestamp: new Date().toISOString()
            });
            
            if (smallerResult.ok) {
              console.log(`✅ Graceful degradation successful for chunk ${i + 1}`);
              successfulBatches++; // Increment if smaller batch succeeded
              
              // Mark excluded images as problematic
              chunk.slice(smallerChunk.length).forEach(url => {
                if (!problematicImages.includes(url)) {
                  problematicImages.push(url);
                  console.warn(`⚠️ Excluded image from successful batch: ${url.substring(0, 80)}...`);
                }
              });
            } else {
              console.error(`❌ Graceful degradation also failed for chunk ${i + 1}`);
            }
          } catch (error) {
            console.error(`💥 Error during graceful degradation:`, error);
            allAttempts.push({
              chunk_number: i + 1,
              attempt_number: 'graceful_degradation',
              status: 'network_error',
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      if (i === 0 && mediaGroupResult && mediaGroupResult.ok) {
        console.log('✅ First media group sent successfully');
        console.log('📊 Detailed response:', JSON.stringify(mediaGroupResult.result?.[0], null, 2));
      }
    }
    
    // Final comprehensive logging
    console.log('📊 === FINAL SUMMARY ===');
    console.log(`Total images submitted: ${imageUrls.length}`);
    console.log(`Valid images: ${validImages.length}`);
    console.log(`Problematic images: ${problematicImages.length}`);
    console.log(`Successful chunks: ${successfulBatches}/${imageChunks.length}`);
    console.log(`Total attempts: ${allAttempts.length}`);
    
    // Determine final status
    const finalStatus = allMediaGroupsSuccessful ? 'sent' : 
                       successfulBatches > 0 ? 'partial' : 
                       'failed';
    
    // Log comprehensive notification details
    await logTelegramNotification(supabaseClient, {
      function_name: 'send-telegram-notification',
      notification_type: productId ? 'product_notification' : 'media_group',
      recipient_type: 'group',
      recipient_identifier: chatId,
      recipient_name: productId ? 'Product Group' : 'Media Group',
      message_text: messageText,
      status: finalStatus,
      telegram_message_id: allAttempts.find(a => a.telegram_message_id)?.telegram_message_id?.toString(),
      related_entity_type: productId ? 'product' : 'media',
      related_entity_id: productId,
      error_details: !allMediaGroupsSuccessful ? {
        total_attempts: allAttempts.length,
        successful_chunks: successfulBatches,
        failed_chunks: imageChunks.length - successfulBatches,
        problematic_images: problematicImages,
        all_attempts: allAttempts
      } : undefined,
      metadata: {
        total_images_submitted: imageUrls.length,
        valid_images: validImages.length,
        invalid_images_count: imageUrls.length - validImages.length,
        successful_chunks: successfulBatches,
        total_chunks: imageChunks.length,
        problematic_images_count: problematicImages.length,
        attempts_count: allAttempts.length
      }
    });
    
    // Update product status based on result
    if (productId) {
      const currentProduct = await supabaseClient
        .from('products')
        .select('tg_notify_attempts')
        .eq('id', productId)
        .single();
      
      const attemptCount = (currentProduct.data?.tg_notify_attempts || 0) + 1;
      
      if (!allMediaGroupsSuccessful && successfulBatches === 0) {
        // Complete failure - reset timestamp to allow retry
        console.log('🔴 All chunks failed - resetting timestamp to allow retry');
        const errorSummary = problematicImages.length > 0
          ? `Failed to send all ${imageChunks.length} chunks. ${problematicImages.length} problematic images identified.`
          : `Failed to send all ${imageChunks.length} chunks after ${allAttempts.length} attempts.`;
        
        await supabaseClient
          .from('products')
          .update({ 
            last_notification_sent_at: null,
            telegram_notification_status: 'failed',
            telegram_last_error: errorSummary,
            tg_notify_status: 'failed',
            tg_notify_error: allAttempts[allAttempts.length - 1]?.error_code || 'UNKNOWN_ERROR',
            tg_notify_attempts: attemptCount
          })
          .eq('id', productId);
      } else if (!allMediaGroupsSuccessful && successfulBatches > 0) {
        // Partial success - keep timestamp but mark as partial
        console.log(`⚠️ Partial success: ${successfulBatches}/${imageChunks.length} chunks sent`);
        await supabaseClient
          .from('products')
          .update({ 
            telegram_notification_status: 'partial',
            telegram_last_error: `Partially sent: ${successfulBatches}/${imageChunks.length} chunks. ${problematicImages.length} images skipped.`,
            tg_notify_status: 'sent',
            tg_notify_attempts: attemptCount
          })
          .eq('id', productId);
      } else {
        // Complete success
        console.log(`✅ Complete success: all ${imageChunks.length} chunks sent`);
        await supabaseClient
          .from('products')
          .update({ 
            telegram_notification_status: 'sent',
            telegram_last_error: null,
            tg_notify_status: 'sent',
            tg_notify_error: null,
            tg_notify_attempts: attemptCount
          })
          .eq('id', productId);
      }
    }
    
    // Return detailed response
    const responseMessage = allMediaGroupsSuccessful 
      ? `✅ Successfully sent all ${imageChunks.length} chunks with ${validImages.length} images` 
      : successfulBatches > 0
        ? `⚠️ Partially sent: ${successfulBatches}/${imageChunks.length} chunks (${problematicImages.length} images skipped)`
        : `❌ Failed to send all ${imageChunks.length} chunks (${problematicImages.length} problematic images)`;
    
    return new Response(
      JSON.stringify({ 
        success: allMediaGroupsSuccessful,
        partial_success: successfulBatches > 0 && !allMediaGroupsSuccessful,
        successful_batches: successfulBatches,
        total_batches: imageChunks.length,
        total_images: imageUrls.length,
        valid_images: validImages.length,
        problematic_images_count: problematicImages.length,
        problematic_images: problematicImages.length > 0 ? problematicImages : undefined,
        attempts_count: allAttempts.length,
        message: responseMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allMediaGroupsSuccessful ? 200 : successfulBatches > 0 ? 206 : 500
      }
    );
  } catch (error) {
    console.error('💥 Critical error in sendImageMediaGroups:', error);
    
    // Log critical error
    await logTelegramNotification(supabaseClient, {
      function_name: 'send-telegram-notification',
      notification_type: productId ? 'product_notification' : 'media_group',
      recipient_type: 'group',
      recipient_identifier: chatId,
      message_text: messageText,
      status: 'failed',
      related_entity_type: productId ? 'product' : 'media',
      related_entity_id: productId,
      error_details: {
        error_type: 'critical_exception',
        error_message: error.message,
        error_stack: error.stack,
        all_attempts: allAttempts,
        problematic_images: problematicImages
      }
    });
    
    // Update product status to failed on exception
    if (productId) {
      try {
        const currentProduct = await supabaseClient
          .from('products')
          .select('tg_notify_attempts')
          .eq('id', productId)
          .single();
        
        await supabaseClient
          .from('products')
          .update({ 
            telegram_notification_status: 'failed',
            telegram_last_error: `Critical error: ${error.message || 'Unknown error'}`,
            tg_notify_status: 'failed',
            tg_notify_error: 'CRITICAL_EXCEPTION',
            tg_notify_attempts: (currentProduct.data?.tg_notify_attempts || 0) + 1
          })
          .eq('id', productId);
      } catch (updateError) {
        console.error('Error updating product status after exception:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        problematic_images: problematicImages.length > 0 ? problematicImages : undefined,
        attempts: allAttempts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
