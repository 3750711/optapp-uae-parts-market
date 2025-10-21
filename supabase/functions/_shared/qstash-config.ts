import { createServiceClient } from './client.ts';

export interface QStashConfig {
  token: string;
  queueName: string;
  queueUrl: string;
}

/**
 * Get QStash configuration from app_settings
 */
export async function getQStashConfig(): Promise<QStashConfig> {
  const supabase = createServiceClient();
  
  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['qstash_token', 'qstash_queue_name']);
  
  if (error) {
    throw new Error(`Failed to fetch QStash config: ${error.message}`);
  }
  
  if (!settings || settings.length === 0) {
    throw new Error('QStash configuration not found in app_settings');
  }
  
  const token = settings.find(s => s.key === 'qstash_token')?.value;
  const queueName = settings.find(s => s.key === 'qstash_queue_name')?.value;
  
  if (!token) {
    throw new Error('qstash_token not found in app_settings');
  }
  
  if (!queueName) {
    throw new Error('qstash_queue_name not found in app_settings');
  }
  
  // Queue URL format for QStash Queue API (v2/enqueue)
  const queueUrl = `https://qstash.upstash.io/v2/enqueue/${queueName}`;
  
  console.log(`✅ QStash Config loaded: queue=${queueName}`);
  
  return { token, queueName, queueUrl };
}

/**
 * Publish message to QStash Queue with deduplication
 */
export async function publishToQueue(
  config: QStashConfig,
  notificationType: string,
  payload: any,
  deduplicationId?: string
): Promise<{ messageId: string; success: boolean }> {
  
  console.log(`📤 Publishing to QStash queue: ${notificationType}`);
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json'
  };
  
  // Add deduplication ID if provided (prevents duplicate messages)
  if (deduplicationId) {
    headers['Upstash-Deduplication-Id'] = deduplicationId;
    console.log(`🔑 Deduplication ID: ${deduplicationId}`);
  }
  
  const body = {
    notificationType,
    payload
  };
  
  try {
    // QStash Queue requires destination URL in the request URL
    const destinationUrl = Deno.env.get('TELEGRAM_QUEUE_HANDLER_URL') || 
      'https://api.partsbay.ae/functions/v1/telegram-queue-handler';
    
    const fullQueueUrl = `${config.queueUrl}/${destinationUrl}`;
    
    console.log(`📮 Enqueuing to: ${fullQueueUrl}`);
    
    const response = await fetch(fullQueueUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`QStash queue publish failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ Queued successfully: ${result.messageId}`);
    
    return {
      messageId: result.messageId,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ QStash queue error:`, error);
    throw error;
  }
}

/**
 * Generate deduplication ID for a message
 */
export function generateDeduplicationId(
  type: string,
  entityId: string,
  timestamp?: number
): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  // Format: {type}-{entityId}-{timestamp}
  return `${type}-${entityId}-${ts}`;
}
