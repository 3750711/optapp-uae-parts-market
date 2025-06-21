
import { supabase } from "@/integrations/supabase/client";

// Функция для определения типа ввода (email или OPT ID)
export const detectInputType = (input: string): 'email' | 'opt_id' => {
  // Простая проверка на email формат
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input) ? 'email' : 'opt_id';
};

// Улучшенная функция для получения IP адреса
const getClientIP = async (): Promise<string | null> => {
  try {
    // Используем несколько методов для получения IP
    const methods = [
      async () => {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      },
      async () => {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return data.ip;
      },
      // Fallback для локальной разработки
      () => Promise.resolve('127.0.0.1')
    ];

    for (const method of methods) {
      try {
        const ip = await method();
        if (ip && ip !== '127.0.0.1') {
          console.log('Detected IP:', ip);
          return ip;
        }
      } catch (error) {
        console.warn('IP detection method failed:', error);
        continue;
      }
    }
    
    return '127.0.0.1'; // Fallback IP
  } catch (error) {
    console.error('All IP detection methods failed:', error);
    return null;
  }
};

// Обновленная функция для получения email по OPT ID с улучшенным rate limiting
export const getEmailByOptId = async (optId: string): Promise<{ email: string | null; isRateLimited: boolean }> => {
  try {
    const clientIP = await getClientIP();
    
    const { data, error } = await supabase.rpc('get_email_by_opt_id', {
      p_opt_id: optId,
      p_ip_address: clientIP
    });

    if (error) {
      console.error('Error getting email by OPT ID:', error);
      // Проверяем, является ли это ошибкой rate limiting
      if (error.message?.includes('Rate limit') || error.message?.includes('exceeded')) {
        return { email: null, isRateLimited: true };
      }
      return { email: null, isRateLimited: false };
    }

    return { email: data, isRateLimited: false };
  } catch (error) {
    console.error('Exception getting email by OPT ID:', error);
    // Если произошла исключительная ошибка, считаем что это может быть rate limiting
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Rate limit') || errorMessage.includes('exceeded')) {
      return { email: null, isRateLimited: true };
    }
    return { email: null, isRateLimited: false };
  }
};

// Обновленная функция для проверки существования OPT ID с rate limiting
export const checkOptIdExists = async (optId: string): Promise<{ exists: boolean; isRateLimited: boolean }> => {
  try {
    const clientIP = await getClientIP();
    
    const { data, error } = await supabase.rpc('check_opt_id_exists', {
      p_opt_id: optId,
      p_ip_address: clientIP
    });

    if (error) {
      console.error('Error checking OPT ID exists:', error);
      return { exists: false, isRateLimited: false };
    }

    return { exists: data || false, isRateLimited: false };
  } catch (error) {
    console.error('Exception checking OPT ID exists:', error);
    return { exists: false, isRateLimited: false };
  }
};

// Улучшенная функция для логирования успешного входа
export const logSuccessfulLogin = async (identifier: string, attemptType: 'email' | 'opt_id'): Promise<void> => {
  try {
    const clientIP = await getClientIP();
    
    // Логируем успешный вход напрямую в таблицу
    const { error } = await supabase.from('login_attempts').insert({
      identifier,
      ip_address: clientIP,
      attempt_type: attemptType,
      success: true
    });

    if (error) {
      console.error('Error logging successful login:', error);
    } else {
      console.log('Successfully logged login attempt:', { identifier, attemptType, success: true });
    }
  } catch (error) {
    console.error('Exception logging successful login:', error);
  }
};

// Функция для логирования неудачного входа
export const logFailedLogin = async (identifier: string, attemptType: 'email' | 'opt_id', errorMessage?: string): Promise<void> => {
  try {
    const clientIP = await getClientIP();
    
    const { error } = await supabase.from('login_attempts').insert({
      identifier,
      ip_address: clientIP,
      attempt_type: attemptType,
      success: false,
      error_message: errorMessage || 'Authentication failed'
    });

    if (error) {
      console.error('Error logging failed login:', error);
    } else {
      console.log('Successfully logged failed login attempt:', { identifier, attemptType, success: false });
    }
  } catch (error) {
    console.error('Exception logging failed login:', error);
  }
};

// Функция для проверки необходимости первого входа
export const checkFirstLoginRequired = (profile: any): boolean => {
  return profile?.email?.endsWith('@g.com') && !profile?.first_login_completed;
};

// Функция для завершения процесса первого входа
export const completeFirstLogin = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ first_login_completed: true })
      .eq('id', userId);

    if (error) {
      console.error('Error completing first login:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception completing first login:', error);
    return false;
  }
};

// Новая функция для проверки статистики попыток входа
export const getLoginAttemptStats = async (identifier: string): Promise<{
  totalAttempts: number;
  recentFailedAttempts: number;
  lastSuccessfulLogin?: Date;
}> => {
  try {
    const { data: attempts, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('identifier', identifier)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error getting login attempt stats:', error);
      return { totalAttempts: 0, recentFailedAttempts: 0 };
    }

    const recentFailedAttempts = attempts?.filter(
      attempt => !attempt.success && 
      new Date(attempt.created_at) > new Date(Date.now() - 60 * 60 * 1000) // последний час
    ).length || 0;

    const lastSuccessful = attempts?.find(attempt => attempt.success);

    return {
      totalAttempts: attempts?.length || 0,
      recentFailedAttempts,
      lastSuccessfulLogin: lastSuccessful ? new Date(lastSuccessful.created_at) : undefined
    };
  } catch (error) {
    console.error('Exception getting login attempt stats:', error);
    return { totalAttempts: 0, recentFailedAttempts: 0 };
  }
};
