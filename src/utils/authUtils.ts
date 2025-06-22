
import { supabase } from '@/integrations/supabase/client';

export type InputType = 'email' | 'opt_id';

interface EmailByOptIdResult {
  email: string | null;
  isRateLimited: boolean;
}

interface OptIdCheckResult {
  exists: boolean;
  isRateLimited: boolean;
}

// Функция для определения типа ввода (email или OPT ID)
export const detectInputType = (input: string): InputType => {
  // Проверяем, является ли строка email (содержит @ и точку)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailRegex.test(input)) {
    return 'email';
  }
  
  // Если не email, считаем что это OPT ID
  return 'opt_id';
};

// Функция для получения email по OPT ID с защитой от rate limiting
export const getEmailByOptId = async (optId: string): Promise<EmailByOptIdResult> => {
  try {
    console.log('Searching for email by OPT ID:', optId);
    
    const { data, error } = await supabase.rpc('get_email_by_opt_id', {
      p_opt_id: optId
    });

    if (error) {
      console.error('Error getting email by OPT ID:', error);
      
      // Проверяем, является ли ошибка связанной с rate limiting
      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        return { email: null, isRateLimited: true };
      }
      
      return { email: null, isRateLimited: false };
    }

    console.log('Found email for OPT ID:', data ? '***@***.***' : 'not found');
    return { email: data, isRateLimited: false };
    
  } catch (error) {
    console.error('Unexpected error in getEmailByOptId:', error);
    return { email: null, isRateLimited: false };
  }
};

// Функция для проверки существования OPT ID с правильным типом возврата
export const checkOptIdExists = async (optId: string): Promise<OptIdCheckResult> => {
  try {
    const { data, error } = await supabase.rpc('check_opt_id_exists', {
      p_opt_id: optId
    });

    if (error) {
      console.error('Error checking OPT ID:', error);
      
      // Проверяем на rate limiting
      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        return { exists: false, isRateLimited: true };
      }
      
      return { exists: false, isRateLimited: false };
    }

    return { exists: Boolean(data), isRateLimited: false };
  } catch (error) {
    console.error('Unexpected error in checkOptIdExists:', error);
    return { exists: false, isRateLimited: false };
  }
};

// Функция для логирования успешного входа
export const logSuccessfulLogin = async (identifier: string, inputType: InputType): Promise<void> => {
  try {
    console.log('Logging successful login for:', inputType, identifier);
    
    // Можно добавить запись в таблицу login_attempts или другую логику
    const { error } = await supabase
      .from('login_attempts')
      .insert({
        identifier,
        attempt_type: inputType,
        success: true,
        ip_address: null // В браузере нет доступа к IP
      });

    if (error) {
      console.warn('Failed to log successful login:', error);
    }
  } catch (error) {
    console.warn('Error logging successful login:', error);
  }
};

// Функция для валидации email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Функция для валидации пароля
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Пароль должен содержать не менее 6 символов');
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну букву');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Функция для форматирования времени обратного отсчета
export const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
