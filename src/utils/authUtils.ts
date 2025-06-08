
import { supabase } from "@/integrations/supabase/client";

// Функция для определения типа ввода (email или OPT ID)
export const detectInputType = (input: string): 'email' | 'opt_id' => {
  // Простая проверка на email формат
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input) ? 'email' : 'opt_id';
};

// Функция для получения IP адреса (упрощенная версия)
const getClientIP = async (): Promise<string | null> => {
  try {
    // В продакшене можно использовать более надежные методы
    // Пока используем простой fallback
    return null;
  } catch (error) {
    console.error('Error getting client IP:', error);
    return null;
  }
};

// Функция для получения email по OPT ID с rate limiting
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
      if (error.message?.includes('Rate limit')) {
        return { email: null, isRateLimited: true };
      }
      return { email: null, isRateLimited: false };
    }

    return { email: data, isRateLimited: false };
  } catch (error) {
    console.error('Exception getting email by OPT ID:', error);
    return { email: null, isRateLimited: false };
  }
};

// Функция для проверки существования OPT ID с rate limiting
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

    // Если функция вернула false, это может означать rate limiting
    // В продакшене стоит добавить более точную проверку
    return { exists: data || false, isRateLimited: false };
  } catch (error) {
    console.error('Exception checking OPT ID exists:', error);
    return { exists: false, isRateLimited: false };
  }
};

// Функция для логирования успешного входа
export const logSuccessfulLogin = async (identifier: string, attemptType: 'email' | 'opt_id'): Promise<void> => {
  try {
    const clientIP = await getClientIP();
    
    // Логируем успешный вход напрямую в таблицу
    await supabase.from('login_attempts').insert({
      identifier,
      ip_address: clientIP,
      attempt_type: attemptType,
      success: true
    });
  } catch (error) {
    console.error('Error logging successful login:', error);
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
