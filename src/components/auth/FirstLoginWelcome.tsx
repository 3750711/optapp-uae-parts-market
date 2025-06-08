
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { User, Lock, Mail, Shield, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FirstLoginWelcomeProps {
  isOpen: boolean;
  onClose: (completed: boolean) => void;
}

const FirstLoginWelcome = ({ isOpen, onClose }: FirstLoginWelcomeProps) => {
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeStep, setEmailChangeStep] = useState<'form' | 'sent' | 'skip'>('form');

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast({
        title: "Пароль слишком короткий",
        description: "Пароль должен содержать минимум 8 символов",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Пароли не совпадают",
        description: "Проверьте правильность ввода паролей",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Устанавливаем флаг завершения первого входа
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ first_login_completed: true })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      setPasswordChanged(true);
      await refreshProfile();

      toast({
        title: "Пароль успешно изменен",
        description: "Теперь вы можете входить с новым паролем",
      });

      setStep(2);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Ошибка при смене пароля",
        description: error.message || "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Некорректный email",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Отправляем письмо для подтверждения нового email
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/` }
      );

      if (error) throw error;

      setEmailChangeStep('sent');

      toast({
        title: "Письмо отправлено",
        description: `Проверьте почту ${newEmail} для подтверждения`,
      });
    } catch (error: any) {
      console.error('Error changing email:', error);
      toast({
        title: "Ошибка при смене email",
        description: error.message || "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onClose(true);
  };

  const handleSkipEmail = () => {
    setEmailChangeStep('skip');
    handleComplete();
  };

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-optapp-yellow" />
            Добро пожаловать в partsbay.ae!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={step === 1 ? 50 : 100} className="w-full" />
          
          {/* Информация о пользователе */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Ваши данные
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">OPT ID:</span> {profile.opt_id || 'Не указан'}
                </div>
                <div>
                  <span className="font-medium">Имя:</span> {profile.full_name || 'Не указано'}
                </div>
                <div>
                  <span className="font-medium">Телефон:</span> {profile.phone || 'Не указан'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {profile.email}
                </div>
              </div>
            </CardContent>
          </Card>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5" />
                  Шаг 1 из 2: Смена пароля (обязательно)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Для безопасности необходимо сменить временный пароль на новый.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newPassword">Новый пароль</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  disabled={!newPassword || !confirmPassword || isLoading}
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                >
                  {isLoading ? "Обновление..." : "Сменить пароль"}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Шаг 2 из 2: Смена email (опционально)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailChangeStep === 'form' && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Рекомендуем сменить email с @g.com на ваш настоящий email адрес для получения уведомлений.
                    </p>
                    
                    <div>
                      <Label htmlFor="newEmail">Новый email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="your@email.com"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handleEmailChange}
                        disabled={!newEmail || isLoading}
                        className="flex-1 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                      >
                        {isLoading ? "Отправка..." : "Изменить email"}
                      </Button>
                      
                      <Button 
                        onClick={handleSkipEmail}
                        variant="outline"
                        disabled={isLoading}
                        className="flex-1"
                      >
                        Изменить позже
                      </Button>
                    </div>
                  </>
                )}

                {emailChangeStep === 'sent' && (
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <div>
                      <h3 className="font-medium">Письмо отправлено!</h3>
                      <p className="text-sm text-muted-foreground">
                        Проверьте почту {newEmail} и перейдите по ссылке для подтверждения.
                      </p>
                    </div>
                    <Button onClick={handleComplete} className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
                      Завершить настройку
                    </Button>
                  </div>
                )}

                {emailChangeStep === 'skip' && (
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-optapp-yellow mx-auto" />
                    <div>
                      <h3 className="font-medium">Настройка завершена!</h3>
                      <p className="text-sm text-muted-foreground">
                        Вы можете изменить email позже в настройках профиля.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {passwordChanged && step === 1 && (
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-green-600">Пароль успешно изменен!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstLoginWelcome;
