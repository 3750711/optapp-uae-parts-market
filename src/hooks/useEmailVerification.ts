
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationResult {
  success: boolean;
  message: string;
  code?: string; // Только для отладки
}

export const useEmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendVerificationCode = async (email: string): Promise<EmailVerificationResult> => {
    setIsLoading(true);
    
    try {
      console.log('Отправка кода верификации на:', email);
      
      // Используем упрощенную функцию для email verification
      const { data, error } = await supabase.rpc('send_email_verification_code', {
        p_email: email,
        p_ip_address: null
      });

      if (error) {
        console.error('Ошибка при вызове send_email_verification_code:', error);
        return {
          success: false,
          message: 'Произошла ошибка при создании кода'
        };
      }

      console.log('Результат создания кода:', data);

      // Если код создан успешно, отправляем email через Edge Function
      if (data.success) {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-email-verification',
          {
            body: { 
              email,
              verification_code: data.code
            }
          }
        );

        console.log('Результат отправки email:', emailResult);
        
        if (emailError) {
          console.error('Ошибка при отправке email:', emailError);
          return {
            success: false,
            message: 'Не удалось отправить код на email'
          };
        }
        
        if (emailResult?.success) {
          return {
            success: true,
            message: `Код подтверждения отправлен на ${email}`,
            code: data.code // Для отладки
          };
        } else {
          return {
            success: false,
            message: emailResult?.message || 'Не удалось отправить код на email'
          };
        }
      } else {
        // Проверяем если это ошибка rate limit
        if (data.message && data.message.toLowerCase().includes('слишком много')) {
          return {
            success: false,
            message: 'Слишком много попыток отправки. Попробуйте позже (до 1 часа).'
          };
        }
        return {
          success: false,
          message: data.message || 'Не удалось создать код верификации'
        };
      }
      
    } catch (error) {
      console.error('Ошибка при отправке кода верификации:', error);
      return {
        success: false,
        message: 'Произошла ошибка при отправке кода'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);

    try {
      console.log('Проверка кода для email:', email, 'код:', code);
      
      // Используем упрощенную функцию для проверки email verification кода
      const { data, error } = await supabase.rpc('verify_email_verification_code', {
        p_email: email,
        p_code: code
      });

      if (error) {
        console.error('Ошибка при проверке кода:', error);
        return {
          success: false,
          message: 'Произошла ошибка при проверке кода'
        };
      }

      console.log('Результат проверки:', data);
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Ошибка при проверке кода:', error);
      return {
        success: false,
        message: 'Произошла ошибка при проверке кода'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendVerificationCode,
    verifyEmailCode,
    isLoading
  };
};
