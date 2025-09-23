import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { authError } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { getProfileTranslations } from '@/utils/profileTranslations';
import { validatePassword } from '@/utils/authUtils';
import { toast } from '@/hooks/use-toast';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
  confirmPassword: z.string().min(1, 'Подтвердите новый пароль'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "Новый пароль должен отличаться от текущего",
  path: ["newPassword"],
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export const PasswordChangeSection: React.FC = () => {
  const { language } = useLanguage();
  const { updatePassword } = useAuth();
  const t = getProfileTranslations(language);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handleSubmit = async (data: PasswordChangeFormData) => {
    setIsChanging(true);

    try {
      // Validate new password strength
      const validation = validatePassword(data.newPassword);
      if (!validation.isValid) {
        toast({
          title: t.passwordChange.weakPassword,
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      // Update password using the auth context method
      const { error } = await updatePassword(data.newPassword);

      if (error) {
        toast({
          title: t.passwordChange.error,
          description: error.message || t.passwordChange.currentPasswordError,
          variant: 'destructive'
        });
      } else {
        toast({
          title: t.passwordChange.success,
          description: t.passwordChange.successDesc,
          variant: 'success'
        });
        form.reset();
      }
    } catch (error) {
      authError('Password change error', error);
      toast({
        title: t.passwordChange.error,
        description: 'Произошла ошибка при смене пароля',
        variant: 'destructive'
      });
    } finally {
      setIsChanging(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {t.passwordChange.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.passwordChange.currentPassword}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder={t.passwordChange.currentPasswordPlaceholder}
                        disabled={isChanging}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('current')}
                        disabled={isChanging}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.passwordChange.newPassword}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showNewPassword ? "text" : "password"}
                        placeholder={t.passwordChange.newPasswordPlaceholder}
                        disabled={isChanging}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('new')}
                        disabled={isChanging}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.passwordChange.confirmPassword}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t.passwordChange.confirmPasswordPlaceholder}
                        disabled={isChanging}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('confirm')}
                        disabled={isChanging}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isChanging}
              className="w-full"
            >
              {isChanging ? t.passwordChange.changing : t.passwordChange.changePassword}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};