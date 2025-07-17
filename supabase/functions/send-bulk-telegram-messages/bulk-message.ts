import { RATE_LIMIT, BOT_TOKEN } from './config.ts'

export async function sendBulkMessages(
  recipients: string[] | string,
  messageText: string,
  images: string[],
  supabase: any,
  adminUser: any
) {
  console.log('Starting bulk message sending...')
  
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
  
  // Get user profiles with telegram_id
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, telegram_id, full_name, telegram')
    .in('id', recipientIds)
    .not('telegram_id', 'is', null)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    throw new Error('Failed to fetch recipient profiles')
  }

  console.log(`Found ${profiles?.length || 0} profiles with Telegram IDs`)
  
  const results = {
    total: recipientIds.length,
    sent: 0,
    failed: 0,
    errors: [] as any[]
  }
  
  // Process in batches
  const batches = []
  for (let i = 0; i < profiles.length; i += RATE_LIMIT.BATCH_SIZE) {
    batches.push(profiles.slice(i, i + RATE_LIMIT.BATCH_SIZE))
  }
  
  console.log(`Processing ${batches.length} batches`)
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} recipients`)
    
    // Send messages in parallel within batch
    const batchPromises = batch.map(async (profile) => {
      try {
        await sendTelegramMessage(profile.telegram_id, messageText, images)
        
        // Log successful send
        await logMessageSent(supabase, {
          adminUserId: adminUser.id,
          recipientUserId: profile.id,
          messageText,
          images,
          status: 'success'
        })
        
        results.sent++
        console.log(`Message sent to ${profile.full_name || profile.telegram || 'user'} (${profile.telegram_id})`)
      } catch (error) {
        console.error(`Failed to send message to ${profile.full_name || profile.telegram || 'user'}:`, error)
        
        // Log failed send
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

  if (images && images.length > 0) {
    // Send as media group if images exist
    const media = images.slice(0, 10).map((imageUrl, index) => ({
      type: 'photo',
      media: imageUrl,
      caption: index === 0 ? messageText : undefined
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
        text: messageText,
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