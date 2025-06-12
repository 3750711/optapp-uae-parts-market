
interface RegionInfo {
  isBlocked: boolean;
  country: string;
  timezone: string;
  language: string;
}

interface SupabaseConfig {
  url: string;
  key: string;
  useProxy: boolean;
}

class SupabaseRegionDetector {
  private static instance: SupabaseRegionDetector;
  private regionInfo: RegionInfo | null = null;
  private connectionStatus: 'checking' | 'connected' | 'blocked' | 'proxy' = 'checking';
  
  static getInstance(): SupabaseRegionDetector {
    if (!SupabaseRegionDetector.instance) {
      SupabaseRegionDetector.instance = new SupabaseRegionDetector();
    }
    return SupabaseRegionDetector.instance;
  }

  async detectRegion(): Promise<RegionInfo> {
    if (this.regionInfo) {
      return this.regionInfo;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    // Детекция российского региона
    const isRussianTimezone = timezone.includes('Europe/Moscow') || 
                             timezone.includes('Asia/Yekaterinburg') ||
                             timezone.includes('Asia/Omsk') ||
                             timezone.includes('Asia/Krasnoyarsk') ||
                             timezone.includes('Asia/Irkutsk') ||
                             timezone.includes('Asia/Yakutsk') ||
                             timezone.includes('Asia/Vladivostok') ||
                             timezone.includes('Asia/Magadan') ||
                             timezone.includes('Asia/Kamchatka');
    
    const isRussianLanguage = language.startsWith('ru');
    
    let country = 'unknown';
    if (isRussianTimezone || isRussianLanguage) {
      country = 'RU';
    }

    // Проверяем доступность Supabase
    const isBlocked = await this.testSupabaseConnection();
    
    this.regionInfo = {
      isBlocked,
      country,
      timezone,
      language
    };

    return this.regionInfo;
  }

  private async testSupabaseConnection(): Promise<boolean> {
    try {
      // Пытаемся сделать простой запрос к Supabase
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
      
      const response = await fetch('https://vfiylfljiixqkjfqubyq.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0'
        }
      });
      
      clearTimeout(timeoutId);
      this.connectionStatus = response.ok ? 'connected' : 'blocked';
      
      return !response.ok;
    } catch (error) {
      console.warn('Supabase connection test failed:', error);
      this.connectionStatus = 'blocked';
      return true;
    }
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Получаем конфигурацию Supabase с учетом региона
  async getSupabaseConfig(): Promise<SupabaseConfig> {
    const regionInfo = await this.detectRegion();
    
    if (regionInfo.isBlocked) {
      // Используем прокси эндпоинт
      return {
        url: 'https://supabase-proxy.partsbay.workers.dev',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0',
        useProxy: true
      };
    }

    return {
      url: 'https://vfiylfljiixqkjfqubyq.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0',
      useProxy: false
    };
  }

  // Сохраняем статус в localStorage для кэширования
  saveConnectionStatus() {
    if (this.regionInfo) {
      localStorage.setItem('supabase_region_info', JSON.stringify({
        ...this.regionInfo,
        timestamp: Date.now()
      }));
    }
  }

  // Загружаем закэшированный статус
  loadConnectionStatus(): boolean {
    try {
      const cached = localStorage.getItem('supabase_region_info');
      if (cached) {
        const data = JSON.parse(cached);
        // Кэш действителен 1 час
        if (Date.now() - data.timestamp < 3600000) {
          this.regionInfo = data;
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached region info:', error);
    }
    return false;
  }
}

export default SupabaseRegionDetector;
export type { RegionInfo, SupabaseConfig };
