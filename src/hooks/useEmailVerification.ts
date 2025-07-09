
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationResult {
  success: boolean;
  message: string;
  code?: string; // Только для отладки
  old_email?: string; // Для смены email
  new_email?: string; // Для смены email
}

export const useEmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendVerificationCode = async (email: string, context: string = 'registration'): Promise<EmailVerificationResult> => {
    setIsLoading(true);
    
    try {
      console.log('Отправка кода верификации на:', email);
      
      // Используем новую функцию для email verification
      const { data, error } = await supabase.rpc('send_email_verification_code', {
        p_email: email,
        p_ip_address: null,
        p_context: context
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
        const response = await fetch(
          `${supabase.supabaseUrl}/functions/v1/send-email-verification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabase.supabaseKey}`
            },
            body: JSON.stringify({ 
              email,
              verification_code: data.code, // Передаем код для отправки
              context: context
            })
          }
        );

        const emailResult = await response.json();
        console.log('Результат отправки email:', emailResult);
        
        if (emailResult.success) {
          return {
            success: true,
            message: `Код подтверждения отправлен на ${email}`,
            code: data.code // Для отладки
          };
        } else {
          return {
            success: false,
            message: emailResult.message || 'Не удалось отправить код на email'
          };
        }
      } else {
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

  const verifyEmailCode = async (email: string, code: string, context: string = 'registration'): Promise<{ success: boolean; message: string; old_email?: string; new_email?: string }> => {
    setIsLoading(true);

    try {
      console.log('Проверка кода для email:', email, 'код:', code);
      
      // Используем новую функцию для проверки email verification кода
      const { data, error } = await supabase.rpc('verify_email_verification_code', {
        p_email: email,
        p_code: code,
        p_context: context
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
        message: data.message,
        old_email: data.old_email,
        new_email: data.new_email
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
