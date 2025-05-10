
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const formSchema = z.object({
  email: z.string().email({ message: "Введите корректный email адрес" }),
  password: z.string().min(1, { message: "Введите пароль" }),
});

type FormData = z.infer<typeof formSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      // Выполняем вход без записи в action_logs
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Показываем сообщение об успешном входе
      toast({
        title: "Вход выполнен успешно",
        description: "Добро пожаловать в OPTAPP",
      });
      
      // После успешного входа перенаправляем пользователя
      // Проверяем в URL параметр "from", чтобы перенаправить на нужную страницу
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from") || "/";

      // Перенаправляем пользователя после успешной авторизации
      // Используем большую задержку для предотвращения конфликтов
      setTimeout(() => {
        // Получаем профиль пользователя для определения типа пользователя
        const checkUserType = async () => {
          try {
            // Увеличиваем таймаут для избежания конфликтов с транзакциями
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', authData.user.id)
              .single();

            if (profileError) {
              console.error("Error fetching profile:", profileError);
              navigate(from); // В случае ошибки перенаправляем на исходную страницу
              return;
            }

            // Перенаправляем в зависимости от типа пользователя
            if (profileData?.user_type === 'seller') {
              navigate("/seller/dashboard");
            } else if (profileData?.user_type === 'admin') {
              navigate("/admin");
            } else {
              navigate(from);
            }
          } catch (err) {
            console.error("Error in profile check:", err);
            navigate(from);
          }
        };

        checkUserType();
      }, 1500); // Увеличиваем задержку для предотвращения конфликтов
    } catch (error: any) {
      console.error("Login error:", error);
      // Показываем сообщение об ошибке
      toast({
        title: "Ошибка входа",
        description: "Неверный email или пароль",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Вход в аккаунт</CardTitle>
            <CardDescription>
              Введите свои данные для входа в систему
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@mail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Пароль</FormLabel>
                        <Link to="/forgot-password" className="text-sm text-optapp-dark hover:underline">
                          Забыли пароль?
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoading}
                >
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
                <div className="text-center text-sm">
                  Нет аккаунта?{" "}
                  <Link to="/register" className="text-optapp-dark font-medium hover:underline">
                    Зарегистрироваться
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

export default Login;
