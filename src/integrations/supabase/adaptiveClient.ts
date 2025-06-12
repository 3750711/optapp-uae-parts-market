
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import SupabaseRegionDetector from '@/utils/supabaseRegionDetector';

class AdaptiveSupabaseClient {
  private static instance: AdaptiveSupabaseClient;
  private client: SupabaseClient<Database> | null = null;
  private detector = SupabaseRegionDetector.getInstance();
  private initPromise: Promise<SupabaseClient<Database>> | null = null;

  static getInstance(): AdaptiveSupabaseClient {
    if (!AdaptiveSupabaseClient.instance) {
      AdaptiveSupabaseClient.instance = new AdaptiveSupabaseClient();
    }
    return AdaptiveSupabaseClient.instance;
  }

  async getClient(): Promise<SupabaseClient<Database>> {
    if (this.client) {
      return this.client;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeClient();
    return this.initPromise;
  }

  private async initializeClient(): Promise<SupabaseClient<Database>> {
    console.log('🔄 Initializing adaptive Supabase client...');
    
    // Загружаем кэшированную информацию о регионе
    this.detector.loadConnectionStatus();
    
    // Получаем конфигурацию для текущего региона
    const config = await this.detector.getSupabaseConfig();
    
    console.log(`🌍 Using Supabase config:`, {
      url: config.url,
      useProxy: config.useProxy
    });

    // Создаем клиент с соответствующей конфигурацией
    this.client = createClient<Database>(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: config.useProxy ? {
          'X-Proxy-Target': 'https://vfiylfljiixqkjfqubyq.supabase.co'
        } : {}
      }
    });

    // Сохраняем статус подключения
    this.detector.saveConnectionStatus();

    return this.client;
  }

  // Метод для переключения на прокси в случае проблем
  async switchToProxy(): Promise<SupabaseClient<Database>> {
    console.log('🔄 Switching to proxy mode...');
    
    this.client = createClient<Database>(
      'https://supabase-proxy.partsbay.workers.dev',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'X-Proxy-Target': 'https://vfiylfljiixqkjfqubyq.supabase.co'
          }
        }
      }
    );

    return this.client;
  }

  getConnectionStatus() {
    return this.detector.getConnectionStatus();
  }
}

// Экспортируем адаптивный клиент
const adaptiveClient = AdaptiveSupabaseClient.getInstance();

export { adaptiveClient };
export default AdaptiveSupabaseClient;
