
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
      
      // Используем исправленную функцию базы данных
      const { data, error } = await supabase.rpc('create_password_reset_code', {
        p_email: email,
        p_opt_id: null // Для верификации email не передаем opt_id
      });

      if (error) {
        console.error('Ошибка при вызове create_password_reset_code:', error);
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
              verification_code: data.code // Передаем код для отправки
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

  const verifyEmailCode = async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);

    try {
      console.log('Проверка кода для email:', email, 'код:', code);
      
      // Используем новую функцию для проверки кода
      const { data, error } = await supabase.rpc('verify_reset_code', {
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
