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

// Password strength checker
const checkPasswordStrength = (password: string) => {
  let score = 0;
  let feedback = [];
  
  if (password.length >= 8) score += 1;
  else feedback.push("минимум 8 символов");
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("заглавная буква");
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("строчная буква");
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("цифра");
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push("специальный символ");
  
  const strength = score === 5 ? "strong" : score >= 3 ? "medium" : "weak";
  
  return { score, strength, feedback };
};

type FormData = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const { isRecoveryMode, validateRecoveryAndResetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<'checking' | 'valid' | 'invalid'>('checking');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });

  // Проверка recovery режима (БЕЗ ожидания авторизации пользователя)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isRecoveryMode) {
        console.log('✅ Valid recovery tokens detected');
        setValidationState('valid');
      } else {
        console.log('❌ No valid recovery tokens');
        setValidationState('invalid');
      }
    }, 100); // Минимальная задержка для инициализации AuthContext
    
    return () => clearTimeout(timer);
  }, [isRecoveryMode]);

  // НОВАЯ функция отправки формы - использует безопасную функцию
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      // Use simplified password reset for now
      const result = await updatePassword(data.password);
      
      if (result.error) {
        const error = result.error;
        
        // Детальная обработка ошибок
        let errorMessage = "Не удалось обновить пароль";
        let errorTitle = "Ошибка";
        
        if (error?.message?.includes("New password should be different")) {
          errorTitle = "Пароль не изменен";
          errorMessage = "Новый пароль должен отличаться от текущего. Попробуйте другой пароль.";
        } else if (error?.message?.includes("session_not_found") || error?.message?.includes("invalid")) {
          errorTitle = "Ссылка истекла";
          errorMessage = "Ссылка для сброса пароля истекла. Запросите новую ссылку.";
          
          setTimeout(() => {
            navigate('/forgot-password', {
              state: { message: 'Ссылка истекла. Запросите новую ссылку для сброса пароля.' }
            });
          }, 3000);
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        
        return;
      }

      // Успех - пароль изменен (пользователь НЕ авторизован)
      toast({
        title: "Пароль успешно изменен",
        description: "Теперь войдите в аккаунт с новым паролем.",
      });

      // Перенаправление на login (пользователь НЕ авторизован)
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Пароль успешно изменен. Войдите с новым паролем.'
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error("Unexpected error:", error);
      
      toast({
        title: "Системная ошибка",
        description: "Произошла неожиданная ошибка при смене пароля",
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
                <h3 className="font-medium">Подготовка формы</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Пожалуйста, подождите...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show error if session is invalid
  if (validationState === 'invalid') {
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

  // Показать форму сброса пароля (пользователь НЕ авторизован)
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Создать новый пароль</CardTitle>
            
            {/* Информационное сообщение о безопасности */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700">
                🔒 После смены пароля вам нужно будет войти в аккаунт заново
              </p>
            </div>
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
                       
                       {/* Password strength indicator */}
                       {(() => {
                         const passwordValue = form.watch('password');
                         if (!passwordValue) return null;
                         
                         const passwordStrength = checkPasswordStrength(passwordValue);
                         
                         return (
                           <div className="mt-2">
                             <div className="flex items-center space-x-2">
                               <div className="flex-1 bg-gray-200 rounded-full h-2">
                                 <div 
                                   className={`h-2 rounded-full transition-all ${
                                     passwordStrength.strength === 'strong' ? 'bg-green-500 w-full' :
                                     passwordStrength.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                                     'bg-red-500 w-1/3'
                                   }`}
                                 />
                               </div>
                               <span className={`text-xs ${
                                 passwordStrength.strength === 'strong' ? 'text-green-600' :
                                 passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                                 'text-red-600'
                               }`}>
                                 {passwordStrength.strength === 'strong' ? 'Надежный' :
                                  passwordStrength.strength === 'medium' ? 'Средний' : 'Слабый'}
                               </span>
                             </div>
                             {passwordStrength.feedback.length > 0 && (
                               <p className="text-xs text-muted-foreground mt-1">
                                 Добавьте: {passwordStrength.feedback.join(', ')}
                               </p>
                             )}
                           </div>
                         );
                       })()}
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