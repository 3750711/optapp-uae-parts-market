import { createServiceClient } from '../_shared/client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { logTelegramNotification } from '../shared/telegram-logger.ts';
import { getLocalTelegramAccounts, getTelegramForDisplay } from '../shared/telegram-config.ts';

// Constants
const TG_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const MAX_IMAGES_PER_GROUP = 10;
const DELAY_BETWEEN_CHUNKS = 1000; // ms

/**
 * Transform Cloudinary URL to be Telegram-friendly
 * Converts to JPEG with quality optimization
 * Removes fl_attachment which causes WEBPAGE_MEDIA_EMPTY error
 */
function makeCloudinaryTelegramFriendly(url: string): string {
  if (!url.includes('res.cloudinary.com')) {
    return url; // Not a Cloudinary URL, return as-is
  }

  // Find /image/upload/ marker
  const uploadMarker = '/image/upload/';
  const uploadIndex = url.indexOf(uploadMarker);
  
  if (uploadIndex === -1) {
    console.warn(`⚠️ [Cloudinary] Could not find /image/upload/ in URL: ${url}`);
    return url;
  }
  
  // Insert transformations right after /upload/
  const beforeUpload = url.substring(0, uploadIndex + uploadMarker.length);
  const afterUpload = url.substring(uploadIndex + uploadMarker.length);
  
  // Check if already has transformations
  if (afterUpload.startsWith('f_jpg,q_auto')) {
    console.log(`✅ [Cloudinary] URL already has transformations`);
    return url;
  }
  
  // Convert to JPEG with quality optimization (no fl_attachment)
  const transforms = 'f_jpg,q_auto:good/';
  const newUrl = `${beforeUpload}${transforms}${afterUpload}`;
  
  console.log(`🔄 [Cloudinary] Transformed for Telegram:`);
  console.log(`   Original: ${url.substring(0, 80)}...`);
  console.log(`   Modified: ${newUrl.substring(0, 80)}...`);
  
  return newUrl;
}

/**
 * Parse failed image index from Telegram error message
 * Example: "Wrong file identifier/http url specified: failed at index 3"
 */
function parseFailedImageIndex(errorDescription: string): number | null {
  const match = errorDescription.match(/failed at index (\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Simple Telegram send function WITHOUT retry logic
 * Retry is handled by QStash, not here
 * 
 * CRITICAL: Includes fallback for WEBPAGE_MEDIA_EMPTY errors
 */
async function sendToTelegram(
  chatId: string,
  message: string,
  images: string[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (!TG_BOT_TOKEN) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  // Transform all images to be Telegram-friendly
  const telegramImages = images.map(makeCloudinaryTelegramFriendly).filter(url => url && url.trim() !== '');
  
  // Check for empty images array after filtering
  if (images.length > 0 && telegramImages.length === 0) {
    console.warn('⚠️ All images were filtered out (empty/invalid URLs), sending text-only');
  }
  
  // Text-only message
  if (telegramImages.length === 0) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.description };
      }
      
      const result = await response.json();
      return { success: true, messageId: result.result.message_id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Media groups - chunk into groups of 10
  const chunks: string[][] = [];
  for (let i = 0; i < telegramImages.length; i += MAX_IMAGES_PER_GROUP) {
    chunks.push(telegramImages.slice(i, i + MAX_IMAGES_PER_GROUP));
  }
  
  console.log(`📤 Sending ${telegramImages.length} images in ${chunks.length} chunks`);
  
  let firstMessageId: string | undefined;
  
  try {
    for (let i = 0; i < chunks.length; i++) {
      // Delay between chunks
      if (i > 0) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_CHUNKS));
      }
      
      const media = chunks[i].map((url, idx) => ({
        type: 'photo',
        media: url,
        // Caption only on first image of first chunk
        ...(i === 0 && idx === 0 ? { caption: message, parse_mode: 'HTML' } : {})
      }));
      
      const response = await fetch(
        `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMediaGroup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, media })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        const errorDesc = error.description || 'Unknown error';
        
        // CRITICAL: Handle WEBPAGE_MEDIA_EMPTY and similar image errors
        if (errorDesc.includes('WEBPAGE_MEDIA_EMPTY') || 
            errorDesc.includes('failed to get HTTP URL content') ||
            errorDesc.includes('Wrong file identifier')) {
          
          console.warn(`⚠️ Image error: ${errorDesc}, attempting text-only fallback`);
          
          // Try to identify failed image
          const failedIndex = parseFailedImageIndex(errorDesc);
          if (failedIndex !== null) {
            console.log(`🔍 Failed at image index ${failedIndex}: ${chunks[i][failedIndex]}`);
          }
          
          // Fallback to text-only message
          console.log('📝 Falling back to text-only message');
          const textResponse = await fetch(
            `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
              })
            }
          );
          
          if (!textResponse.ok) {
            const textError = await textResponse.json();
            return { success: false, error: `Image failed, text fallback also failed: ${textError.description}` };
          }
          
          const textResult = await textResponse.json();
          console.log('✅ Text-only fallback successful');
          return { success: true, messageId: textResult.result.message_id, error: 'Sent as text-only (images failed)' };
        }
        
        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = error.parameters?.retry_after || 60;
          console.warn(`⏳ Rate limited, retry after ${retryAfter}s`);
          return { success: false, error: `Rate limited, retry after ${retryAfter} seconds` };
        }
        
        return { success: false, error: errorDesc };
      }
      
      // Store first message ID
      if (i === 0) {
        const result = await response.json();
        firstMessageId = result.result?.[0]?.message_id;
      }
    }
    
    return { success: true, messageId: firstMessageId };
  } catch (error) {
    console.error('💥 Exception in sendToTelegram:', error);
    
    // Final fallback: try text-only
    try {
      console.log('📝 Exception occurred, attempting text-only fallback');
      const textResponse = await fetch(
        `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          })
        }
      );
      
      if (textResponse.ok) {
        const textResult = await textResponse.json();
        console.log('✅ Exception fallback successful');
        return { success: true, messageId: textResult.result.message_id, error: 'Sent as text-only (exception occurred)' };
      }
    } catch (fallbackError) {
      console.error('💥 Text fallback also failed:', fallbackError);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Handler for product notifications
 * Supports: active, repost, sold
 */
async function handleProductNotification(
  payload: any,
  supabase: any,
  notificationType: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const { productId, priceChanged, newPrice, oldPrice, notificationType: payloadNotificationType } = payload;
  const chatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || Deno.env.get('TELEGRAM_GROUP_CHAT_ID_PRODUCTS');
  
  if (!chatId) {
    throw new Error('TELEGRAM_GROUP_CHAT_ID not configured');
  }
  
  // Fetch product with images and seller profile
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      product_images (url),
      profiles!products_seller_id_fkey (
        opt_id,
        telegram,
        full_name
      )
    `)
    .eq('id', productId)
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found');
  }
  
  // === SPECIAL CASE: Sold notification (text-only) ===
  if (payloadNotificationType === 'sold' || notificationType === 'sold') {
    console.log('📝 [Product] Sending sold notification (text-only)');
    
    const titleParts = [product.title, product.brand, product.model].filter(Boolean);
    const fullTitle = titleParts.join(' ').trim();
    
    const textMessage = `😔 Жаль, но Лот #${product.lot_number} ${fullTitle} уже ушел!\nКто-то оказался быстрее... в следующий раз повезет - будь начеку.`;
    
    const result = await sendToTelegram(chatId, textMessage);
    
    if (result.success) {
      // Update product
      await supabase
        .from('products')
        .update({ 
          last_notification_sent_at: new Date().toISOString(),
          telegram_notification_status: 'sent'
        })
        .eq('id', productId);
      
      // Log notification
      await logTelegramNotification(supabase, {
        function_name: 'telegram-queue-handler',
        notification_type: 'product_sold',
        recipient_type: 'group',
        recipient_identifier: chatId,
        message_text: textMessage,
        status: 'sent',
        telegram_message_id: result.messageId?.toString(),
        related_entity_type: 'product',
        related_entity_id: productId
      });
    }
    
    return result;
  }
  
  // === IMAGE-BASED NOTIFICATIONS (active, repost) ===
  
  const imageUrls = product.product_images?.map(img => img.url) || [];
  console.log(`📷 [Product] Using ${imageUrls.length} images`);
  
  if (imageUrls.length === 0) {
    throw new Error('No images found for product');
  }
  
  // Load local telegram accounts for proper display
  const localTelegramAccounts = await getLocalTelegramAccounts();
  
  // Form full title with brand and model
  const titleParts = [product.title, product.brand, product.model].filter(Boolean);
  const fullTitle = titleParts.join(' ').trim();
  
  // Check if price was reduced
  const isPriceReduced = priceChanged && newPrice && oldPrice && newPrice < oldPrice;
  
  // Add SALE marker if price reduced
  const lotNumber = isPriceReduced 
    ? `#${product.lot_number}❗️SALE❗️`
    : `#${product.lot_number}`;
  
  // Form price info
  const priceInfo = priceChanged && newPrice && oldPrice
    ? `\n💰 Новая цена: ${newPrice} $ (было ${oldPrice} $)`
    : `\n💰 Цена: ${product.price} $`;
  
  // Add description if exists (limited to 200 chars)
  const descriptionLine = product.description 
    ? `\n📝 ${product.description.slice(0, 200)}${product.description.length > 200 ? '...' : ''}` 
    : '';
  
  // Caption depends on notification type
  const statusLine = (payloadNotificationType === 'sold' || notificationType === 'sold')
    ? '\n\n📊 Статус: ❌ ПРОДАН ❌'
    : (payloadNotificationType === 'repost' || notificationType === 'repost')
    ? '\n\n📊 Статус: 🔄 Репост'
    : '\n\n📊 Статус: Опубликован';
  
  const caption = `LOT(лот) ${lotNumber}\n📦 ${fullTitle}${priceInfo}\n🚚 Цена доставки: ${product.delivery_price || 0} $\n🆔 OPT_ID продавца: ${product.profiles?.opt_id || 'N/A'}\n👤 Telegram продавца: ${getTelegramForDisplay(product.profiles?.telegram || '', localTelegramAccounts)}${descriptionLine}${statusLine}`;
  
  // Check caption length (Telegram limit is 1024 chars)
  let finalCaption = caption;
  if (caption.length > 1024) {
    console.warn(`⚠️ [Product] Caption exceeds 1024 chars, truncating...`);
    finalCaption = caption.substring(0, 1020) + '...';
  }
  
  console.log(`📝 [Product] Caption length: ${finalCaption.length} chars`);
  
  // Send to Telegram
  const result = await sendToTelegram(chatId, finalCaption, imageUrls);
  
  if (result.success) {
    // Update product
    await supabase
      .from('products')
      .update({ 
        last_notification_sent_at: new Date().toISOString(),
        telegram_notification_status: 'sent'
      })
      .eq('id', productId);
  }
  
  return result;
}

/**
 * Handler for bulk notifications
 * Sends same message to multiple users (group or array of IDs)
 */
async function handleBulkNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; total: number; sent: number; failed: number; no_telegram: number; errors?: any[]; deduplicated?: number }> {
  
  const { recipients, messageText, images, batchIndex, deduplicationId } = payload;
  
  console.log(`📨 [Bulk] Processing bulk notification, recipients type: ${typeof recipients}, dedupe: ${deduplicationId || 'none'}`);
  
  // Get recipient user IDs
  let recipientIds: string[] = [];
  
  if (Array.isArray(recipients)) {
    recipientIds = recipients;
  } else if (typeof recipients === 'string') {
    // Handle predefined groups
    if (recipients === 'all_buyers') {
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'buyer');
      recipientIds = users?.map(u => u.id) || [];
    } else if (recipients === 'all_sellers') {
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'seller');
      recipientIds = users?.map(u => u.id) || [];
    }
  }
  
  console.log(`📋 [Bulk] Processing ${recipientIds.length} recipients`);
  
  // Get user profiles with telegram_id
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, telegram_id, full_name, email')
    .in('id', recipientIds);
  
  // Separate users with and without telegram_id
  const usersWithTelegram = profiles?.filter(p => p.telegram_id) || [];
  const usersWithoutTelegram = profiles?.filter(p => !p.telegram_id) || [];
  
  console.log(`✅ [Bulk] ${usersWithTelegram.length} with Telegram, ${usersWithoutTelegram.length} without`);
  
  const results = {
    total: recipientIds.length,
    sent: 0,
    failed: 0,
    no_telegram: usersWithoutTelegram.length,
    errors: [] as any[]
  };
  
  // Add admin signature to message
  const messageWithSignature = `${messageText}\n\n📩 Сообщение от администратора partsbay.ae`;
  
  // Send to each user with telegram_id
  for (const profile of usersWithTelegram) {
    const userName = profile.full_name || profile.email || 'user';
    
    try {
      const result = await sendToTelegram(
        profile.telegram_id,
        messageWithSignature,
        images || []
      );
      
      if (result.success) {
        results.sent++;
        console.log(`✅ [Bulk] Sent to ${userName}`);
      } else {
        results.failed++;
        results.errors.push({
          userId: profile.id,
          userName,
          error: result.error
        });
        console.error(`❌ [Bulk] Failed to ${userName}: ${result.error}`);
      }
      
      // Delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        userId: profile.id,
        userName,
        error: error.message
      });
      console.error(`❌ [Bulk] Exception for ${userName}:`, error);
    }
  }
  
  console.log(`📊 [Bulk] Results: ${results.sent} sent, ${results.failed} failed, ${results.no_telegram} no telegram`);
  
  return results;
}

/**
 * Handler for personal notifications
 * Sends message to specific user
 */
async function handlePersonalNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const { userId, messageText, images } = payload;
  
  console.log(`👤 [Personal] Sending to user ${userId}`);
  
  // Get user's telegram_id
  const { data: targetUser, error: userError } = await supabase
    .from('profiles')
    .select('telegram_id, full_name, email')
    .eq('id', userId)
    .single();
  
  if (userError || !targetUser) {
    throw new Error('User not found');
  }
  
  if (!targetUser.telegram_id) {
    throw new Error('User does not have Telegram ID');
  }
  
  console.log(`👤 [Personal] Sending to ${targetUser.full_name} (${targetUser.telegram_id})`);
  
  // Send message
  const result = await sendToTelegram(
    targetUser.telegram_id,
    messageText,
    images || []
  );
  
  return result;
}

/**
 * Handler for admin notifications about new products
 * Sends product details to all admins with telegram_id
 */
async function handleAdminNewProductNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string; results?: any[] }> {
  
  const { productId } = payload;
  
  console.log(`🔔 [AdminProduct] Processing notification for product ${productId}`);
  
  // Get product details with images
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      product_images(url, is_primary)
    `)
    .eq('id', productId)
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found');
  }
  
  // Get admin profiles with telegram IDs
  const { data: admins, error: adminsError } = await supabase
    .from('profiles')
    .select('id, email, telegram_id, full_name')
    .eq('user_type', 'admin')
    .not('telegram_id', 'is', null);
  
  if (adminsError) {
    throw new Error('Failed to fetch admin profiles');
  }
  
  if (!admins || admins.length === 0) {
    console.warn('⚠️ [AdminProduct] No admins with Telegram IDs found');
    return {
      success: true,
      results: [],
      error: 'No admins found'
    };
  }
  
  console.log(`👥 [AdminProduct] Found ${admins.length} admins to notify`);
  
  // Prepare message text
  const messageText = `🔥 У нас новый товар на проверке! Срочно проверьте его и опубликуйте

📦 Товар: ${product.title}
💰 Цена: ${product.price} AED
🚚 Доставка: ${product.delivery_price || 0} AED
👤 Продавец: ${product.seller_name}
🏷️ Бренд: ${product.brand}
🚗 Модель: ${product.model}
📍 Место: ${product.place_number}
📋 Описание: ${product.description || 'Не указано'}

🔗 Перейти к модерации: https://partsbay.ae/admin/product-moderation`;
  
  // Prepare images array (will be transformed by sendToTelegram)
  const images = product.product_images?.map((img: any) => img.url) || [];
  
  // Send notifications to all admins
  const results = [];
  for (const admin of admins) {
    try {
      console.log(`📤 [AdminProduct] Sending to admin: ${admin.email}`);
      
      const result = await sendToTelegram(admin.telegram_id, messageText, images);
      
      results.push({
        adminId: admin.id,
        adminEmail: admin.email,
        success: result.success,
        error: result.error
      });
      
      // Delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ [AdminProduct] Failed to send to ${admin.email}:`, error);
      results.push({
        adminId: admin.id,
        adminEmail: admin.email,
        success: false,
        error: error.message
      });
    }
  }
  
  // Update admin_notification_sent_at timestamp
  await supabase
    .from('products')
    .update({ admin_notification_sent_at: new Date().toISOString() })
    .eq('id', productId);
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [AdminProduct] Sent ${successCount}/${results.length} notifications`);
  
  return {
    success: true,
    results: results
  };
}

/**
 * Handler for admin notifications about new users
 * Sends user details to all admins with telegram_id
 */
async function handleAdminNewUserNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string; results?: any[] }> {
  
  const { userId, fullName, email, userType, phone, optId, telegram, createdAt } = payload;
  
  console.log(`🔔 [AdminUser] Processing notification for user ${userId}`);
  
  // Get admin Telegram IDs
  const { data: admins, error: adminsError } = await supabase
    .from('profiles')
    .select('id, email, telegram_id, full_name')
    .eq('user_type', 'admin')
    .not('telegram_id', 'is', null);
  
  if (adminsError) {
    throw new Error('Failed to fetch admin profiles');
  }
  
  if (!admins || admins.length === 0) {
    console.warn('⚠️ [AdminUser] No admins with Telegram IDs found');
    return {
      success: true,
      results: [],
      error: 'No admins found'
    };
  }
  
  console.log(`👥 [AdminUser] Found ${admins.length} admins to notify`);
  
  // Get seller store info if applicable
  let storeInfo: any = {};
  if (userType === 'seller') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, location, description_user')
      .eq('id', userId)
      .single();
    
    const { data: store } = await supabase
      .from('stores')
      .select('name, location, description')
      .eq('seller_id', userId)
      .limit(1)
      .maybeSingle();
    
    storeInfo = {
      storeName: store?.name || profile?.company_name,
      storeLocation: store?.location || profile?.location,
      storeDescription: store?.description || profile?.description_user
    };
  }
  
  // Format message
  const userTypeRu = userType === 'buyer' ? 'Покупатель' : 'Продавец';
  const userTypeIcon = userType === 'buyer' ? '🛒' : '🏪';
  
  let messageText = `${userTypeIcon} Новый пользователь на рассмотрении\n\n`;
  messageText += `👤 Имя: ${fullName || 'Неизвестно'}\n`;
  messageText += `📧 Email: ${email}\n`;
  messageText += `👥 Тип: ${userTypeRu}\n`;
  
  if (phone) messageText += `📱 Телефон: ${phone}\n`;
  if (optId) messageText += `🆔 OPT ID: ${optId}\n`;
  if (telegram) messageText += `📱 Telegram: @${telegram}\n`;
  
  if (userType === 'seller' && storeInfo) {
    if (storeInfo.storeName) messageText += `🏬 Магазин: ${storeInfo.storeName}\n`;
    if (storeInfo.storeLocation) messageText += `📍 Локация: ${storeInfo.storeLocation}\n`;
    if (storeInfo.storeDescription) messageText += `📝 Описание: ${storeInfo.storeDescription}\n`;
  }
  
  messageText += `📅 Дата регистрации: ${new Date(createdAt || Date.now()).toLocaleString('ru-RU')}\n\n`;
  messageText += `🔗 Проверить пользователя: https://partsbay.ae/admin/users\n`;
  messageText += `ID: ${userId}`;
  
  // Send notifications to all admins
  const results = [];
  for (const admin of admins) {
    try {
      console.log(`📤 [AdminUser] Sending to admin: ${admin.email}`);
      
      const result = await sendToTelegram(admin.telegram_id, messageText);
      
      results.push({
        adminId: admin.id,
        adminEmail: admin.email,
        success: result.success,
        error: result.error
      });
      
    } catch (error) {
      console.error(`❌ [AdminUser] Failed to send to ${admin.email}:`, error);
      results.push({
        adminId: admin.id,
        adminEmail: admin.email,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [AdminUser] Sent ${successCount}/${results.length} notifications`);
  
  return {
    success: true,
    results: results
  };
}

/**
 * Handler for user welcome notifications
 * Sends welcome message to new users with deduplication
 */
async function handleUserWelcomeNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string; skipped?: boolean; reason?: string }> {
  
  const { userId, force } = payload;
  
  console.log(`👋 [Welcome] Processing welcome for user ${userId}, force: ${force}`);
  
  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_type, full_name, telegram_id')
    .eq('id', userId)
    .single();
  
  if (profileError || !profile) {
    throw new Error('Profile not found');
  }
  
  if (!profile.telegram_id) {
    console.log('⚠️ [Welcome] No telegram_id for user, skipping');
    return { success: true, skipped: true, reason: 'no_telegram_id' };
  }
  
  // Check deduplication (unless force=true)
  if (!force) {
    const { data: existingSent } = await supabase
      .from('telegram_notifications_log')
      .select('id')
      .eq('notification_type', 'welcome_registration')
      .eq('related_entity_type', 'user')
      .eq('related_entity_id', profile.id)
      .eq('status', 'sent')
      .not('telegram_message_id', 'is', null)
      .limit(1)
      .maybeSingle();
    
    if (existingSent) {
      console.log('✅ [Welcome] Already sent, skipping');
      return { success: true, skipped: true, reason: 'already_sent' };
    }
  }
  
  // Determine language based on user_type
  const isSeller = profile.user_type === 'seller';
  
  const messageText = isSeller
    ? 'Thank you for registering on partsbay.ae! We\'ll review your account shortly and you\'ll get access to the platform. Our administrator may contact you via Telegram if any details need clarification.'
    : 'Спасибо за регистрацию на partsbay.ae! Скоро мы проверим ваш аккаунт и вы получите доступ к платформе. Возможно, наш администратор свяжется с вами в Telegram, если потребуется уточнить информацию.';
  
  // Send to Telegram
  const result = await sendToTelegram(profile.telegram_id, messageText);
  
  return result;
}

/**
 * Handler for user verification status notifications
 * Sends verification status updates to users
 */
async function handleVerificationNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string; skipped?: boolean; reason?: string }> {
  
  let { userId, status, userType, fullName, telegramId } = payload;
  
  console.log(`✅ [Verification] Processing for user ${userId}, status: ${status}`);
  
  // Fetch missing profile fields if needed
  if (!status || !userType || !telegramId) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, verification_status, user_type, full_name, telegram_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      throw new Error('Profile not found');
    }
    
    status = status || profile.verification_status;
    userType = userType || profile.user_type;
    fullName = fullName || profile.full_name;
    telegramId = telegramId || profile.telegram_id;
  }
  
  if (!telegramId) {
    console.log('⚠️ [Verification] No telegram_id, skipping');
    return { success: true, skipped: true, reason: 'no_telegram_id' };
  }
  
  // Check deduplication - don't send same status twice
  const { data: lastSent } = await supabase
    .from('telegram_notifications_log')
    .select('id, metadata')
    .eq('notification_type', 'verification_status')
    .eq('status', 'sent')
    .eq('related_entity_type', 'user')
    .eq('related_entity_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (lastSent) {
    const lastStatus = lastSent.metadata?.status;
    if (lastStatus === status) {
      console.log('✅ [Verification] Already sent for this status, skipping');
      return { success: true, skipped: true, reason: 'already_sent_for_status' };
    }
  }
  
  // Build message with site link for verified
  const siteUrl = 'https://partsbay.ae';
  const isSeller = userType === 'seller';
  let messageText: string;
  
  if (status === 'verified') {
    messageText = isSeller
      ? `Your account has been approved. You can now access the platform: ${siteUrl}`
      : `Ваш аккаунт одобрен. Теперь вы можете войти на сайт: ${siteUrl}`;
  } else if (status === 'pending') {
    messageText = isSeller
      ? 'Your account is under review. We will notify you once it is approved.'
      : 'Ваш аккаунт на модерации. Мы уведомим вас после проверки.';
  } else if (status === 'blocked') {
    messageText = isSeller
      ? 'Your account has been blocked. If you think this is a mistake, please contact support.'
      : 'Ваш аккаунт заблокирован. Если это ошибка — свяжитесь с поддержкой.';
  } else {
    messageText = isSeller
      ? `Your verification status has changed to: ${status}`
      : `Ваш статус верификации изменен на: ${status}`;
  }
  
  // Send to Telegram
  const result = await sendToTelegram(telegramId, messageText);
  
  return result;
}

/**
 * Handler for seller notifications (product sold)
 * Sends personal message to seller when their product is sold
 */
async function handleSellerNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const { 
    orderId, 
    sellerId, 
    orderNumber, 
    buyerOptId, 
    productId,
    title,
    price,
    brand,
    model,
    images
  } = payload;
  
  console.log(`💰 [Seller] Processing product sold notification for seller ${sellerId}`);
  
  // Get seller's telegram_id and user_type for language
  const { data: seller, error: sellerError } = await supabase
    .from('profiles')
    .select('telegram_id, full_name, user_type')
    .eq('id', sellerId)
    .single();
  
  if (sellerError || !seller) {
    throw new Error('Seller not found');
  }
  
  if (!seller.telegram_id) {
    console.log('⚠️ [Seller] Seller has no Telegram ID, skipping');
    return { success: true, error: 'No Telegram ID' };
  }
  
  // Determine language based on user_type
  const isEnglish = seller.user_type === 'seller';
  const locale = isEnglish ? 'en-US' : 'ru-RU';
  const saleDate = new Date().toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Create localized message
  const telegramMessage = isEnglish ? `
🎉 <b>Your product sold!</b>

🏷️ <b>Product:</b> ${title}${brand ? ` (${brand}` : ''}${model ? ` ${model})` : brand ? ')' : ''}

💰 <b>Sale Price:</b> $${price}
📋 <b>Order #:</b> ${orderNumber}
👤 <b>Buyer ID:</b> ${buyerOptId}

📅 <b>Sale Date:</b> ${saleDate}

🔗 <b>Order Link:</b> https://partsbay.ae/order/${orderId}

Congratulations on your sale! You can view order details in your dashboard.
  `.trim() : `
🎉 <b>Ваш товар продан!</b>

🏷️ <b>Товар:</b> ${title}${brand ? ` (${brand}` : ''}${model ? ` ${model})` : brand ? ')' : ''}

💰 <b>Цена продажи:</b> ${price?.toLocaleString('ru-RU')}₽
📋 <b>Заказ №:</b> ${orderNumber}
👤 <b>ID покупателя:</b> ${buyerOptId}

📅 <b>Дата продажи:</b> ${saleDate}

🔗 <b>Ссылка на заказ:</b> https://partsbay.ae/order/${orderId}

Поздравляем с продажей! Детали заказа можно посмотреть в личном кабинете.
  `.trim();
  
  // Get first image if available (will be transformed by sendToTelegram)
  const orderImages = images && images.length > 0 ? [images[0]] : [];
  
  // Send to Telegram
  const result = await sendToTelegram(seller.telegram_id, telegramMessage, orderImages);
  
  return result;
}

/**
 * Handler for price offer notifications
 * Sends personal message to seller about new/updated price offers
 */
async function handlePriceOfferNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const { 
    offerId, 
    productId, 
    sellerId, 
    buyerId, 
    offeredPrice, 
    originalPrice, 
    message, 
    expiresAt,
    notificationType = 'new_offer',
    oldPrice 
  } = payload;
  
  console.log(`💵 [PriceOffer] Processing ${notificationType} for seller ${sellerId}`);
  
  // Get seller's telegram_id and user_type
  const { data: seller, error: sellerError } = await supabase
    .from('profiles')
    .select('telegram_id, full_name, user_type')
    .eq('id', sellerId)
    .single();
  
  if (sellerError || !seller) {
    throw new Error('Seller not found');
  }
  
  if (!seller.telegram_id) {
    console.log('⚠️ [PriceOffer] Seller has no Telegram ID, skipping');
    return { success: true, error: 'No Telegram ID' };
  }
  
  // Get buyer's info
  const { data: buyer } = await supabase
    .from('profiles')
    .select('full_name, opt_id')
    .eq('id', buyerId)
    .single();
  
  if (!buyer) {
    throw new Error('Buyer not found');
  }
  
  // Get product info with images
  const { data: product } = await supabase
    .from('products')
    .select(`
      title, brand, model, cloudinary_url,
      product_images(url, is_primary)
    `)
    .eq('id', productId)
    .single();
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  // Determine language
  const isEnglish = seller.user_type === 'seller';
  const locale = isEnglish ? 'en-US' : 'ru-RU';
  const expirationDate = new Date(expiresAt).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Create localized message based on type
  let telegramMessage;
  
  if (notificationType === 'price_update') {
    telegramMessage = isEnglish ? `
📝 <b>Price Offer Updated!</b>

🏷️ <b>Product:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Original Price:</b> $${originalPrice}
📉 <b>Previous Offer:</b> $${oldPrice}
🎯 <b>New Offer:</b> $${offeredPrice}

👤 <b>From Buyer:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Message:</b> ${message}\n` : ''}⏰ <b>Valid Until:</b> ${expirationDate}

🔗 <b>Link:</b> https://partsbay.ae/product/${productId}

Buyer updated their offer. You can respond in your account dashboard.
    `.trim() : `
📝 <b>Предложение цены обновлено!</b>

🏷️ <b>Товар:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Первоначальная цена:</b> ${originalPrice.toLocaleString('ru-RU')}₽
📉 <b>Предыдущее предложение:</b> ${oldPrice.toLocaleString('ru-RU')}₽
🎯 <b>Новое предложение:</b> ${offeredPrice.toLocaleString('ru-RU')}₽

👤 <b>От покупателя:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Сообщение:</b> ${message}\n` : ''}⏰ <b>Действительно до:</b> ${expirationDate}

🔗 <b>Ссылка:</b> https://partsbay.ae/product/${productId}

Покупатель изменил своё предложение. Ответить можно в личном кабинете на сайте.
    `.trim();
  } else {
    telegramMessage = isEnglish ? `
📦 <b>New Price Offer!</b>

🏷️ <b>Product:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Original Price:</b> $${originalPrice}
🎯 <b>Offered Price:</b> $${offeredPrice}

👤 <b>From Buyer:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Message:</b> ${message}\n` : ''}⏰ <b>Valid Until:</b> ${expirationDate}

🔗 <b>Link:</b> https://partsbay.ae/product/${productId}

You can respond to this offer in your account dashboard.
    `.trim() : `
📦 <b>Новое предложение цены!</b>

🏷️ <b>Товар:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Первоначальная цена:</b> ${originalPrice.toLocaleString('ru-RU')}₽
🎯 <b>Предложенная цена:</b> ${offeredPrice.toLocaleString('ru-RU')}₽

👤 <b>От покупателя:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Сообщение:</b> ${message}\n` : ''}⏰ <b>Действительно до:</b> ${expirationDate}

🔗 <b>Ссылка:</b> https://partsbay.ae/product/${productId}

Ответить на предложение можно в личном кабинете на сайте.
    `.trim();
  }
  
  // Get product image (will be transformed by sendToTelegram)
  const primaryImage = product.product_images?.find(img => img.is_primary);
  const productImage = primaryImage?.url || product.product_images?.[0]?.url || product.cloudinary_url;
  const productImages = productImage ? [productImage] : [];
  
  // Send to Telegram
  const result = await sendToTelegram(seller.telegram_id, telegramMessage, productImages);
  
  return result;
}

/**
 * Handler for order notifications
 * Supports: regular, registered
 */
async function handleOrderNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const { orderData, notificationType } = payload;
  
  // Determine target group
  const targetGroupId = notificationType === 'registered' 
    ? Deno.env.get('TELEGRAM_GROUP_CHAT_ID_REGISTERED')
    : Deno.env.get('TELEGRAM_GROUP_CHAT_ID_ORDERS');
  
  if (!targetGroupId) {
    throw new Error('TELEGRAM_GROUP_CHAT_ID not configured for orders');
  }
  
  console.log(`📦 [Order] Processing order #${orderData.order_number}, type: ${notificationType}`);
  
  // Helper: get status text in Russian
  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Создан';
      case 'seller_confirmed': return 'Подтвержден продавцом';
      case 'admin_confirmed': return 'Подтвержден администратором';
      case 'processed': return 'Зарегистрирован';
      case 'shipped': return 'Отправлен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };
  
  const statusText = getStatusText(orderData.status);
  
  // Format delivery method
  const deliveryMethodText = orderData.delivery_method === 'cargo_rf' ? 'Доставка Cargo РФ' : 
                            orderData.delivery_method === 'self_pickup' ? 'Самовывоз' : 
                            orderData.delivery_method === 'cargo_kz' ? 'Доставка Cargo KZ' : 
                            orderData.delivery_method;
  
  // Get display telegram using shared config logic
  let displayTelegram = '';
  try {
    const localAccounts = await getLocalTelegramAccounts();
    
    // Fetch seller telegram from profiles
    let sellerTelegram = '';
    if (orderData.seller_id) {
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('telegram')
        .eq('id', orderData.seller_id)
        .single();
      
      sellerTelegram = sellerProfile?.telegram || '';
    }
    
    // Use fallback if no seller telegram found
    const telegramToCheck = sellerTelegram || orderData.telegram_url_order || '';
    
    // Determine display telegram
    displayTelegram = getTelegramForDisplay(telegramToCheck, localAccounts);
    
  } catch (e) {
    console.warn('⚠️ [Order] Error with telegram config, using fallback:', e);
    displayTelegram = 'Для заказа пересылайте лот @Nastya_PostingLots_OptCargo';
  }
  
  // Format order number with leading zero
  const formattedOrderNumber = orderData.order_number.toString().padStart(5, '0');
  
  // Compose name: title + brand + model
  const nameParts = [orderData.title, orderData.brand, orderData.model]
    .filter((v: string | null | undefined) => !!v && String(v).trim());
  const composedName = nameParts.join(' ').trim();
  
  // Compose message text
  const messageText = [
    `Номер заказа: ${formattedOrderNumber}`,
    `Статус: ${statusText}`,
    displayTelegram,
    ``,
    `🟰🟰🟰🟰🟰🟰`,
    `Наименование: ${composedName}`,
    ``,
    `Количество мест для отправки: ${orderData.place_number || 1}`,
    `Доставка: ${deliveryMethodText}`,
    ``,
    `Дополнительная информация: ${orderData.text_order || 'Не указана'}`,
    ``,
    `🟰🟰🟰🟰🟰🟰`,
    `Цена: ${orderData.price} $`,
    `Цена доставки: ${orderData.delivery_price_confirm || 0} $`,
    ``,
    `===`,
    `${orderData.seller_opt_id || ''}`,
    `${orderData.buyer_opt_id || ''}`
  ].join('\n');
  
  // Get order images
  let orderImages: string[] = [];
  
  if (orderData.images && orderData.images.length > 0) {
    console.log(`📷 [Order] Using ${orderData.images.length} images from payload`);
    orderImages = orderData.images;
  } else {
    console.log('📷 [Order] Fetching images from database');
    const { data: imagesData } = await supabase
      .from('order_images')
      .select('url')
      .eq('order_id', orderData.id);
    
    if (imagesData && imagesData.length > 0) {
      console.log(`📷 [Order] Found ${imagesData.length} images in database`);
      orderImages = imagesData.map((img: any) => img.url);
    }
  }
  
  // Send to Telegram (images will be transformed via makeCloudinaryTelegramFriendly)
  const result = await sendToTelegram(targetGroupId, messageText, orderImages);
  
  return result;
}

/**
 * Main handler - routes notifications by type
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Read body as text for signature verification
    const bodyText = await req.text();
    const signature = req.headers.get('Upstash-Signature');
    const timestamp = req.headers.get('Upstash-Timestamp');
    
    // Create supabase client
    const supabase = createServiceClient();
    
    // ⚠️ TEMPORARY: QStash signature verification disabled for testing
    // TODO: Enable after configuring URL endpoint in Upstash Console
    /*
    const { verifyQStashSignature } = await import('../_shared/qstash-verify.ts');
    const isValid = await verifyQStashSignature(
      bodyText,
      signature,
      timestamp,
      supabase
    );
    
    if (!isValid) {
      console.error('❌ Invalid QStash signature');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }
    */
    
    // Parse body after verification
    const data = JSON.parse(bodyText);
    
    // 🔍 DEBUG: Log raw body
    console.log(`🔍 [DEBUG] Raw body:`, bodyText.substring(0, 300));
    console.log(`🔍 [DEBUG] Parsed data keys:`, Object.keys(data));
    
    // Универсальная обработка: поддержка обоих форматов
    // Формат 1 (вложенный): {notificationType, payload: {...}}
    // Формат 2 (плоский): {notificationType, productId, ...}
    const payload = data.payload || data;
    const notificationType = data.notificationType || payload.notificationType || 'unknown';
    
    console.log(`📨 [telegram-queue-handler] Processing: ${notificationType}`);
    console.log(`   Payload format:`, data.payload ? 'nested' : 'flat');
    console.log(`   Payload keys:`, Object.keys(payload));
    console.log(`   Payload preview:`, JSON.stringify(payload).substring(0, 200));
    
    let result: any;
    
    // Route to appropriate handler
    switch (notificationType) {
      case 'product':
        result = await handleProductNotification(payload, supabase, notificationType);
        break;
        
      case 'repost':
        result = await handleProductNotification(payload, supabase, notificationType);
        break;
        
      case 'order':
        result = await handleOrderNotification(payload, supabase);
        break;
        
      case 'seller_sold':
        result = await handleSellerNotification(payload, supabase);
        break;
        
      case 'price_offer':
        result = await handlePriceOfferNotification(payload, supabase);
        break;
        
      case 'user_welcome':
        result = await handleUserWelcomeNotification(payload, supabase);
        break;
        
      case 'verification':
        result = await handleVerificationNotification(payload, supabase);
        break;
        
      case 'admin_new_product':
        result = await handleAdminNewProductNotification(payload, supabase);
        break;
        
      case 'admin_new_user':
        result = await handleAdminNewUserNotification(payload, supabase);
        break;
        
      case 'bulk':
        result = await handleBulkNotification(payload, supabase);
        break;
        
      case 'personal':
        result = await handlePersonalNotification(payload, supabase);
        break;
        
      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }
    
    // Log to database
    // Determine recipient_type based on notification type
    const recipientType = ['personal', 'seller_sold'].includes(notificationType) 
      ? 'personal' 
      : 'group';
    
    // Determine recipient_identifier based on type
    let recipientIdentifier = 'unknown';
    if (recipientType === 'personal') {
      recipientIdentifier = payload.sellerId || payload.telegram_id || 'personal_chat';
    } else {
      recipientIdentifier = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || 'group_chat';
    }
    
    await logTelegramNotification(supabase, {
      function_name: 'telegram-queue-handler',
      notification_type: notificationType,
      recipient_type: recipientType,
      recipient_identifier: recipientIdentifier,
      message_text: 'Queued notification',
      status: result.success ? 'sent' : 'failed',
      telegram_message_id: result.messageId?.toString(),
      error_details: result.error ? { error: result.error } : null,
      metadata: { payload, result }
    });
    
    console.log(`${result.success ? '✅' : '❌'} [telegram-queue-handler] Result:`, result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500
      }
    );
  } catch (error) {
    console.error('💥 [telegram-queue-handler] Fatal error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
