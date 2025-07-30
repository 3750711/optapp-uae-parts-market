import { BOT_TOKEN, ADMIN_EMAILS } from './config.ts';

export async function sendAdminNotifications(productId: string, supabaseClient: any, adminUser: any) {
  console.log(`📢 [AdminNotification] Processing notification for product: ${productId}`);

  // Get product details with images
  const { data: product, error: productError } = await supabaseClient
    .from('products')
    .select(`
      *,
      product_images(url, is_primary)
    `)
    .eq('id', productId)
    .single();

  if (productError || !product) {
    console.error('❌ [AdminNotification] Failed to fetch product:', productError);
    throw new Error('Product not found');
  }

  // Get admin profiles with telegram IDs
  const { data: admins, error: adminsError } = await supabaseClient
    .from('profiles')
    .select('email, telegram_id, full_name')
    .eq('user_type', 'admin')
    .in('email', ADMIN_EMAILS)
    .not('telegram_id', 'is', null);

  if (adminsError) {
    console.error('❌ [AdminNotification] Failed to fetch admins:', adminsError);
    throw new Error('Failed to fetch admin profiles');
  }

  if (!admins || admins.length === 0) {
    console.warn('⚠️ [AdminNotification] No admins with Telegram IDs found');
    return {
      success: true,
      message: 'No admins with Telegram IDs found',
      results: []
    };
  }

  console.log(`👥 [AdminNotification] Found ${admins.length} admins to notify`);

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

  // Prepare images array
  const images = product.product_images?.map((img: any) => img.url) || [];

  // Send notifications to all admins
  const results = [];
  for (const admin of admins) {
    try {
      console.log(`📤 [AdminNotification] Sending to admin: ${admin.email} (${admin.full_name})`);
      
      const result = await sendTelegramMessage(admin.telegram_id, messageText, images);
      results.push({
        admin: admin.email,
        success: result.success,
        error: result.error
      });
      
      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ [AdminNotification] Failed to send to ${admin.email}:`, error);
      results.push({
        admin: admin.email,
        success: false,
        error: error.message
      });
    }
  }

  // Update admin_notification_sent_at timestamp
  const { error: updateError } = await supabaseClient
    .from('products')
    .update({ admin_notification_sent_at: new Date().toISOString() })
    .eq('id', productId);

  if (updateError) {
    console.error('❌ [AdminNotification] Failed to update notification timestamp:', updateError);
  }

  // Log the action
  await supabaseClient
    .from('event_logs')
    .insert({
      action_type: 'admin_notification',
      entity_type: 'product',
      entity_id: productId,
      user_id: adminUser.id,
      details: {
        type: 'new_product_pending',
        product_title: product.title,
        notified_admins: results.length,
        results: results
      }
    });

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [AdminNotification] Sent ${successCount}/${results.length} notifications successfully`);

  return {
    success: true,
    message: `Sent ${successCount}/${results.length} notifications`,
    results: results
  };
}

async function sendTelegramMessage(telegramId: number, messageText: string, images: string[] = []) {
  if (!BOT_TOKEN) {
    throw new Error('Telegram bot token not configured');
  }

  const telegramAPI = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    if (images.length === 0) {
      // Send text-only message
      const response = await fetch(`${telegramAPI}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: messageText,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      return { success: true, result };
    } else {
      // Send as media group with text
      const media = images.slice(0, 10).map((url, index) => ({
        type: 'photo',
        media: url,
        caption: index === 0 ? messageText : undefined,
        parse_mode: index === 0 ? 'HTML' : undefined
      }));

      const response = await fetch(`${telegramAPI}/sendMediaGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          media: media
        })
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      return { success: true, result };
    }
  } catch (error) {
    console.error(`❌ [Telegram] Error sending message to ${telegramId}:`, error);
    return { success: false, error: error.message };
  }
}