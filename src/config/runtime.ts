export interface RuntimeConfig {
  SUPABASE_URL: string;
}

let cachedConfig: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/runtime-config.json', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load runtime config: HTTP ${response.status} ${response.statusText}`);
    }

    const config = await response.json() as RuntimeConfig;
    
    if (!config.SUPABASE_URL) {
      throw new Error('SUPABASE_URL not found in runtime config');
    }

    // Validate URL format
    try {
      new URL(config.SUPABASE_URL);
    } catch {
      throw new Error(`Invalid SUPABASE_URL format: ${config.SUPABASE_URL}`);
    }

    cachedConfig = config;
    console.log('🌍 Runtime config loaded successfully:', config.SUPABASE_URL);
    
    return config;
  } catch (error) {
    console.error('❌ Failed to load runtime config:', error);
    
    // Fallback to hardcoded values if runtime config fails
    const fallbackConfig: RuntimeConfig = {
      SUPABASE_URL: 'https://api.partsbay.ae'
    };
    
    cachedConfig = fallbackConfig;
    console.warn('⚠️ Using fallback runtime config:', fallbackConfig.SUPABASE_URL);
    
    return fallbackConfig;
  }
}