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
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load runtime config: ${response.status}`);
    }

    const config = await response.json() as RuntimeConfig;
    
    if (!config.SUPABASE_URL) {
      throw new Error('SUPABASE_URL not found in runtime config');
    }

    cachedConfig = config;
    console.log('🌍 Runtime config loaded:', config.SUPABASE_URL);
    
    return config;
  } catch (error) {
    console.error('❌ Failed to load runtime config:', error);
    
    // Fallback to hardcoded values if runtime config fails
    const fallbackConfig: RuntimeConfig = {
      SUPABASE_URL: 'https://api.partsbay.ae'
    };
    
    cachedConfig = fallbackConfig;
    console.warn('⚠️ Using fallback runtime config');
    
    return fallbackConfig;
  }
}