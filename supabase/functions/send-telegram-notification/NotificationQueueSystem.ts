import { ProductNotificationHandler } from './ProductNotificationHandler.ts';
import { RateLimitError } from './TelegramApiClient.ts';

interface QueueItem {
  id: string;
  notification_type: string;
  priority: string;
  status: string;
  payload: any;
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  created_at: string;
}

export class NotificationQueueSystem {
  private processing = false;
  private intervalId: number | null = null;
  private rateLimitUntil: number = 0;

  constructor(
    private supabaseClient: any,
    private productHandler: ProductNotificationHandler
  ) {}

  async enqueue(type: string, payload: any, priority: string = 'normal'): Promise<string> {
    const requestId = this.generateRequestId(type, payload);
    
    // Check for duplicate
    const { data: existing } = await this.supabaseClient
      .from('notification_queue')
      .select('id')
      .eq('request_id', requestId)
      .single();

    if (existing) {
      console.log(`⚠️ [Queue] Duplicate request detected: ${requestId}`);
      return existing.id;
    }

    // Check for recent similar notifications (within last 10 seconds)
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const entityId = payload.productId || payload.orderId || payload.userId;

    if (entityId && payload.notificationType) {
      const { data: recentNotifications } = await this.supabaseClient
        .from('notification_queue')
        .select('id, created_at')
        .eq('notification_type', type)
        .gte('created_at', tenSecondsAgo)
        .limit(10);

      if (recentNotifications && recentNotifications.length > 0) {
        // Check each recent notification's payload
        for (const recent of recentNotifications) {
          const { data: recentQueue } = await this.supabaseClient
            .from('notification_queue')
            .select('payload')
            .eq('id', recent.id)
            .single();
          
          if (recentQueue?.payload) {
            const recentEntityId = recentQueue.payload.productId || recentQueue.payload.orderId || recentQueue.payload.userId;
            const recentNotificationType = recentQueue.payload.notificationType;
            
            if (recentEntityId === entityId && recentNotificationType === payload.notificationType) {
              console.log(`⚠️ [Queue] Recent similar notification found (within 10s), skipping duplicate for entity ${entityId}`);
              return recent.id;
            }
          }
        }
      }
    }

    // Set lock on product table BEFORE inserting into queue
    if (type === 'product' && payload.productId) {
      await this.supabaseClient
        .from('products')
        .update({
          last_notification_sent_at: new Date().toISOString(),
          tg_notify_status: 'pending'
        })
        .eq('id', payload.productId);
      
      console.log(`🔒 [Queue] Lock set for product ${payload.productId}`);
    }

    // Insert into queue
    const { data, error } = await this.supabaseClient
      .from('notification_queue')
      .insert({
        notification_type: type,
        priority,
        status: 'pending',
        payload,
        request_id: requestId,
        scheduled_for: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Queue] Failed to enqueue:', error);
      throw error;
    }

    console.log(`✅ [Queue] Enqueued ${type} notification with priority ${priority}`);
    return data.id;
  }

  async restoreQueueFromDatabase(): Promise<void> {
    console.log('🔄 [Queue] Restoring queue from database...');
    
    // Reset stuck processing items (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { error } = await this.supabaseClient
      .from('notification_queue')
      .update({ status: 'pending' })
      .eq('status', 'processing')
      .lt('updated_at', fiveMinutesAgo);

    if (error) {
      console.error('❌ [Queue] Failed to restore queue:', error);
    } else {
      console.log('✅ [Queue] Queue restored successfully');
    }
  }

  startProcessing(): void {
    if (this.processing) {
      console.log('⚠️ [Queue] Processing already started');
      return;
    }

    this.processing = true;
    console.log('🚀 [Queue] Starting queue processing...');

    // Process every 2 seconds
    this.intervalId = setInterval(() => {
      this.processNext().catch(error => {
        console.error('❌ [Queue] Error in processing loop:', error);
      });
    }, 2000);
  }

  stopProcessing(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.processing = false;
    console.log('🛑 [Queue] Stopped queue processing');
  }

  private async processNext(): Promise<void> {
    // Check if we're rate limited
    if (Date.now() < this.rateLimitUntil) {
      const waitSeconds = Math.ceil((this.rateLimitUntil - Date.now()) / 1000);
      console.log(`⏸️ [Queue] Rate limited, waiting ${waitSeconds}s until ${new Date(this.rateLimitUntil).toISOString()}`);
      return;
    }

    // Fetch next pending item atomically with lock
    const { data: items, error } = await this.supabaseClient
      .rpc('get_next_queue_item');
    if (error) {
      console.error('❌ [Queue] Failed to fetch next item:', error);
      return;
    }

    if (!items || items.length === 0) {
      return;
    }

    const item: QueueItem = items[0];
    console.log(`⚙️ [Queue] Processing ${item.priority} priority notification: ${item.notification_type}`);
    const startTime = Date.now();

    // Update to processing (item already locked by FOR UPDATE SKIP LOCKED)
    const { error: updateError } = await this.supabaseClient
      .from('notification_queue')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (updateError) {
      console.log('🔒 [Queue] Item locked by another worker, skipping');
      return;
    }

    try {
      // Handle the item
      await this.handleItem(item);

      // Mark as completed
      const processingTime = Date.now() - startTime;
      await this.supabaseClient
        .from('notification_queue')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      console.log(`✅ [Queue] Completed ${item.notification_type} in ${processingTime}ms`);
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Handle rate limit errors separately
      if (error instanceof RateLimitError) {
        this.rateLimitUntil = Date.now() + (error.retryAfter * 1000);
        console.log(`⏸️ [Queue] Rate limited! Pausing queue for ${error.retryAfter}s until ${new Date(this.rateLimitUntil).toISOString()}`);
        
        // Reset to pending WITHOUT incrementing attempts
        await this.supabaseClient
          .from('notification_queue')
          .update({
            status: 'pending',
            last_error: error.message,
            scheduled_for: new Date(this.rateLimitUntil).toISOString(),
            processing_time_ms: processingTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        return;
      }

      const newAttempts = item.attempts + 1;
      console.error(`❌ [Queue] Failed to process ${item.notification_type}:`, error);

      if (newAttempts >= item.max_attempts) {
        // Move to dead letter
        await this.supabaseClient
          .from('notification_queue')
          .update({
            status: 'dead_letter',
            attempts: newAttempts,
            last_error: error instanceof Error ? error.message : String(error),
            processing_time_ms: processingTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        console.error(`💀 [Queue] Moved to dead letter after ${newAttempts} attempts`);
      } else {
        // Retry with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, newAttempts), 60000);
        const scheduledFor = new Date(Date.now() + backoffMs).toISOString();

        await this.supabaseClient
          .from('notification_queue')
          .update({
            status: 'pending',
            attempts: newAttempts,
            last_error: error instanceof Error ? error.message : String(error),
            scheduled_for: scheduledFor,
            processing_time_ms: processingTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        console.log(`🔄 [Queue] Scheduled retry ${newAttempts}/${item.max_attempts} in ${backoffMs}ms`);
      }
    }
  }

  private async handleItem(item: QueueItem): Promise<void> {
    switch (item.notification_type) {
      case 'product':
        await this.productHandler.handle(item.payload);
        break;
      case 'order':
        // TODO: Implement OrderNotificationHandler
        console.log('⚠️ [Queue] Order notifications not yet implemented');
        break;
      case 'admin':
        // TODO: Implement AdminNotificationHandler
        console.log('⚠️ [Queue] Admin notifications not yet implemented');
        break;
      default:
        throw new Error(`Unknown notification type: ${item.notification_type}`);
    }
  }

  private generateRequestId(type: string, payload: any): string {
    // Round timestamp to seconds to deduplicate rapid duplicate requests (e.g., from React StrictMode)
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    const key = `${type}_${payload.notificationType || ''}_${payload.productId || payload.orderId || payload.userId}_${timestampInSeconds}`;
    
    // Use full base64 hash
    return btoa(key);
  }
}
