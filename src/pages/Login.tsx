
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
      console.log("Attempting to sign in with email:", data.email);
      
      // Perform the login
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error("Login error:", error);
        
        // Handle specific error cases
        if (error.message.includes("Database error")) {
          toast({
            title: "Ошибка входа",
            description: "Техническая проблема. Попробуйте через несколько секунд.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      // Show success message
      toast({
        title: "Вход выполнен успешно",
        description: "Добро пожаловать в partsbay.ae",
      });
      
      // Check URL for "from" parameter for redirection
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from") || "/";

      // Add a short delay to ensure auth state is properly updated
      setTimeout(() => {
        console.log("Redirecting to:", from);
        navigate(from);
      }, 500);
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Show error message
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
