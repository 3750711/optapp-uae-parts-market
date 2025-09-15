import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Lock, Loader2, AlertCircle } from "lucide-react";

const formSchema = z.object({
  password: z.string()
    .min(6, { message: "Пароль должен содержать не менее 6 символов" })
    .regex(/[A-Za-z]/, { message: "Пароль должен содержать хотя бы одну букву" })
    .regex(/[0-9]/, { message: "Пароль должен содержать хотя бы одну цифру" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, status, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<'checking' | 'valid' | 'invalid' | 'timeout'>('checking');
  const [isTelegramUser, setIsTelegramUser] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });

  // Validate reset password session
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const validateResetSession = () => {
      // Check URL parameters for recovery type (simplified)
      const urlType = searchParams.get('type');
      const hasRecoveryType = urlType === 'recovery' || window.location.hash.includes('type=recovery');
      
      console.log('Reset password validation:', { 
        type: urlType || (hasRecoveryType ? 'recovery' : 'unknown'),
        hasAccessToken: window.location.hash.includes('access_token='),
        authStatus: status,
        hasUser: !!user
      });
      
      // Check if this is a recovery session
      if (!hasRecoveryType) {
        console.log('Not a recovery request - invalid');
        setValidationState('invalid');
        return;
      }
      
      // If AuthContext is still loading, wait for it
      if (status === 'checking') {
        console.log('Waiting for AuthContext to establish session...');
        return; // Keep checking state
      }
      
      // If we have a user, session is established
      if (user && status === 'authed') {
        console.log('Valid recovery session established');
        setValidationState('valid');
        
        // Check if user is a Telegram user setting first password
        if (profile) {
          setIsTelegramUser(!!profile.telegram_id && !profile.has_password);
        }
        return;
      }
      
      // If no user after auth loading complete, session is invalid
      if (status === 'guest') {
        console.log('No user session established - invalid reset link');
        setValidationState('invalid');
        return;
      }
    };
    
    // Initial validation
    validateResetSession();
    
    // Set timeout for session establishment (10 seconds)
    timeoutId = setTimeout(() => {
      if (validationState === 'checking') {
        console.warn('Reset password session timeout - forcing invalid state');
        setValidationState('timeout');
      }
    }, 10000);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams, status, user, profile, validationState]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error("Password update error:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить пароль. Попробуйте еще раз.",
          variant: "destructive",
        });
        return;
      }

      // If this is a Telegram user setting their first password, update has_password
      if (isTelegramUser && profile) {
        await supabase
          .from('profiles')
          .update({ has_password: true })
          .eq('id', profile.id);
      }

      toast({
        title: isTelegramUser ? "Пароль установлен" : "Пароль обновлен",
        description: isTelegramUser 
          ? "Ваш первый пароль успешно установлен. Теперь вы можете входить через email и пароль."
          : "Ваш пароль успешно изменен. Теперь вы можете войти.",
      });

      // Redirect to login page
      setTimeout(() => {
        navigate('/login', { 
          state: { message: isTelegramUser 
            ? 'Пароль установлен. Войдите с новым паролем.' 
            : 'Пароль успешно изменен. Войдите с новым паролем.' 
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating session
  if (validationState === 'checking') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-medium">Проверка ссылки сброса пароля</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Устанавливаем безопасное соединение...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show error if session is invalid or timed out
  if (validationState === 'invalid' || validationState === 'timeout') {
    const isTimeout = validationState === 'timeout';
    
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {isTimeout ? 'Время ожидания истекло' : 'Ссылка недействительна'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {isTimeout 
                  ? 'Не удалось установить соединение для сброса пароля. Попробуйте запросить новую ссылку.'
                  : 'Ссылка для сброса пароля недействительна или истекла.'
                }
              </p>
              <Button 
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              >
                Запросить новую ссылку
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isTelegramUser ? "Установить пароль" : "Создать новый пароль"}
            </CardTitle>
            {isTelegramUser && profile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Telegram пользователь:</strong> {profile.first_name || profile.full_name}
                </p>
                {profile.opt_id && (
                  <p className="text-sm text-blue-600">
                    <strong>OPT ID:</strong> {profile.opt_id}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  Вы устанавливаете свой первый пароль для входа через email.
                </p>
              </div>
            )}
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Новый пароль</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Введите новый пароль"
                          {...field}
                          disabled={isLoading}
                        />
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
                      <FormLabel>Подтвердите пароль</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Повторите новый пароль"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardContent className="pt-0">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Обновление пароля...
                    </>
                  ) : (
                    "Обновить пароль"
                  )}
                </Button>
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPassword;