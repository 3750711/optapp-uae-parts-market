
// ======================== IMPORTANT NOTICE ========================
// This file contains critical API interaction functionality.
// DO NOT EDIT unless absolutely necessary!
// 
// Any changes may affect both order and product notifications
// that send messages to Telegram. This system is currently working properly.
// 
// Version: 1.1.0
// Last Verified Working: 2025-06-06
// Change: Added video media groups support
// ================================================================

// Utility functions for sending messages via Telegram API

import { MAX_IMAGES_PER_GROUP, MAX_VIDEOS_PER_GROUP } from "./config.ts";

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
          } catch (error) {
            console.error(`Error sending smaller batch:`, error);
          }
        }
      }
      
      if (i === 0 && mediaGroupResult) {
        console.log('First media group detailed response:', JSON.stringify(mediaGroupResult));
      }
    }
    
    // Update the notification timestamp to indicate a successful send (only for product notifications, not order notifications)
    if (allMediaGroupsSuccessful && productId) {
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ 
          last_notification_sent_at: new Date().toISOString() 
        })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error updating notification timestamp:', updateError);
      } else {
        console.log('Successfully updated notification timestamp after sending');
      }
    } else if (!allMediaGroupsSuccessful && productId) {
      // If some media groups failed, reset notification timestamp to allow retry
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ last_notification_sent_at: null })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error resetting notification timestamp after failure:', updateError);
      } else {
        console.log('Reset notification timestamp to allow retry after partial failure');
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: allMediaGroupsSuccessful, 
        message: allMediaGroupsSuccessful 
          ? 'Notification sent successfully' 
          : 'Notification partially sent, some image groups failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending media groups:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

/**
 * Sends videos in media groups with optional message text
 */
export async function sendVideoMediaGroups(
  videoUrls: string[], 
  messageText: string,
  chatId: string,
  corsHeaders: Record<string, string>,
  botToken: string
) {
  try {
    if (!videoUrls || videoUrls.length === 0) {
      console.log('No videos to send');
      return new Response(
        JSON.stringify({ success: true, message: 'No videos to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Preparing to send', videoUrls.length, 'videos in media group(s)');
    
    // Split videos into chunks of MAX_VIDEOS_PER_GROUP (10) for media groups
    const videoChunks = [];
    for (let i = 0; i < videoUrls.length; i += MAX_VIDEOS_PER_GROUP) {
      videoChunks.push(videoUrls.slice(i, i + MAX_VIDEOS_PER_GROUP));
    }
    
    console.log('Divided', videoUrls.length, 'videos into', videoChunks.length, 'chunks');
    
    // Send each chunk as a media group
    let allVideoGroupsSuccessful = true;
    
    for (let i = 0; i < videoChunks.length; i++) {
      const chunk = videoChunks[i];
      const mediaItems = [];
      
      // Wait between chunks to avoid rate limits
      if (i > 0) {
        console.log(`Waiting 10 seconds before sending video chunk ${i+1} to avoid rate limits...`);
        await waitBetweenBatches(10000);
      }
      
      // Add each video to the group
      for (let j = 0; j < chunk.length; j++) {
        const videoUrl = chunk[j];
        console.log(`Adding video to ${i === 0 ? 'first' : 'next'} group:`, videoUrl);
        
        // Add caption only to the first video of the first group
        const isFirstVideoOfFirstGroup = i === 0 && j === 0;
        const mediaItem: any = {
          type: 'video',
          media: videoUrl,
        };
        
        if (isFirstVideoOfFirstGroup && messageText) {
          mediaItem.caption = messageText;
          mediaItem.parse_mode = 'HTML';
        }
        
        mediaItems.push(mediaItem);
      }
      
      console.log(`Sending ${i === 0 ? 'first' : 'next'} video chunk with ${chunk.length} videos${i === 0 ? ' and caption' : ''}`);
      
      // Retry video media group sending up to 3 times in case of failure
      let videoGroupResult = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Send the video media group to the appropriate chat ID
          const videoGroupResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              media: mediaItems,
            }),
          });
          
          videoGroupResult = await videoGroupResponse.json();
          console.log(`Video group ${i + 1} attempt ${retryCount + 1} response:`, 
            videoGroupResult.ok ? 'SUCCESS' : 'FAILED');
          
          if (videoGroupResult.ok) {
            break; // Exit retry loop on success
          } else {
            const retryAfter = videoGroupResult.parameters?.retry_after || 15;
            console.error(`Error sending video group ${i + 1}, attempt ${retryCount + 1}:`, 
              videoGroupResult.description || 'Unknown error',
              `Retry after: ${retryAfter} seconds`);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait longer between retries (exponential backoff + retry_after)
              const waitTime = (Math.pow(2, retryCount) * 1500) + (retryAfter * 1000);
              console.log(`Waiting ${waitTime/1000} seconds before video retry ${retryCount+1}...`);
              await waitBetweenBatches(waitTime);
              console.log(`Retrying video group ${i + 1}, attempt ${retryCount + 1}...`);
            }
          }
        } catch (error) {
          console.error(`Network error sending video group ${i + 1}, attempt ${retryCount + 1}:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait longer between retries for network errors
            const waitTime = Math.pow(2, retryCount) * 3000;
            console.log(`Waiting ${waitTime/1000} seconds before video retry ${retryCount+1}...`);
            await waitBetweenBatches(waitTime);
            console.log(`Retrying video group ${i + 1} after network error, attempt ${retryCount + 1}...`);
          }
        }
      }
      
      // For videos we don't try smaller batches like with images because videos are already bigger and more complex
      if (retryCount >= maxRetries) {
        console.error(`Failed to send video group ${i + 1} after ${maxRetries} attempts`);
        allVideoGroupsSuccessful = false;
      }
      
      if (i === 0 && videoGroupResult) {
        console.log('First video group detailed response:', JSON.stringify(videoGroupResult));
      }
    }
    
    // Return success response for videos
    return new Response(
      JSON.stringify({ 
        success: allVideoGroupsSuccessful, 
        message: allVideoGroupsSuccessful 
          ? 'Videos sent successfully' 
          : 'Videos partially sent, some video groups failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending video media groups:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
