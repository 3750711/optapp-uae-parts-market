import { TelegramApiClient } from './TelegramApiClient.ts';
import { NotificationLogger } from './NotificationLogger.ts';
import { getLocalTelegramAccounts, getTelegramForDisplay } from '../shared/telegram-config.ts';

export class ProductNotificationHandler {
  constructor(
    private telegramClient: TelegramApiClient,
    private logger: NotificationLogger,
    private supabaseClient: any,
    private productGroupChatId: string
  ) {}

  async handle(payload: any): Promise<void> {
    const { productId, notificationType } = payload;

    console.log(`📦 [ProductNotification] Handling ${notificationType} for product ${productId}`);

    // Fetch product data
    const { data: product, error: productError } = await this.supabaseClient
      .from('products')
      .select(`
        *,
        product_images(url, is_primary),
        product_videos(url)
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Check 72-hour cooldown for repost
    if (notificationType === 'repost') {
      const lastSent = product.last_notification_sent_at;
      if (lastSent) {
        const hoursSinceLastSent = (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSent < 72) {
          console.log(`⏰ [ProductNotification] Repost cooldown active: ${Math.round(72 - hoursSinceLastSent)}h remaining`);
          
          // Update status immediately
          await this.supabaseClient
            .from('products')
            .update({
              tg_notify_status: 'cooldown',
              tg_notify_attempts: product.tg_notify_attempts + 1
            })
            .eq('id', productId);
          
          throw new Error(`Repost cooldown active: ${Math.round(72 - hoursSinceLastSent)} hours remaining`);
        }
      }
    }

    // Update status to processing immediately
    await this.supabaseClient
      .from('products')
      .update({ tg_notify_status: 'processing' })
      .eq('id', productId);

    try {
      // Prepare message
      const localAccounts = await getLocalTelegramAccounts();
      const telegramToDisplay = getTelegramForDisplay(product.telegram_url || '', localAccounts);
      
      const message = this.buildMessage(product, telegramToDisplay, notificationType);
      const images = product.product_images
        ?.sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
        .map((img: any) => img.url) || [];

      // Send notification
      if (images.length > 0) {
        if (images.length <= 10) {
          await this.telegramClient.sendMediaGroup(this.productGroupChatId, images, message);
        } else {
          await this.telegramClient.sendMultipleMediaGroups(this.productGroupChatId, images, message);
        }
      } else {
        await this.telegramClient.sendMessage({
          chatId: this.productGroupChatId,
          text: message
        });
      }

      // Update product: success
      await this.supabaseClient
        .from('products')
        .update({
          last_notification_sent_at: new Date().toISOString(),
          tg_notify_status: 'sent',
          tg_notify_attempts: 0
        })
        .eq('id', productId);

      // Log success
      await this.logger.log({
        function_name: 'send-telegram-notification',
        notification_type: notificationType,
        recipient_type: 'group',
        recipient_identifier: this.productGroupChatId,
        message_text: message,
        status: 'sent',
        related_entity_type: 'product',
        related_entity_id: productId
      });

      console.log(`✅ [ProductNotification] Sent ${notificationType} for product ${productId}`);
    } catch (error) {
      // Update product: failed
      await this.supabaseClient
        .from('products')
        .update({
          tg_notify_status: 'failed',
          tg_notify_attempts: product.tg_notify_attempts + 1
        })
        .eq('id', productId);

      throw error;
    }
  }

  private buildMessage(product: any, telegram: string, type: string): string {
    const emoji = type === 'sold' ? '✅ ПРОДАНО' : type === 'repost' ? '🔄 РЕПОСТ' : '📦 НОВЫЙ ТОВАР';
    const price = product.price ? `💰 Цена: ${product.price} AED` : '';
    const productUrl = `https://partsbay.ae/product/${product.id}`;

    return `${emoji}

🚗 ${product.title}
${product.brand ? `Бренд: ${product.brand}` : ''}
${product.model ? `Модель: ${product.model}` : ''}
${price}

📍 ${product.location || 'Dubai'}
📞 Контакт: ${telegram}

🔗 ${productUrl}`;
  }
}
