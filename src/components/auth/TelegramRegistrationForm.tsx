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

      // Check current auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 AUTH CHECK:', { 
        session_exists: !!session, 
        session_user_id: session?.user?.id,
        target_user_id: userId,
        session_error: sessionError,
        current_time: new Date().toISOString()
      });

      if (!session) {
        console.error('❌ No session found - user not authenticated');
        throw new Error('Ошибка аутентификации: сессия не найдена');
      }

      if (session.user.id !== userId) {
        console.error('❌ User ID mismatch:', {
          session_user_id: session.user.id,
          expected_user_id: userId
        });
        throw new Error('Ошибка аутентификации: неверный пользователь');
      }

      console.log('✅ Auth check passed, starting update process');

      // Prepare update data
      const updateData = {
        full_name: formData.full_name.trim(),
        user_type: formData.user_type,
        profile_completed: true,
        avatar_url: telegramUser.photo_url || null
      };

      console.log('📤 UPDATE DATA:', updateData);

      // Get current profile state for debugging
      const { data: beforeUpdate } = await supabase
        .from('profiles')
        .select('id, profile_completed, full_name, user_type, auth_method')
        .eq('id', userId)
        .single();

      console.log('📋 PROFILE BEFORE UPDATE:', beforeUpdate);

      // Use upsert for more reliable save
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, ...updateData },
          { 
            onConflict: 'id',
            ignoreDuplicates: false
          }
        )
        .select('*');

      console.log('📥 UPSERT RESPONSE:', { 
        data, 
        error,
        affected_rows: data?.length
      });

      if (error) {
        console.error('❌ UPSERT ERROR:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Try regular update as fallback
        console.log('🔄 Trying fallback update...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId)
          .select('*');

        if (fallbackError) {
          console.error('❌ FALLBACK UPDATE ALSO FAILED:', fallbackError);
          throw new Error(`Ошибка сохранения профиля: ${fallbackError.message}`);
        }

        if (!fallbackData || fallbackData.length === 0) {
          throw new Error('Не удалось обновить профиль: нет затронутых строк');
        }

        console.log('✅ Fallback update successful:', fallbackData[0]);
      } else if (!data || data.length === 0) {
        throw new Error('Не удалось обновить профиль: нет данных в ответе');
      }

      // Verification after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('id, profile_completed, full_name, user_type')
        .eq('id', userId)
        .single();

      console.log('🔍 VERIFICATION RESULT:', { 
        verifyData, 
        verifyError
      });

      if (verifyError) {
        console.error('❌ Verification failed:', verifyError);
        throw new Error('Ошибка проверки обновления профиля');
      }

      // Critical field validation
      const missingFields = [];
      if (!verifyData?.profile_completed) missingFields.push('флаг завершения');
      if (!verifyData?.full_name) missingFields.push('полное имя');

      if (missingFields.length > 0) {
        console.error('❌ CRITICAL FIELDS NOT SAVED:', {
          missing: missingFields,
          db_state: verifyData,
          sent_data: updateData
        });
        throw new Error(`Критические поля не сохранены: ${missingFields.join(', ')}`);
      }

      console.log('✅ ALL VERIFICATIONS PASSED:', {
        full_name: verifyData.full_name,
        user_type: verifyData.user_type,
        profile_completed: verifyData.profile_completed
      });

      // Refresh profile context
      await refreshProfile();
      
      console.log('✅ Registration completed successfully');
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