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
    // Format brand and model
    const formatBrandModel = (brand: string | null, model: string | null): string => {
      const brandText = brand || '';
      const modelText = model || '';
      
      if (brandText && modelText) {
        return ` ${brandText} ${modelText}`;
      } else if (brandText) {
        return ` ${brandText}`;
      } else if (modelText) {
        return ` ${modelText}`;
      }
      return '';
    };

    const brandModelText = formatBrandModel(product.brand, product.model);

    if (type === 'sold') {
      // Специальное сообщение для проданных товаров
      return `😔 Жаль, но Лот #${product.lot_number} ${product.title}${brandModelText} уже ушел!\nКто-то оказался быстрее... в следующий раз повезет - будь начеку.`;
    }

    if (type === 'repost') {
      // Сообщение для репоста
      const priceText = `${product.price} $`;
      
      return [
        `LOT(лот) #${product.lot_number}`,
        `📦 ${product.title}${brandModelText}`,
        `💰 Цена: ${priceText}`,
        `🚚 Цена доставки: ${product.delivery_price || 0} $`,
        `🆔 OPT_ID продавца: ${product.optid_created || ''}`,
        `👤 Telegram продавца: ${telegram}`,
        '',
        `📊 Статус: ${product.status === 'active' ? 'Опубликован' : 
               product.status === 'sold' ? 'Продан' : 'На модерации'}`
      ].join('\n');
    }

    // Стандартное сообщение для новых товаров (product_published)
    return [
      `LOT(лот) #${product.lot_number}`,
      `📦 ${product.title}${brandModelText}`,
      `💰 Цена: ${product.price} $`,
      `🚚 Цена доставки: ${product.delivery_price || 0} $`,
      `🆔 OPT_ID продавца: ${product.optid_created || ''}`,
      `👤 Telegram продавца: ${telegram}`,
      '',
      `📊 Статус: ${product.status === 'active' ? 'Опубликован' : 
             product.status === 'sold' ? 'Продан' : 'На модерации'}`
    ].join('\n');
  }
}
