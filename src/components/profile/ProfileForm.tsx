
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Loader2, User, Phone, MessageCircle, Building2 } from 'lucide-react';

export const ProfileForm: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    opt_id: '',
    phone: '',
    telegram: '',
    company_name: '',
    description_user: '',
    user_type: 'buyer' as 'buyer' | 'seller' | 'admin',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        opt_id: profile.opt_id || '',
        phone: profile.phone || '',
        telegram: profile.telegram || '',
        company_name: profile.company_name || '',
        description_user: profile.description_user || '',
        user_type: (profile.user_type || 'buyer') as 'buyer' | 'seller' | 'admin',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });

      await refreshProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Редактировать профиль
        </CardTitle>
        <CardDescription>
          Обновите информацию о себе
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">ФИО</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Введите ваше полное имя"
              />
            </div>
            <div>
              <Label htmlFor="opt_id">OPT ID</Label>
              <Input
                id="opt_id"
                value={formData.opt_id}
                onChange={(e) => setFormData(prev => ({ ...prev, opt_id: e.target.value }))}
                placeholder="Введите ваш OPT ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (xxx) xxx-xx-xx"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="telegram">Telegram</Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="telegram"
                  value={formData.telegram}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
                  placeholder="@username"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="company_name">Название компании</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Название вашей компании"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="user_type">Тип пользователя</Label>
            <Select 
              value={formData.user_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, user_type: value as 'buyer' | 'seller' | 'admin' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип пользователя" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Покупатель</SelectItem>
                <SelectItem value="seller">Продавец</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description_user">Описание</Label>
            <Textarea
              id="description_user"
              value={formData.description_user}
              onChange={(e) => setFormData(prev => ({ ...prev, description_user: e.target.value }))}
              placeholder="Расскажите о себе..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
