import { RATE_LIMIT, BOT_TOKEN } from './config.ts'
import { logTelegramNotification } from "../shared/telegram-logger.ts";

export async function sendBulkMessages(
  recipients: string[] | string,
  messageText: string,
  images: string[],
  supabase: any,
  adminUser: any
) {
  console.log('Starting bulk message sending...')
  
  // Create initial message history record
  const { data: messageRecord, error: messageRecordError } = await supabase
    .from('message_history')
    .insert({
      sender_id: adminUser.id,
      recipient_ids: Array.isArray(recipients) ? recipients : [],
      recipient_group: typeof recipients === 'string' ? recipients : null,
      message_text: messageText,
      image_urls: images,
      status: 'processing'
    })
    .select()
    .single()

  if (messageRecordError) {
    console.error('Failed to create message history record:', messageRecordError)
    // Continue anyway, don't block message sending
  }

  const messageHistoryId = messageRecord?.id
  
  // Get recipient user IDs
  let recipientIds: string[] = []
  
  if (Array.isArray(recipients)) {
    recipientIds = recipients
  } else if (typeof recipients === 'string') {
    // Handle predefined groups
    recipientIds = await getRecipientsByGroup(recipients, supabase)
  } else {
    throw new Error('Invalid recipients format')
  }

  console.log(`Processing ${recipientIds.length} recipients`)
  
  // Get ALL user profiles first to identify those without telegram_id
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('id, telegram_id, full_name, telegram, email')
    .in('id', recipientIds)

  if (allProfilesError) {
    console.error('Error fetching all profiles:', allProfilesError)
    throw new Error('Failed to fetch recipient profiles')
  }

  // Separate users with and without telegram_id
  const usersWithTelegram = allProfiles.filter(profile => profile.telegram_id)
  const usersWithoutTelegram = allProfiles.filter(profile => !profile.telegram_id)
  
  console.log(`Found ${usersWithTelegram.length} users with Telegram ID, ${usersWithoutTelegram.length} without`)
  
  const results = {
    total: recipientIds.length,
    sent: 0,
    failed: 0,
    no_telegram: usersWithoutTelegram.length,
    errors: [] as any[],
    no_telegram_users: [] as any[]
  }

  // Log errors for users without telegram_id (don't attempt to send)
  for (const profile of usersWithoutTelegram) {
    const userName = profile.full_name || profile.telegram || profile.email || 'Неизвестный пользователь'
    
    await logMessageSent(supabase, {
      adminUserId: adminUser.id,
      recipientUserId: profile.id,
      messageText,
      images,
      status: 'failed',
      error: 'no_telegram_id'
    })
    
    results.no_telegram_users.push({
      userId: profile.id,
      userName,
      reason: 'no_telegram_id'
    })
    
    console.log(`Skipped user without Telegram ID: ${userName}`)
  }
  
  // Process in batches only for users with Telegram IDs
  const batches = []
  for (let i = 0; i < usersWithTelegram.length; i += RATE_LIMIT.BATCH_SIZE) {
    batches.push(usersWithTelegram.slice(i, i + RATE_LIMIT.BATCH_SIZE))
  }
  
  console.log(`Processing ${batches.length} batches`)
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} recipients`)
    
    // Send messages in parallel within batch
    const batchPromises = batch.map(async (profile) => {
      const userName = profile.full_name || profile.telegram || 'user';
      try {
        const messageWithSignature = `${messageText}\n\n📩 Сообщение от администратора partsbay.ae`;
        await sendTelegramMessage(profile.telegram_id, messageText, images)
        
        // Log to telegram notifications
        await logTelegramNotification(supabase, {
          function_name: 'send-bulk-telegram-messages',
          notification_type: 'bulk_message',
          recipient_type: 'personal',
          recipient_identifier: profile.telegram_id.toString(),
          recipient_name: userName,
          message_text: messageWithSignature,
          status: 'sent',
          metadata: {
            admin_user_id: adminUser.id,
            admin_name: adminUser.full_name || adminUser.email,
            image_count: images.length,
            batch_index: batchIndex + 1,
            total_batches: batches.length
          }
        });
        
        // Log successful send (legacy)
        await logMessageSent(supabase, {
          adminUserId: adminUser.id,
          recipientUserId: profile.id,
          messageText,
          images,
          status: 'success'
        })
        
        results.sent++
        console.log(`Message sent to ${userName} (${profile.telegram_id})`)
      } catch (error) {
        console.error(`Failed to send message to ${userName}:`, error)
        
        // Log to telegram notifications
        await logTelegramNotification(supabase, {
          function_name: 'send-bulk-telegram-messages',
          notification_type: 'bulk_message',
          recipient_type: 'personal',
          recipient_identifier: profile.telegram_id.toString(),
          recipient_name: userName,
          message_text: `${messageText}\n\n📩 Сообщение от администратора partsbay.ae`,
          status: 'failed',
          error_details: {
            error_message: error.message,
            batch_index: batchIndex + 1
          },
          metadata: {
            admin_user_id: adminUser.id,
            admin_name: adminUser.full_name || adminUser.email,
            image_count: images.length
          }
        });
        
        // Log failed send (legacy)
        await logMessageSent(supabase, {
          adminUserId: adminUser.id,
          recipientUserId: profile.id,
          messageText,
          images,
          status: 'failed',
          error: error.message
        })
        
        results.failed++
        results.errors.push({
          userId: profile.id,
          userName: profile.full_name || profile.telegram,
          error: error.message
        })
      }
    })
    
    await Promise.all(batchPromises)
    
    // Delay between batches (except for the last one)
    if (batchIndex < batches.length - 1) {
      console.log(`Waiting ${RATE_LIMIT.DELAY_BETWEEN_BATCHES}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_BATCHES))
    }
  }
  
  // Update message history record with final results and detailed statistics
  if (messageHistoryId) {
    const totalFailed = results.failed + results.no_telegram
    const statusValue = totalFailed === 0 ? 'completed' : 
                       (results.sent > 0 ? 'partial_failure' : 'failed')
    
    const errorDetails = {
      summary: {
        total_recipients: results.total,
        sent_successfully: results.sent,
        send_failed: results.failed,
        no_telegram: results.no_telegram
      },
      no_telegram_users: results.no_telegram_users,
      send_failures: results.errors
    }
    
    await supabase
      .from('message_history')
      .update({
        status: statusValue,
        sent_count: results.sent,
        failed_count: totalFailed,
        error_details: errorDetails
      })
      .eq('id', messageHistoryId)
  }
  
  console.log('Bulk message sending completed:', results)
  return results
}

async function getRecipientsByGroup(groupType: string, supabase: any): Promise<string[]> {
  console.log(`Getting recipients for group: ${groupType}`)
  
  let query = supabase.from('profiles').select('id')
  
  switch (groupType) {
    case 'all_users':
      // No additional filter - all users
      break
    case 'sellers':
      query = query.eq('user_type', 'seller')
      break
    case 'buyers':
      query = query.eq('user_type', 'buyer')
      break
    case 'verified_users':
      query = query.eq('verification_status', 'verified')
      break
    case 'pending_users':
      query = query.eq('verification_status', 'pending')
      break
    case 'opt_users':
      query = query.eq('opt_status', 'opt_user')
      break
    default:
      throw new Error(`Unknown group type: ${groupType}`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching group recipients:', error)
    throw new Error(`Failed to fetch recipients for group: ${groupType}`)
  }
  
  return data?.map(profile => profile.id) || []
}

async function sendTelegramMessage(telegramId: number, messageText: string, images: string[]) {
  const botToken = BOT_TOKEN
  if (!botToken) {
    throw new Error('Telegram bot token not configured')
  }

  // Add admin signature
  const messageWithSignature = `${messageText}\n\n📩 Сообщение от администратора partsbay.ae`

  if (images && images.length > 0) {
    // Send as media group if images exist
    const media = images.slice(0, 10).map((imageUrl, index) => ({
      type: 'photo',
      media: imageUrl,
      caption: index === 0 ? messageWithSignature : undefined
    }))

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramId,
        media: media
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Telegram API error: ${response.status} - ${errorData}`)
    }
  } else {
    // Send text message only
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: messageWithSignature,
        parse_mode: 'HTML'
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Telegram API error: ${response.status} - ${errorData}`)
    }
  }
}

async function logMessageSent(supabase: any, params: {
  adminUserId: string
  recipientUserId: string
  messageText: string
  images: string[]
  status: 'success' | 'failed'
  error?: string
}) {
  try {
    await supabase
      .from('event_logs')
      .insert({
        action_type: 'bulk_message_send',
        entity_type: 'message',
        entity_id: params.recipientUserId,
        user_id: params.adminUserId,
        details: {
          messageText: params.messageText.substring(0, 100), // Truncate for storage
          imageCount: params.images.length,
          status: params.status,
          error: params.error,
          timestamp: new Date().toISOString()
        }
      })
  } catch (error) {
    console.error('Failed to log message send:', error)
    // Don't throw - logging failure shouldn't stop the message sending
  }
}