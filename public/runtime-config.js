/**
 * PartsBay Runtime Configuration
 * 
 * Этот файл содержит конфигурацию для продакшена.
 * Изменения в этом файле влияют на все окружения.
 * 
 * ВАЖНО: Всегда проверяйте изменения перед деплоем!
 */

// Инициализация глобального объекта конфигурации
window.__PB_RUNTIME__ = window.__PB_RUNTIME__ || {};

// === КОНФИГУРАЦИЯ SUPABASE ===

// URL Supabase API (используется Gcore proxy для PartsBay)
// ЗАПРЕЩЕНО менять на *.supabase.co - используется только proxy
window.__PB_RUNTIME__.SUPABASE_URL = window.__PB_RUNTIME__.SUPABASE_URL || 'https://api.partsbay.ae';

// Публичный Anon Key для доступа к Supabase
// КРИТИЧЕСКИ ВАЖНО: Должен быть валидным JWT токеном с ролью "anon"
// Получить можно в: Supabase Dashboard -> Settings -> API -> anon public
window.__PB_RUNTIME__.SUPABASE_ANON_KEY = window.__PB_RUNTIME__.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';


// === НАСТРОЙКИ АУТЕНТИФИКАЦИИ ===

// Отладочный режим аутентификации (только для разработки!)
// ВАЖНО: Отключить в продакшене для безопасности
window.__PB_RUNTIME__.DEBUG_AUTH = window.__PB_RUNTIME__.DEBUG_AUTH ?? false;

// Таймаут инициализации аутентификации (мс)
// Увеличен для стабильной работы в продакшене
window.__PB_RUNTIME__.AUTH_INIT_TIMEOUT_MS = window.__PB_RUNTIME__.AUTH_INIT_TIMEOUT_MS ?? 20000;

// === МЕТАДАННЫЕ КОНФИГУРАЦИИ ===

// Версия конфигурации (обновляйте при изменениях)
window.__PB_RUNTIME__.__VERSION__ = '2.1.0';

// Время последнего обновления
window.__PB_RUNTIME__.__TIMESTAMP__ = new Date().toISOString();

// === ВАЛИДАЦИЯ КОНФИГУРАЦИИ ===

// Простая проверка обязательных параметров
(function validateConfig() {
  const config = window.__PB_RUNTIME__;
  const errors = [];
  
  if (!config.SUPABASE_URL) {
    errors.push('SUPABASE_URL не настроен');
  }
  
  if (!config.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY не настроен');
  } else if (config.SUPABASE_ANON_KEY.includes('...') || config.SUPABASE_ANON_KEY === 'your_key_here') {
    errors.push('SUPABASE_ANON_KEY содержит placeholder значение');
  }
  
  if (errors.length > 0) {
    console.error('❌ Ошибки конфигурации runtime-config.js:', errors);
  } else {
    console.log('✅ Runtime конфигурация загружена успешно (v' + config.__VERSION__ + ')');
  }
})();