import { decodeJwt } from '@/auth/jwtHelpers';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details?: {
    source: 'runtime-config' | 'env' | 'fallback';
    keyPreview: string;
    expiry?: Date;
    issuer?: string;
    ref?: string;
    role?: string;
  };
}

export interface SupabaseKeyPayload {
  iss?: string;
  ref?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Валидация JWT токена Supabase Anon Key
 */
export function validateSupabaseAnonKey(key: string | undefined | null): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
  };

  // Проверка на пустое значение
  if (!key || key.trim() === '') {
    result.errors.push('Supabase Anon Key отсутствует');
    return result;
  }

  // Проверка на placeholder значения
  if (key.includes('...') || key === 'your_supabase_anon_key_here') {
    result.errors.push('Supabase Anon Key содержит placeholder значение');
    return result;
  }

  // Проверка формата JWT (должно быть 3 части, разделенные точками)
  const parts = key.split('.');
  if (parts.length !== 3) {
    result.errors.push(`Неверный формат JWT токена. Ожидается 3 части, получено: ${parts.length}`);
    return result;
  }

  // Проверка что все части не пустые
  if (parts.some(part => !part || part.trim() === '')) {
    result.errors.push('JWT токен содержит пустые части');
    return result;
  }

  // Декодирование payload
  const payload = decodeJwt<SupabaseKeyPayload>(key);
  if (!payload) {
    result.errors.push('Не удалось декодировать payload JWT токена');
    return result;
  }

  // Проверка обязательных полей
  if (!payload.iss || payload.iss !== 'supabase') {
    result.errors.push(`Неверный issuer. Ожидается "supabase", получено: "${payload.iss}"`);
  }

  if (!payload.ref) {
    result.errors.push('Отсутствует project ref в JWT payload');
  }

  if (!payload.role || payload.role !== 'anon') {
    result.errors.push(`Неверная роль. Ожидается "anon", получено: "${payload.role}"`);
  }

  // Проверка времени действия токена
  if (payload.exp) {
    const expiry = new Date(payload.exp * 1000);
    const now = new Date();
    
    if (expiry <= now) {
      result.errors.push(`JWT токен истек: ${expiry.toISOString()}`);
    } else {
      // Предупреждение если токен истекает в течение 30 дней
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        result.warnings.push(`JWT токен истечет через ${daysUntilExpiry} дней (${expiry.toISOString()})`);
      }
    }
    
    result.details = {
      ...result.details,
      expiry,
    };
  }

  // Создание превью ключа (первые 20 и последние 10 символов)
  const keyPreview = key.length > 30 
    ? `${key.substring(0, 20)}...${key.substring(key.length - 10)}`
    : key.substring(0, 20) + '...';

  result.details = {
    source: 'runtime-config', // Будет обновлено в месте вызова
    keyPreview,
    issuer: payload.iss,
    ref: payload.ref,
    role: payload.role,
    ...result.details,
  };

  // Если нет ошибок, токен валиден
  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * Получение источника конфигурации
 */
export function getConfigSource(key: string | undefined): 'runtime-config' | 'env' | 'fallback' | 'none' {
  const rt = (globalThis as any).__PB_RUNTIME__ || {};
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  
  if (rt.SUPABASE_ANON_KEY && rt.SUPABASE_ANON_KEY === key) {
    return 'runtime-config';
  }
  
  if (envKey && envKey === key) {
    return 'env';
  }
  
  if (!key) {
    return 'none';
  }
  
  return 'fallback';
}

/**
 * Создание детального отчета об ошибке для пользователя
 */
export function createErrorReport(validation: ValidationResult): string {
  let report = '🚨 Ошибка конфигурации Supabase Anon Key:\n\n';
  
  validation.errors.forEach((error, index) => {
    report += `${index + 1}. ${error}\n`;
  });
  
  if (validation.warnings.length > 0) {
    report += '\n⚠️  Предупреждения:\n';
    validation.warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning}\n`;
    });
  }
  
  report += '\n💡 Как исправить:\n';
  report += '1. Проверьте файл public/runtime-config.js\n';
  report += '2. Убедитесь что SUPABASE_ANON_KEY содержит валидный JWT токен\n';
  report += '3. Получите новый anon key в Supabase Dashboard -> Settings -> API\n';
  report += '4. Проверьте что токен не истек\n';
  
  if (validation.details) {
    report += '\n📊 Детали:\n';
    report += `- Источник: ${validation.details.source}\n`;
    report += `- Превью ключа: ${validation.details.keyPreview}\n`;
    if (validation.details.ref) {
      report += `- Project ref: ${validation.details.ref}\n`;
    }
    if (validation.details.expiry) {
      report += `- Истекает: ${validation.details.expiry.toISOString()}\n`;
    }
  }
  
  return report;
}