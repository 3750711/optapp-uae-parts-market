
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationResult {
  success: boolean;
  message: string;
  debug_code?: string; // Только для тестирования
}

export const useEmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendVerificationCode = async (email: string): Promise<EmailVerificationResult> => {
    setIsLoading(true);
    
    try {
      console.log('Sending verification code to:', email);
      
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/send-email-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`
          },
          body: JSON.stringify({ email })
        }
      );

      const result = await response.json();
      console.log('Send verification response:', result);
      
      return result;
    } catch (error) {
      console.error('Error sending verification code:', error);
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
      console.log('Verifying code for email:', email, 'code:', code);
      
      const { data, error } = await supabase.rpc('verify_email_code', {
        p_email: email,
        p_code: code
      });

      if (error) {
        console.error('Error verifying code:', error);
        return {
          success: false,
          message: 'Произошла ошибка при проверке кода'
        };
      }

      console.log('Verification result:', data);
      return data;
    } catch (error) {
      console.error('Error verifying code:', error);
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
