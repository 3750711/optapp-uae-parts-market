import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    phone: '',
    user_type: 'buyer' as 'buyer' | 'seller',
    location: '',
    company_name: '',
    description_user: ''
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
      if (!formData.phone.trim()) {
        throw new Error('Телефон обязателен для заполнения');
      }
      if (!formData.location.trim()) {
        throw new Error('Местоположение обязательно для заполнения');
      }

      // Check current auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Current auth session:', { 
        session_exists: !!session, 
        session_user_id: session?.user?.id,
        target_user_id: userId,
        session_error: sessionError 
      });

      if (!session || session.user.id !== userId) {
        console.error('❌ Auth mismatch or no session:', {
          has_session: !!session,
          session_user_id: session?.user?.id,
          target_user_id: userId
        });
        throw new Error('Ошибка аутентификации: пользователь не авторизован');
      }

      console.log('🔄 Starting profile update for user:', userId);
      console.log('📝 Form data being sent:', {
        full_name: formData.full_name,
        phone: formData.phone,
        user_type: formData.user_type,
        location: formData.location,
        company_name: formData.company_name,
        description_user: formData.description_user
      });

      // Update user profile with explicit profile_completed flag
      const updateData = {
        ...formData,
        profile_completed: true,
        avatar_url: telegramUser.photo_url || null
      };

      console.log('📤 Complete update object being sent:', updateData);

      // First, let's check current profile state
      const { data: currentProfile, error: currentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📋 Current profile before update:', { currentProfile, currentError });

      const { data, error, count } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('*');

      console.log('📥 Update response details:', { 
        data, 
        error, 
        count,
        data_length: data?.length 
      });

      if (error) {
        console.error('❌ Profile update error details:', {
          error_message: error.message,
          error_code: error.code,
          error_details: error.details,
          error_hint: error.hint
        });
        throw new Error(`Ошибка обновления профиля: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('❌ Profile update failed: no rows affected');
        throw new Error('Не удалось обновить профиль: профиль не найден');
      }

      console.log('✅ Profile updated successfully:', data[0]);

      // Wait a moment and verify the update was saved
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('profile_completed, full_name, phone, location, user_type, company_name, description_user')
        .eq('id', userId)
        .single();

      console.log('🔍 DETAILED Profile verification after update:', { 
        verifyData, 
        verifyError,
        phone_saved: verifyData?.phone,
        location_saved: verifyData?.location,
        profile_completed_saved: verifyData?.profile_completed
      });

      if (verifyError) {
        console.error('❌ Profile verification error:', verifyError);
        throw new Error('Ошибка при проверке обновления профиля');
      }

      // Check if the critical fields were actually saved
      if (!verifyData?.phone || !verifyData?.location) {
        console.error('❌ Critical fields not saved:', {
          phone_in_db: verifyData?.phone,
          location_in_db: verifyData?.location,
          sent_phone: formData.phone,
          sent_location: formData.location
        });
        throw new Error('Ошибка: важные поля (телефон/местоположение) не были сохранены');
      }

      if (!verifyData?.profile_completed) {
        console.error('❌ Profile not marked as completed:', verifyData);
        throw new Error('Ошибка: профиль не был помечен как завершенный');
      }

      console.log('✅ All verifications passed:', {
        phone: verifyData.phone,
        location: verifyData.location,
        profile_completed: verifyData.profile_completed
      });

      // Refresh profile data in context
      await refreshProfile();
      
      console.log('✅ Registration completion successful');
      onComplete();
    } catch (error) {
      console.error('❌ Error completing registration:', error);
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
            <Label htmlFor="phone">Телефон *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+971501234567"
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

          <div className="space-y-2">
            <Label htmlFor="location">Местоположение *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Дубай, Шарджа, Абу-Даби..."
              required
            />
          </div>

          {formData.user_type === 'seller' && (
            <div className="space-y-2">
              <Label htmlFor="company_name">Название компании</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Название вашей компании"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description_user">Описание (опционально)</Label>
            <Textarea
              id="description_user"
              value={formData.description_user}
              onChange={(e) => handleInputChange('description_user', e.target.value)}
              placeholder="Расскажите о себе или своей деятельности"
              rows={3}
            />
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