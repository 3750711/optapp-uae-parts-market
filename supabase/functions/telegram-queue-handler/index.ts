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
 * Adds fl_attachment,f_jpg/ to force file download instead of webpage preview
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
  
  // Check if already has fl_attachment
  if (afterUpload.startsWith('fl_attachment')) {
    console.log(`✅ [Cloudinary] URL already has fl_attachment`);
    return url;
  }
  
  // Add fl_attachment to force file download and f_jpg for format
  const transforms = 'fl_attachment,f_jpg/';
  const newUrl = `${beforeUpload}${transforms}${afterUpload}`;
  
  console.log(`🔄 [Cloudinary] Transformed for Telegram:`);
  console.log(`   Original: ${url.substring(0, 80)}...`);
  console.log(`   Modified: ${newUrl.substring(0, 80)}...`);
  
  return newUrl;
}

/**
 * Simple Telegram send function WITHOUT retry logic
 * Retry is handled by QStash, not here
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
  const telegramImages = images.map(makeCloudinaryTelegramFriendly);
  
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
        return { success: false, error: error.description };
      }
      
      // Store first message ID
      if (i === 0) {
        const result = await response.json();
        firstMessageId = result.result?.[0]?.message_id;
      }
    }
    
    return { success: true, messageId: firstMessageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handler for product notifications
 * Supports: active, repost, sold
 */
async function handleProductNotification(
  payload: any,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const { productId, notificationType, priceChanged, newPrice, oldPrice } = payload;
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
  if (notificationType === 'sold') {
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
  const statusLine = notificationType === 'product_published' 
    ? '\n\n📊 Статус: Опубликован'
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
    // Verify QStash signature
    const signature = req.headers.get('Upstash-Signature');
    if (!signature) {
      console.error('❌ Missing QStash signature');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }
    
    const data = await req.json();
    const { notificationType, payload } = data;
    
    console.log(`📨 [telegram-queue-handler] Processing: ${notificationType}`);
    console.log(`   Payload:`, JSON.stringify(payload).substring(0, 200));
    
    const supabase = createServiceClient();
    let result: any;
    
    // Route to appropriate handler
    switch (notificationType) {
      case 'product':
        result = await handleProductNotification(payload, supabase);
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
        // TODO: Implement in Step 5
        result = { success: false, error: 'User welcome handler not implemented yet' };
        break;
        
      case 'verification':
        // TODO: Implement in Step 5
        result = { success: false, error: 'Verification handler not implemented yet' };
        break;
        
      case 'admin_new_product':
        // TODO: Implement in Step 6
        result = { success: false, error: 'Admin product handler not implemented yet' };
        break;
        
      case 'admin_new_user':
        // TODO: Implement in Step 6
        result = { success: false, error: 'Admin user handler not implemented yet' };
        break;
        
      case 'bulk':
        // TODO: Implement in Step 7
        result = { success: false, error: 'Bulk handler not implemented yet' };
        break;
        
      case 'personal':
        // TODO: Implement in Step 7
        result = { success: false, error: 'Personal message handler not implemented yet' };
        break;
        
      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }
    
    // Log to database
    await logTelegramNotification(supabase, {
      function_name: 'telegram-queue-handler',
      notification_type: notificationType,
      recipient_type: 'queue',
      recipient_identifier: 'qstash',
      message_text: 'Queued notification',
      status: result.success ? 'sent' : 'failed',
      telegram_message_id: result.messageId,
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
