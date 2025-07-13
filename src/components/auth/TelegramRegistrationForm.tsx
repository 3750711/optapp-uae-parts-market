import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TelegramRegistrationFormProps {
  telegramUser: {
    id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
  };
  userId: string;
  authTokens?: {
    email: string;
    temp_password: string;
  } | null;
  onComplete: () => void;
  onError: (error: string) => void;
}

const TelegramRegistrationForm: React.FC<TelegramRegistrationFormProps> = ({
  telegramUser,
  userId,
  authTokens,
  onComplete,
  onError
}) => {
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: telegramUser.first_name,
    user_type: 'buyer' as 'buyer' | 'seller'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        throw new Error('Имя обязательно для заполнения');
      }

      console.log('📤 Starting registration completion with Edge Function...');

      // Call the complete-telegram-registration Edge Function
      const { data: registrationResult, error: registrationError } = await supabase.functions.invoke(
        'complete-telegram-registration',
        {
          body: {
            telegram_data: telegramUser,
            form_data: formData
          }
        }
      );

      console.log('📥 Registration result:', registrationResult);

      if (registrationError) {
        console.error('❌ Registration function error:', registrationError);
        throw new Error('Ошибка при завершении регистрации: ' + registrationError.message);
      }

      if (!registrationResult?.success) {
        console.error('❌ Registration failed:', registrationResult);
        throw new Error(registrationResult?.error || 'Ошибка при завершении регистрации');
      }

      console.log('✅ Registration completed successfully');
      
      // Now sign in with the returned credentials
      if (registrationResult.email && registrationResult.temp_password) {
        console.log('Signing in with new user credentials...');
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: registrationResult.email,
          password: registrationResult.temp_password
        });
        
        if (signInError) {
          console.error('Sign in error after registration:', signInError);
          throw new Error('Ошибка входа после регистрации: ' + signInError.message);
        }
        
        console.log('✅ Signed in successfully after registration');
      }
      
      onComplete();

    } catch (error) {
      console.error('❌ REGISTRATION ERROR:', error);
      onError(error instanceof Error ? error.message : 'Ошибка при завершении регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Завершение регистрации</CardTitle>
        <CardDescription>
          Добро пожаловать, {telegramUser.first_name}! Заполните дополнительные данные для завершения регистрации.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Полное имя *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Введите ваше полное имя"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_type">Тип пользователя *</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value) => handleInputChange('user_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Покупатель</SelectItem>
                <SelectItem value="seller">Продавец</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Завершение регистрации...' : 'Завершить регистрацию'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TelegramRegistrationForm;