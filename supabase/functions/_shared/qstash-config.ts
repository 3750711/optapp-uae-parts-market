import { createServiceClient } from './client.ts';

export interface QStashConfig {
  token: string;
  endpointUrl: string;  // Full URL of the endpoint to call
  publishUrl: string;   // QStash Direct Publish API URL
}

/**
 * Get QStash configuration from app_settings
 * Now uses Direct Publish API instead of Queue API
 */
export async function getQStashConfig(): Promise<QStashConfig> {
  const supabase = createServiceClient();
  
  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['qstash_token', 'qstash_endpoint_url']);
  
  if (error) {
    throw new Error(`Failed to fetch QStash config: ${error.message}`);
  }
  
  if (!settings || settings.length === 0) {
    throw new Error('QStash configuration not found in app_settings');
  }
  
  const token = settings.find(s => s.key === 'qstash_token')?.value;
  const endpointUrl = settings.find(s => s.key === 'qstash_endpoint_url')?.value;
  
  if (!token) {
    throw new Error('qstash_token not found in app_settings');
  }
  
  if (!endpointUrl) {
    throw new Error('qstash_endpoint_url not found in app_settings');
  }
  
  // Direct Publish API format: v2/publish/{destination-url}
  const publishUrl = `https://qstash.upstash.io/v2/publish/${endpointUrl}`;
  
  console.log(`✅ QStash Direct Publish configured: ${endpointUrl}`);
  
  return { token, endpointUrl, publishUrl };
}

/**
 * Publish message to QStash using Direct Publish API
 * Provides retry and deduplication without intermediate queue
 */
export async function publishToQueue(
  config: QStashConfig,
  notificationType: string,
  payload: any,
  deduplicationId?: string
): Promise<{ messageId: string; success: boolean }> {
  
  console.log(`📤 Publishing to QStash (Direct): ${notificationType}`);
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json',
    'Upstash-Retries': '3',  // Enable retry on QStash side (3 attempts with exponential backoff)
    'Upstash-Retry-Backoff': '30',  // Wait 30s between retries (for Telegram rate limit recovery)
    'Upstash-Forward-Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`, // Forward auth to endpoint
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
    console.log(`📮 Publishing to: ${config.publishUrl}`);
    
    const response = await fetch(config.publishUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`QStash publish failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ Published successfully: ${result.messageId}`);
    
    return {
      messageId: result.messageId,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ QStash publish error:`, error);
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
