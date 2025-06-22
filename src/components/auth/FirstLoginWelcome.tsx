import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';

const FirstLoginWelcome: React.FC = () => {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [optId, setOptId] = useState('');
  const [telegram, setTelegram] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !optId || !telegram) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          opt_id: optId,
          telegram: telegram,
          description: description,
          updated_at: new Date(),
        })
        .eq('id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Профиль обновлен',
        description: 'Ваш профиль успешно обновлен.',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить профиль.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-full max-w-md p-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Добро пожаловать! <Sparkles className="inline-block h-5 w-5 ml-1" />
          </CardTitle>
          <CardDescription className="text-gray-500 text-center">
            Заполните информацию о себе для продолжения
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="fullName">ФИО</Label>
              <Input
                id="fullName"
                placeholder="Ваше полное имя"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="optId">OPT ID</Label>
              <Input
                id="optId"
                placeholder="Ваш OPT ID"
                type="text"
                value={optId}
                onChange={(e) => setOptId(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                placeholder="Ваш Telegram"
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание (необязательно)</Label>
              <Textarea
                id="description"
                placeholder="Дополнительная информация о себе"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button disabled={isLoading} className="w-full mt-4">
              {isLoading ? (
                <>
                  Сохранение...
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  Сохранить и продолжить <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <Button variant="ghost" onClick={handleSignOut}>
            Выйти
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirstLoginWelcome;
