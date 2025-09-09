import { validateSupabaseAnonKey, getConfigSource } from './supabaseValidation';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from './runtimeSupabase';

export interface ConfigDiagnostics {
  overall: 'healthy' | 'warning' | 'error';
  url: {
    value: string;
    source: string;
    isValid: boolean;
  };
  anonKey: {
    validation: ReturnType<typeof validateSupabaseAnonKey>;
    source: string;
  };
  runtime: {
    loaded: boolean;
    version?: string;
    timestamp?: string;
  };
  environment: {
    isDev: boolean;
    isPreview: boolean;
    hostname: string;
  };
  recommendations: string[];
}

/**
 * Полная диагностика конфигурации Supabase
 */
export function diagnoseSupabaseConfig(): ConfigDiagnostics {
  const url = getRuntimeSupabaseUrl();
  const anonKey = getRuntimeAnonKey();
  const rt = (globalThis as any).__PB_RUNTIME__ || {};
  
  const urlValidation = validateUrl(url);
  const keyValidation = validateSupabaseAnonKey(anonKey);
  const keySource = getConfigSource(anonKey);
  
  // Update source in validation details
  if (keyValidation.details) {
    keyValidation.details.source = keySource as any;
  }
  
  const diagnostics: ConfigDiagnostics = {
    overall: 'healthy',
    url: {
      value: url,
      source: getUrlSource(url),
      isValid: urlValidation.isValid,
    },
    anonKey: {
      validation: keyValidation,
      source: keySource,
    },
    runtime: {
      loaded: !!rt && Object.keys(rt).length > 0,
      version: rt.__VERSION__,
      timestamp: rt.__TIMESTAMP__,
    },
    environment: {
      isDev: import.meta.env?.DEV || false,
      isPreview: isPreviewEnvironment(),
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    },
    recommendations: [],
  };
  
  // Определение общего статуса
  if (!keyValidation.isValid || !urlValidation.isValid) {
    diagnostics.overall = 'error';
  } else if (keyValidation.warnings.length > 0) {
    diagnostics.overall = 'warning';
  }
  
  // Генерация рекомендаций
  generateRecommendations(diagnostics);
  
  return diagnostics;
}

/**
 * Валидация URL
 */
function validateUrl(url: string): { isValid: boolean; errors: string[] } {
  const result = { isValid: true, errors: [] as string[] };
  
  if (!url) {
    result.errors.push('URL отсутствует');
    result.isValid = false;
    return result;
  }
  
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      result.errors.push('URL должен использовать HTTP/HTTPS протокол');
      result.isValid = false;
    }
  } catch {
    result.errors.push('Неверный формат URL');
    result.isValid = false;
  }
  
  return result;
}

/**
 * Получение источника URL
 */
function getUrlSource(url: string): string {
  const rt = (globalThis as any).__PB_RUNTIME__ || {};
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  
  if (rt.SUPABASE_URL && rt.SUPABASE_URL === url) {
    return 'runtime-config';
  }
  
  if (envUrl && envUrl === url) {
    return 'environment';
  }
  
  if (url === 'https://api.partsbay.ae') {
    return 'fallback';
  }
  
  return 'unknown';
}

/**
 * Проверка preview окружения
 */
function isPreviewEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return /(^preview--.+\.lovable\.app$)|(^localhost$)/i.test(hostname);
}

/**
 * Генерация рекомендаций на основе диагностики
 */
function generateRecommendations(diagnostics: ConfigDiagnostics): void {
  const { url, anonKey, runtime, environment } = diagnostics;
  
  // Рекомендации по runtime config
  if (!runtime.loaded) {
    diagnostics.recommendations.push('Убедитесь что файл public/runtime-config.js загружается корректно');
  }
  
  if (!runtime.version) {
    diagnostics.recommendations.push('Добавьте версионирование в runtime-config.js для лучшего отслеживания изменений');
  }
  
  // Рекомендации по URL
  if (url.source === 'fallback') {
    diagnostics.recommendations.push('Настройте SUPABASE_URL в runtime-config.js вместо использования fallback значения');
  }
  
  // Рекомендации по ключу
  if (anonKey.source === 'env') {
    diagnostics.recommendations.push('Рекомендуется использовать runtime-config.js вместо environment переменных для гибкости');
  }
  
  if (anonKey.validation.warnings.length > 0) {
    diagnostics.recommendations.push('Обновите Anon Key - текущий скоро истечет');
  }
  
  // Рекомендации по окружению
  if (environment.isDev && !runtime.loaded) {
    diagnostics.recommendations.push('В dev режиме убедитесь что public/runtime-config.js доступен');
  }
  
  if (environment.isPreview) {
    diagnostics.recommendations.push('В preview окружении проверьте что все настройки корректны для продакшена');
  }
}

/**
 * Красивый вывод диагностики в консоль
 */
export function logConfigDiagnostics(diagnostics?: ConfigDiagnostics): void {
  const diag = diagnostics || diagnoseSupabaseConfig();
  
  console.group('🔧 Диагностика конфигурации Supabase');
  
  // Общий статус
  const statusIcon = diag.overall === 'healthy' ? '✅' : diag.overall === 'warning' ? '⚠️' : '❌';
  console.log(`${statusIcon} Общий статус: ${diag.overall}`);
  
  // URL
  console.group('🌐 Supabase URL');
  console.log(`Значение: ${diag.url.value}`);
  console.log(`Источник: ${diag.url.source}`);
  console.log(`Валидный: ${diag.url.isValid ? '✅' : '❌'}`);
  console.groupEnd();
  
  // Anon Key
  console.group('🔑 Anon Key');
  console.log(`Источник: ${diag.anonKey.source}`);
  console.log(`Валидный: ${diag.anonKey.validation.isValid ? '✅' : '❌'}`);
  if (diag.anonKey.validation.details) {
    console.log(`Превью: ${diag.anonKey.validation.details.keyPreview}`);
    console.log(`Project ref: ${diag.anonKey.validation.details.ref}`);
    console.log(`Роль: ${diag.anonKey.validation.details.role}`);
    if (diag.anonKey.validation.details.expiry) {
      console.log(`Истекает: ${diag.anonKey.validation.details.expiry.toISOString()}`);
    }
  }
  if (diag.anonKey.validation.errors.length > 0) {
    console.group('❌ Ошибки:');
    diag.anonKey.validation.errors.forEach(error => console.log(`• ${error}`));
    console.groupEnd();
  }
  if (diag.anonKey.validation.warnings.length > 0) {
    console.group('⚠️ Предупреждения:');
    diag.anonKey.validation.warnings.forEach(warning => console.log(`• ${warning}`));
    console.groupEnd();
  }
  console.groupEnd();
  
  // Runtime
  console.group('⚡ Runtime Config');
  console.log(`Загружен: ${diag.runtime.loaded ? '✅' : '❌'}`);
  console.log(`Версия: ${diag.runtime.version || 'не указана'}`);
  console.log(`Время: ${diag.runtime.timestamp || 'не указано'}`);
  console.groupEnd();
  
  // Environment
  console.group('🌍 Окружение');
  console.log(`Режим разработки: ${diag.environment.isDev ? '✅' : '❌'}`);
  console.log(`Preview: ${diag.environment.isPreview ? '✅' : '❌'}`);
  console.log(`Hostname: ${diag.environment.hostname}`);
  console.groupEnd();
  
  // Рекомендации
  if (diag.recommendations.length > 0) {
    console.group('💡 Рекомендации');
    diag.recommendations.forEach((rec, index) => console.log(`${index + 1}. ${rec}`));
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Глобальная функция для быстрой диагностики (доступна в dev tools)
 */
if (typeof window !== 'undefined') {
  (window as any).__debugSupabaseConfig = () => {
    const diagnostics = diagnoseSupabaseConfig();
    logConfigDiagnostics(diagnostics);
    return diagnostics;
  };
}