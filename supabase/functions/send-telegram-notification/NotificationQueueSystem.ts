import { ProductNotificationHandler } from './ProductNotificationHandler.ts';

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
    // Fetch next pending item
    const { data: items, error } = await this.supabaseClient
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('❌ [Queue] Failed to fetch next item:', error);
      return;
    }

    if (!items || items.length === 0) {
      return;
    }

    const item: QueueItem = items[0];
    const startTime = Date.now();

    // Update to processing
    await this.supabaseClient
      .from('notification_queue')
      .update({ status: 'processing' })
      .eq('id', item.id);

    console.log(`⚙️ [Queue] Processing ${item.notification_type} notification (priority: ${item.priority})`);

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
          processing_time_ms: processingTime
        })
        .eq('id', item.id);

      console.log(`✅ [Queue] Completed ${item.notification_type} in ${processingTime}ms`);
    } catch (error) {
      const newAttempts = item.attempts + 1;
      const processingTime = Date.now() - startTime;

      console.error(`❌ [Queue] Failed to process ${item.notification_type}:`, error);

      if (newAttempts >= item.max_attempts) {
        // Move to dead letter
        await this.supabaseClient
          .from('notification_queue')
          .update({
            status: 'dead_letter',
            attempts: newAttempts,
            last_error: error instanceof Error ? error.message : String(error),
            processing_time_ms: processingTime
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
            processing_time_ms: processingTime
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
    const key = `${type}_${payload.productId || payload.orderId || payload.userId}_${Date.now()}`;
    return btoa(key).substring(0, 32);
  }
}
