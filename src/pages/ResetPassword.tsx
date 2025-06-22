import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Перенаправляем авторизованных пользователей
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Показываем загрузку пока проверяется авторизация
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Проверка авторизации...</span>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Если пользователь авторизован, не показываем форму
  if (user) {
    return null;
  }

  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });

  // Проверяем наличие токена в URL при загрузке
  useEffect(() => {
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    console.log('Reset password tokens:', { access_token: !!access_token, refresh_token: !!refresh_token, type });

    if (type === 'recovery' && access_token && refresh_token) {
      // Устанавливаем сессию с токенами из URL
      supabase.auth.setSession({
        access_token,
        refresh_token,
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error setting session:', error);
          setIsValidToken(false);
          toast({
            title: "Недействительная ссылка",
            description: "Ссылка для сброса пароля недействительна или истекла",
            variant: "destructive",
          });
        } else {
          console.log('Session set successfully:', data);
          setIsValidToken(true);
        }
      });
    } else {
      setIsValidToken(false);
      toast({
        title: "Недействительная ссылка",
        description: "Ссылка для сброса пароля недействительна или отсутствует",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const onSubmit = async (data: FormData) => {
    if (!isValidToken) {
      toast({
        title: "Ошибка",
        description: "Недействительная сессия для сброса пароля",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingForm(true);
    
    try {
      console.log("Attempting to update password...");
      
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error("Password update error:", error);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось обновить пароль",
          variant: "destructive",
        });
        return;
      }

      // Успешно обновлен пароль
      toast({
        title: "Пароль обновлен",
        description: "Ваш пароль успешно изменен. Теперь вы можете войти с новым паролем.",
      });

      // Выходим из системы и перенаправляем на логин
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Пароль успешно изменен. Войдите с новым паролем.' }
        });
      }, 2000);
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при изменении пароля",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Показываем состояние загрузки пока проверяем токен
  if (isValidToken === null) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Проверка ссылки...</CardTitle>
              <CardDescription>
                Пожалуйста, подождите
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  // Показываем ошибку если токен недействительный
  if (isValidToken === false) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Недействительная ссылка</CardTitle>
              <CardDescription>
                Ссылка для сброса пароля недействительна или истекла
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Возможно, ссылка устарела или уже была использована.
                Попробуйте запросить новую ссылку для сброса пароля.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button asChild className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
                <Link to="/forgot-password">
                  Запросить новую ссылку
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">
                  Вернуться к входу
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Новый пароль</CardTitle>
            <CardDescription className="text-center">
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
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Введите новый пароль"
                            {...field}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
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
                      <FormLabel>Подтвердите пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Повторите новый пароль"
                            {...field}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

                <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-1">Требования к паролю:</p>
                  <ul className="space-y-1">
                    <li>• Минимум 6 символов</li>
                    <li>• Хотя бы одна буква</li>
                    <li>• Хотя бы одна цифра</li>
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoadingForm}
                >
                  {isLoadingForm ? "Обновление..." : "Обновить пароль"}
                </Button>
                
                <div className="text-center">
                  <Link to="/login" className="text-sm text-optapp-dark hover:underline">
                    Вернуться к входу
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPassword;
