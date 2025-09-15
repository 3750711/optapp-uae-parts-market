import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isTelegramUser, setIsTelegramUser] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });

  // Check password reset session and user profile
  useEffect(() => {
    const checkResetSession = async () => {
      // Check URL hash parameters first (common for Supabase auth redirects)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      
      // Check both URL search params and hash params
      const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
      const type = searchParams.get('type') || hashParams.get('type');
      
      console.log('Reset password session check:', { 
        hasAccessToken: !!accessToken, 
        type, 
        hashParams: hash ? Object.fromEntries(hashParams.entries()) : null,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !accessToken) {
        console.log('No session and no access token found');
        setIsValidSession(false);
        return;
      }
      
      // Check if this is a password recovery session
      if (type !== 'recovery') {
        console.log('Invalid type for password reset:', type);
        setIsValidSession(false);
        return;
      }
      // Get user profile to check if it's a Telegram user
      let userId = session?.user?.id;
      
      // If no session but we have access token, we need to wait for session establishment
      if (!session && accessToken) {
        console.log('Waiting for session to be established with access token');
        // Give Supabase a moment to process the token from URL
        setTimeout(() => {
          checkResetSession();
        }, 1000);
        return;
      }
      
      if (!userId) {
        console.log('No user ID available');
        setIsValidSession(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUserProfile(profile);
        setIsTelegramUser(!!profile.telegram_id && !profile.has_password);
        console.log('Profile loaded:', { telegram_id: !!profile.telegram_id, has_password: profile.has_password });
      }
      
      setIsValidSession(true);
    };
    
    checkResetSession();
  }, [searchParams]);

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
      if (isTelegramUser && userProfile) {
        await supabase
          .from('profiles')
          .update({ has_password: true })
          .eq('id', userProfile.id);
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

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Проверка ссылки...</span>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show error if session is invalid
  if (!isValidSession) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Ссылка недействительна</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Ссылка для сброса пароля недействительна или истекла.
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
            {isTelegramUser && userProfile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Telegram пользователь:</strong> {userProfile.first_name || userProfile.full_name}
                </p>
                {userProfile.opt_id && (
                  <p className="text-sm text-blue-600">
                    <strong>OPT ID:</strong> {userProfile.opt_id}
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