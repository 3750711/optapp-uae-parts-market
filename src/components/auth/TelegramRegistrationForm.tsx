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
    last_name?: string;
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

      console.log('🚀 Starting Telegram registration process with frontend...');
      
      // Generate email from Telegram data
      const generateEmailFromTelegram = (telegramData: any): string => {
        const telegramId = telegramData.id;
        
        // Try username first (if available and valid)
        if (telegramData.username && telegramData.username.trim().length > 0) {
          const cleanUsername = telegramData.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          if (cleanUsername.length >= 3) {
            return `${cleanUsername}.${telegramId}@telegram.partsbay.ae`;
          }
        }
        
        // Fallback to first_name + telegram_id
        if (telegramData.first_name && telegramData.first_name.trim().length > 0) {
          const cleanFirstName = telegramData.first_name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          if (cleanFirstName.length >= 2) {
            return `${cleanFirstName}.${telegramId}@telegram.partsbay.ae`;
          }
        }
        
        // Ultimate fallback
        return `user.${telegramId}@telegram.partsbay.ae`;
      };

      const generatedEmail = generateEmailFromTelegram(telegramUser);
      console.log('Generated email:', generatedEmail);

      // Use supabase.auth.signUp with metadata - this will trigger the handle_new_user trigger
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: generatedEmail,
        password: crypto.randomUUID() + Date.now().toString(), // Random password
        options: {
          data: {
            auth_method: 'telegram',
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username,
            telegram_first_name: telegramUser.first_name,
            telegram_last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            full_name: formData.full_name.trim(),
            user_type: formData.user_type
          }
        }
      });

      if (signUpError) {
        console.error('❌ Sign up error:', signUpError);
        throw new Error(`Ошибка при регистрации: ${signUpError.message}`);
      }

      if (!authData.user) {
        throw new Error('Пользователь не был создан');
      }

      console.log('✅ User created successfully:', authData.user.id);
      
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