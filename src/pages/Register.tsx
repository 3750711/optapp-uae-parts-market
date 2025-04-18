import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
  confirmPassword: z.string(),
  userType: z.enum(["buyer", "seller"]),
  optId: z.string().optional(),
}).refine(data => {
  if (data.optId) {
    return true;
  }
  return !!data.fullName && data.fullName.length >= 2 && !!data.phone && data.phone.length >= 6;
}, {
  message: "Имя должно содержать не менее 2 символов, а телефон - не менее 6 цифр",
  path: ["fullName"],
}).refine(data => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof formSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasOptId, setHasOptId] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      userType: "buyer",
      optId: "",
    }
  });

  const optId = form.watch('optId');
  
  useEffect(() => {
    setHasOptId(!!optId);
  }, [optId]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    console.log("Form data submitting:", data); // Debug: log submitted data
    
    try {
      // Register the user with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName || null,
            user_type: data.userType, // Store user_type in the metadata
            phone: data.phone || null,
            opt_id: data.optId || null,
          }
        }
      });

      if (authError) throw authError;
      
      console.log("Auth data returned:", authData); // Debug: log auth response

      // After successful sign up, ensure the profile is created with the correct user_type
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName || null,
            phone: data.phone || null,
            opt_id: data.optId || null,
            user_type: data.userType, // Explicitly set user_type in profiles table
          }, { 
            onConflict: 'id' 
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      toast({
        title: "Регистрация прошла успешно",
        description: "Проверьте вашу почту для подтверждения email",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Произошла ошибка при регистрации",
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
            <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
            <CardDescription>
              Создайте аккаунт для использования платформы
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="optId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OPT ID (если есть)</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите ваш OPT ID если он у вас есть" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{hasOptId ? 'Имя и фамилия (необязательно)' : 'Имя и фамилия *'}</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите ваше имя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@mail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{hasOptId ? 'Телефон (необязательно)' : 'Телефон *'}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+971 XX XXX XXXX" {...field} />
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
                      <FormLabel>Пароль *</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
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
                      <FormLabel>Повторите пароль *</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип аккаунта *</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4 pt-2"
                        >
                          <div>
                            <RadioGroupItem value="buyer" id="buyer" className="peer sr-only" />
                            <FormLabel
                              htmlFor="buyer"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-optapp-yellow [&:has([data-state=checked])]:border-optapp-yellow cursor-pointer"
                            >
                              <span>Покупатель</span>
                            </FormLabel>
                          </div>
                          <div>
                            <RadioGroupItem value="seller" id="seller" className="peer sr-only" />
                            <FormLabel
                              htmlFor="seller"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-optapp-yellow [&:has([data-state=checked])]:border-optapp-yellow cursor-pointer"
                            >
                              <span>Продавец</span>
                            </FormLabel>
                          </div>
                        </RadioGroup>
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
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
                <div className="text-center text-sm">
                  Уже есть аккаунт?{" "}
                  <Link to="/login" className="text-optapp-dark font-medium hover:underline">
                    Войти
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

export default Register;
