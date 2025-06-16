
import { corsHeaders } from '../_shared/cors.ts'

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface ErrorBatch {
  errors: ErrorReport[];
  clientInfo?: {
    userAgent: string;
    timestamp: number;
    sessionId: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('📊 Error reporting endpoint called');
    
    const body: ErrorBatch = await req.json();
    const { errors, clientInfo } = body;

    // Валидация входных данных
    if (!errors || !Array.isArray(errors) || errors.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid or empty errors array' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ограничиваем количество ошибок в одном запросе
    if (errors.length > 50) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Too many errors in single batch (max 50)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Processing ${errors.length} error reports`);

    // Фильтруем и валидируем каждую ошибку
    const validErrors = errors.filter(error => {
      return error.message && 
             typeof error.message === 'string' &&
             error.timestamp &&
             typeof error.timestamp === 'number' &&
             error.severity &&
             ['low', 'medium', 'high', 'critical'].includes(error.severity);
    });

    if (validErrors.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No valid errors found' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Группируем ошибки по серьезности
    const errorsByseverity = validErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Error summary by severity:', errorsByseverity);

    // Логируем критические ошибки отдельно
    const criticalErrors = validErrors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      console.error('🚨 CRITICAL ERRORS DETECTED:', {
        count: criticalErrors.length,
        errors: criticalErrors.map(e => ({
          message: e.message,
          url: e.url,
          timestamp: new Date(e.timestamp).toISOString()
        }))
      });
    }

    // В production здесь можно добавить отправку в внешние сервисы
    // например Sentry, LogRocket или другие мониторинговые системы
    
    // Пример интеграции с внешним сервисом (закомментировано)
    /*
    const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
    if (SENTRY_DSN && criticalErrors.length > 0) {
      try {
        await fetch(SENTRY_DSN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errors: criticalErrors,
            environment: 'production',
            timestamp: Date.now()
          })
        });
      } catch (sentryError) {
        console.error('Failed to send to Sentry:', sentryError);
      }
    }
    */

    // Возвращаем успешный ответ
    return new Response(JSON.stringify({
      success: true,
      processed: validErrors.length,
      rejected: errors.length - validErrors.length,
      summary: errorsByseverity,
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Error in error-reports function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
