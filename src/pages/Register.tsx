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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { countries } from "@/data/countries";
import { Check, User, Store, AlertCircle, Loader2 } from "lucide-react";
import { checkOptIdExists } from "@/utils/authUtils";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
  confirmPassword: z.string(),
  userType: z.enum(["buyer", "seller"]),
  optId: z.string().optional(),
  telegram: z.string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      return /^@[^@]+$/.test(value);
    }, { 
      message: "Telegram username должен начинаться с одного @ символа" 
    }),
  location: z.string().min(2, { message: "Укажите местоположение" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof formSchema>;

const Register = () => {
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
  const [hasOptId, setHasOptId] = useState(false);
  const [optIdStatus, setOptIdStatus] = useState<'checking' | 'available' | 'taken' | 'rate_limited' | null>(null);
  
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
      telegram: "",
      location: "",
    }
  });

  const optId = form.watch('optId');
  const selectedUserType = form.watch('userType');
  
  useEffect(() => {
    setHasOptId(!!optId);
  }, [optId]);

  // Проверяем уникальность OPT ID при вводе
  useEffect(() => {
    const checkOptId = async () => {
      if (optId && optId.length > 2) {
        setOptIdStatus('checking');
        const result = await checkOptIdExists(optId);
        
        if (result.isRateLimited) {
          setOptIdStatus('rate_limited');
        } else {
          setOptIdStatus(result.exists ? 'taken' : 'available');
        }
      } else {
        setOptIdStatus(null);
      }
    };

    const timeoutId = setTimeout(checkOptId, 500);
    return () => clearTimeout(timeoutId);
  }, [optId]);

  const onSubmit = async (data: FormData) => {
    setIsLoadingForm(true);
    console.log("Form data submitting:", data);
    
    // Дополнительная проверка уникальности OPT ID перед отправкой
    if (data.optId && optIdStatus === 'taken') {
      toast({
        title: "Ошибка регистрации",
        description: "Этот OPT ID уже используется",
        variant: "destructive",
      });
      setIsLoadingForm(false);
      return;
    }
    
    try {
      console.log("Attempting to register user with email:", data.email);
      
      // Регистрируем пользователя через Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName || null,
            user_type: data.userType,
            phone: data.phone || null,
            opt_id: data.optId || null,
            telegram: data.telegram || null,
            location: data.location,
          }
        }
      });

      if (authError) throw authError;
      
      console.log("Registration successful:", authData);

      // Убеждаемся, что данные профиля также обновлены напрямую
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: data.fullName || null,
            user_type: data.userType,
            phone: data.phone || null,
            opt_id: data.optId || null,
            telegram: data.telegram || null,
            location: data.location,
          })
          .eq('id', authData.user.id);
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }

      toast({
        title: "Регистрация прошла успешно",
        description: data.optId 
          ? `Проверьте вашу почту для подтверждения email. OPT ID: ${data.optId}`
          : "Проверьте вашу почту для подтверждения email",
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
      setIsLoadingForm(false);
    }
  };

  const getOptIdStatusIcon = () => {
    switch (optIdStatus) {
      case 'checking':
        return <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />;
      case 'available':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'taken':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'rate_limited':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getOptIdStatusText = () => {
    switch (optIdStatus) {
      case 'checking':
        return "Проверяем доступность...";
      case 'available':
        return "✓ OPT ID доступен";
      case 'taken':
        return "✗ OPT ID уже используется";
      case 'rate_limited':
        return "⚠ Слишком много запросов, попробуйте позже";
      default:
        return null;
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
                        <div className="relative">
                          <Input 
                            placeholder="Введите ваш OPT ID если он у вас есть" 
                            {...field} 
                            className="pr-10"
                          />
                          {getOptIdStatusIcon() && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {getOptIdStatusIcon()}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {optIdStatus && (
                        <p className={`text-xs ${
                          optIdStatus === 'available' ? 'text-green-600' :
                          optIdStatus === 'taken' ? 'text-red-600' : 
                          optIdStatus === 'rate_limited' ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          {getOptIdStatusText()}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{hasOptId ? 'Имя (необязательно)' : 'Имя *'}</FormLabel>
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
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            className={`flex flex-col items-center justify-center h-24 border-2 ${
                              field.value === "buyer" 
                                ? "border-optapp-yellow bg-yellow-50" 
                                : "border-muted hover:border-optapp-yellow"
                            }`}
                            onClick={() => form.setValue("userType", "buyer")}
                          >
                            <User className={`h-8 w-8 mb-2 ${field.value === "buyer" ? "text-optapp-yellow" : ""}`} />
                            <span>Покупатель</span>
                            {field.value === "buyer" && (
                              <Check className="absolute top-2 right-2 h-4 w-4 text-optapp-yellow" />
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            className={`flex flex-col items-center justify-center h-24 border-2 ${
                              field.value === "seller" 
                                ? "border-optapp-yellow bg-yellow-50" 
                                : "border-muted hover:border-optapp-yellow"
                            }`}
                            onClick={() => form.setValue("userType", "seller")}
                          >
                            <Store className={`h-8 w-8 mb-2 ${field.value === "seller" ? "text-optapp-yellow" : ""}`} />
                            <span>Продавец</span>
                            {field.value === "seller" && (
                              <Check className="absolute top-2 right-2 h-4 w-4 text-optapp-yellow" />
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
                  name="telegram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram username (если есть)</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите ваш Telegram username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Местоположение *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите страну" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoadingForm || optIdStatus === 'taken' || optIdStatus === 'rate_limited'}
                >
                  {isLoadingForm ? "Регистрация..." : "Зарегистрироваться"}
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
