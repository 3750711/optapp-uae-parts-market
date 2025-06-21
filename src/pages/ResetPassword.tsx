
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const passwordSchema = z.object({
  password: z.string()
    .min(6, { message: "Пароль должен содержать не менее 6 символов" })
    .regex(/[A-Za-z]/, { message: "Пароль должен содержать хотя бы одну букву" })
    .regex(/[0-9]/, { message: "Пароль должен содержать хотя бы одну цифру" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });

  // Проверяем токен при загрузке страницы
  useEffect(() => {
    const checkToken = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      if (!accessToken || !refreshToken) {
        console.log('Missing tokens in URL');
        setIsValidToken(false);
        return;
      }

      try {
        // Устанавливаем сессию с полученными токенами
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('Error setting session:', error);
          setIsValidToken(false);
          return;
        }

        if (data.session) {
          console.log('Session established for password reset');
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      } catch (error) {
        console.error('Exception checking token:', error);
        setIsValidToken(false);
      }
    };

    checkToken();
  }, [searchParams]);

  // Перенаправляем авторизованных пользователей (кроме случая сброса пароля)
  useEffect(() => {
    if (!isLoading && user && isValidToken === false) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate, isValidToken]);

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoadingForm(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error('Password update error:', error);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось изменить пароль",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Пароль изменен",
        description: "Ваш пароль успешно изменен. Теперь вы можете войти с новым паролем.",
      });

      // Выходим из системы, чтобы пользователь вошел с новым паролем
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Пароль успешно изменен. Войдите с новым паролем.' }
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при изменении пароля",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Показываем загрузку пока проверяется токен
  if (isValidToken === null || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Проверка ссылки для сброса пароля...</span>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Показываем ошибку если токен недействителен
  if (isValidToken === false) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-red-600">
                Ссылка недействительна
              </CardTitle>
              <CardDescription>
                Ссылка для сброса пароля истекла или повреждена
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Попробуйте запросить новую ссылку для сброса пароля
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate('/forgot-password')}
                  className="flex-1 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                >
                  Запросить новую ссылку
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  К входу
                </Button>
              </div>
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
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Новый пароль</CardTitle>
            <CardDescription>
              Введите новый пароль для вашего аккаунта
            </CardDescription>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                    disabled={isLoadingForm}
                  >
                    {isLoadingForm ? "Изменение пароля..." : "Изменить пароль"}
                  </Button>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/login')}
                    variant="link" 
                    className="text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Вернуться к входу
                  </Button>
                </div>
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPassword;
