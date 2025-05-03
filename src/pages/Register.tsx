
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { countries } from "@/data/countries";
import { Check, User, Store } from "lucide-react";

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
      telegram: "",
      location: "",
    }
  });

  const optId = form.watch('optId');
  const selectedUserType = form.watch('userType');
  
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
            telegram: data.telegram || null,
            location: data.location,
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
            telegram: data.telegram || null,
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
