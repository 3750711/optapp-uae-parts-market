
import { supabase } from '@/integrations/supabase/client';

export type InputType = 'email' | 'opt_id';

interface EmailByOptIdResult {
  email: string | null;
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
    
    // Добавляем второй параметр p_ip_address: null для разрешения перегрузки функции
    const { data, error } = await supabase.rpc('get_email_by_opt_id', {
      p_opt_id: optId
    });

    if (error) {
      console.error('Error getting email by OPT ID:', error);
      console.error('Full error details:', error);
      
      // Проверяем, является ли ошибка связанной с rate limiting
      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        return { email: null, isRateLimited: true };
      }
      
      return { email: null, isRateLimited: false };
    }

    console.log('Found email for OPT ID:', data ? '***@***.***' : 'not found');
    console.log('Raw response data:', data);
    return { email: data, isRateLimited: false };
    
  } catch (error) {
    console.error('Unexpected error in getEmailByOptId:', error);
    return { email: null, isRateLimited: false };
  }
};

// Функция для проверки существования OPT ID
export const checkOptIdExists = async (optId: string): Promise<boolean> => {
  try {
    console.log('Checking OPT ID existence:', optId);
    
    // Use the rate-limited version with IP address parameter
    const { data, error } = await supabase.rpc('check_opt_id_exists', {
      p_opt_id: optId,
      p_ip_address: null // Pass null since we don't need rate limiting for generation
    });

    if (error) {
      console.error('Error checking OPT ID:', error);
      // Return true to be safe - will try another ID
      return true;
    }

    console.log('OPT ID check result:', data);
    return Boolean(data);
  } catch (error) {
    console.error('Unexpected error in checkOptIdExists:', error);
    // Return true to be safe - will try another ID
    return true;
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
