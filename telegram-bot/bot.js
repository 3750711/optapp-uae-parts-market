const { Telegraf } = require('telegraf');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Environment variables
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => Number(s));

const SUPABASE_EDGE_URL = `${process.env.SUPABASE_URL}/functions/v1/attach-order-media`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bot = new Telegraf(TOKEN);

// Store user context: user_id -> order_id
const userContextMap = new Map();

// Helper function to check if user is admin
function isAdmin(userId) {
  return ADMIN_TG_IDS.includes(Number(userId));
}

// Start command handler
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  
  if (!isAdmin(userId)) {
    return ctx.reply('⛔ Доступ только для администраторов.');
  }

  const startPayload = ctx.startPayload || '';
  console.log('Start payload:', startPayload);
  
  if (startPayload.startsWith('order_')) {
    const orderId = startPayload.substring('order_'.length);
    userContextMap.set(userId, orderId);
    
    return ctx.reply(
      `📦 Заказ #${orderId} выбран.\n\n` +
      `📷 Отправьте фото (можно до 25 в альбоме).\n\n` +
      `❌ Видео и документы не принимаются.`
    );
  }
  
  return ctx.reply(
    '👋 Добро пожаловать!\n\n' +
    'Откройте бота через кнопку «📷 Загрузить из Telegram» в карточке заказа в админке.'
  );
});

// Handle all media types
bot.on(['photo', 'document', 'video', 'voice', 'video_note', 'sticker'], async (ctx) => {
  const userId = ctx.from.id;
  
  if (!isAdmin(userId)) {
    return ctx.reply('⛔ Только администраторы могут загружать медиа.');
  }

  const orderId = userContextMap.get(userId);
  if (!orderId) {
    return ctx.reply(
      '❌ Сначала нажмите кнопку в админке заказа, чтобы выбрать заказ.\n\n' +
      'Откройте заказ в админке и нажмите «📷 Загрузить из Telegram».'
    );
  }

  // Only allow photos
  if (!ctx.message.photo) {
    return ctx.reply(
      '❌ Принимаются только фото.\n\n' +
      '📷 Пожалуйста, отправьте изображение (не видео, не документ).'
    );
  }

  try {
    // Show loading message
    const loadingMessage = await ctx.reply('⏳ Загружаю фото...');

    // Get the largest photo size
    const photoSizes = ctx.message.photo;
    const photo = photoSizes[photoSizes.length - 1];
    const fileId = photo.file_id;

    console.log(`Processing photo for order ${orderId}, file_id: ${fileId}`);

    // Get file download link from Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);
    console.log('File link obtained:', fileLink.href);

    // Download file as buffer
    const { data: buffer } = await axios.get(fileLink.href, { 
      responseType: 'arraybuffer' 
    });

    console.log('File downloaded, size:', buffer.byteLength);

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'orders',
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1200, height: 1200, crop: 'limit' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(Buffer.from(buffer));
    });

    const cloudinaryUrl = uploadResult.secure_url;

    // Save to Supabase via Edge Function
    console.log('Saving to Supabase via Edge Function...');
    const response = await axios.post(
      SUPABASE_EDGE_URL,
      {
        order_id: orderId,
        file_url: cloudinaryUrl,
        file_type: 'photo',
        uploaded_by: userId
      },
      {
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Delete loading message
    await ctx.deleteMessage(loadingMessage.message_id).catch(() => {});

    if (response.status >= 200 && response.status < 300) {
      await ctx.reply(
        `✅ Фото успешно добавлено к заказу #${orderId}!\n\n` +
        `🔄 Обновите страницу в админке, чтобы увидеть новое фото.`
      );
      console.log('Photo successfully processed for order:', orderId);
    } else {
      console.error('Supabase Edge Function error:', response.status, response.data);
      await ctx.reply(
        '❌ Ошибка при сохранении в базе данных.\n\n' +
        'Попробуйте ещё раз или обратитесь к разработчику.'
      );
    }

  } catch (error) {
    console.error('Error processing photo:', error);
    
    // Try to delete loading message if it exists
    try {
      if (ctx.message.message_id) {
        await ctx.deleteMessage(ctx.message.message_id - 1).catch(() => {});
      }
    } catch (e) {
      // Ignore deletion errors
    }

    await ctx.reply(
      '❌ Произошла ошибка при обработке фото.\n\n' +
      '🔄 Попробуйте ещё раз через несколько секунд.\n\n' +
      'Если проблема повторяется, обратитесь к администратору.'
    );
  }
});

// Handle text messages
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!isAdmin(userId)) {
    return ctx.reply('⛔ Доступ только для администраторов.');
  }

  const orderId = userContextMap.get(userId);
  if (!orderId) {
    return ctx.reply(
      '❓ Заказ не выбран.\n\n' +
      'Откройте заказ в админке и нажмите «📷 Загрузить из Telegram».'
    );
  }

  return ctx.reply(
    `📦 Текущий заказ: #${orderId}\n\n` +
    `📷 Отправьте фото для загрузки.\n\n` +
    `❌ Текстовые сообщения не обрабатываются.`
  );
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  
  if (ctx && ctx.reply) {
    ctx.reply(
      '❌ Произошла внутренняя ошибка.\n\n' +
      'Попробуйте ещё раз или обратитесь к администратору.'
    ).catch(() => {});
  }
});

// Start the bot
bot.launch().then(() => {
  console.log('🤖 Order Media Telegram Bot started successfully!');
  console.log('📋 Admin IDs:', ADMIN_TG_IDS);
  console.log('🔗 Supabase Edge Function URL:', SUPABASE_EDGE_URL);
}).catch((error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));