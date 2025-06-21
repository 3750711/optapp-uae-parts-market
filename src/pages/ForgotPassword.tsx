
import React, { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { detectInputType, getEmailByOptId } from "@/utils/authUtils";
import { Mail, User, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import SimpleCaptcha from "@/components/ui/SimpleCaptcha";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  emailOrOptId: z.string().min(1, { message: "Введите email или OPT ID" }),
});

const codeSchema = z.object({
  code: z.string()
    .min(6, { message: "Код должен содержать 6 цифр" })
    .max(6, { message: "Код должен содержать 6 цифр" })
    .regex(/^\d{6}$/, { message: "Код должен содержать только цифры" }),
  newPassword: z.string()
    .min(6, { message: "Пароль должен содержать не менее 6 символов" })
    .regex(/[A-Za-z]/, { message: "Пароль должен содержать хотя бы одну букву" })
    .regex(/[0-9]/, { message: "Пароль должен содержать хотя бы одну цифру" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

const ForgotPassword = () => {
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
  const [inputType, setInputType] = useState<'email' | 'opt_id' | null>(null);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [sentToEmail, setSentToEmail] = useState<string>("");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrOptId: "",
    }
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const watchedInput = form.watch('emailOrOptId');

  // Определяем тип ввода в реальном времени
  React.useEffect(() => {
    if (watchedInput) {
      const type = detectInputType(watchedInput);
      setInputType(type);
    } else {
      setInputType(null);
    }
  }, [watchedInput]);

  const handleFailedAttempt = () => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);
    
    // Показываем CAPTCHA после 2 неудачных попыток
    if (newFailedAttempts >= 2) {
      setShowCaptcha(true);
      setCaptchaVerified(false);
    }
  };

  const onSubmitEmail = async (data: FormData) => {
    // Проверяем CAPTCHA если она требуется
    if (showCaptcha && !captchaVerified) {
      toast({
        title: "Необходима проверка",
        description: "Пожалуйста, пройдите проверку CAPTCHA",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingForm(true);
    
    try {
      console.log("Attempting password reset for:", data.emailOrOptId);
      
      const inputType = detectInputType(data.emailOrOptId);
      let emailToUse = data.emailOrOptId;
      let optId: string | undefined;

      // Если введен OPT ID, найдем соответствующий email
      if (inputType === 'opt_id') {
        console.log("Detected OPT ID, searching for email...");
        const result = await getEmailByOptId(data.emailOrOptId);
        
        if (result.isRateLimited) {
          toast({
            title: "Слишком много попыток",
            description: "Попробуйте через 15 минут",
            variant: "destructive",
          });
          return;
        }
        
        if (!result.email) {
          handleFailedAttempt();
          toast({
            title: "Ошибка",
            description: "OPT ID не найден",
            variant: "destructive",
          });
          return;
        }
        
        emailToUse = result.email;
        optId = data.emailOrOptId;
        console.log("Found email for OPT ID:", emailToUse);
      }

      // Отправляем запрос на наш кастомный Edge Function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          email: emailToUse,
          optId: optId
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Password reset error:", result);
        handleFailedAttempt();
        
        toast({
          title: "Ошибка",
          description: result.message || "Не удалось отправить код для сброса пароля",
          variant: "destructive",
        });
        return;
      }

      // Успешно отправлено
      setSentToEmail(emailToUse);
      
      // Очищаем форму кода перед переходом к шагу ввода кода
      codeForm.reset({
        code: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setStep('code');
      setFailedAttempts(0);
      setShowCaptcha(false);
      setCaptchaVerified(false);

      toast({
        title: "Код отправлен",
        description: `Код для сброса пароля отправлен на ${emailToUse}`,
      });
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      handleFailedAttempt();
      
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке кода",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForm(false);
    }
  };

  const onSubmitCode = async (data: CodeFormData) => {
    setIsLoadingForm(true);
    
    try {
      console.log("Verifying reset code...");
      
      // Проверяем код и сбрасываем пароль
      const { data: verifyData, error } = await supabase.rpc('verify_and_reset_password', {
        p_email: sentToEmail,
        p_code: data.code,
        p_new_password: data.newPassword
      });

      if (error) {
        console.error("Code verification error:", error);
        toast({
          title: "Ошибка",
          description: error.message || "Неверный или истекший код",
          variant: "destructive",
        });
        return;
      }

      if (!verifyData?.success) {
        toast({
          title: "Ошибка",
          description: verifyData?.message || "Неверный или истекший код",
          variant: "destructive",
        });
        return;
      }

      // Успешно сброшен пароль
      toast({
        title: "Пароль изменен",
        description: "Ваш пароль успешно изменен. Теперь вы можете войти с новым паролем.",
      });

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

  const getInputIcon = () => {
    if (inputType === 'email') return <Mail className="h-4 w-4 text-green-500" />;
    if (inputType === 'opt_id') return <User className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getPlaceholderText = () => {
    if (inputType === 'email') return "example@mail.com";
    if (inputType === 'opt_id') return "ABC, DEF, GHI...";
    return "example@mail.com или ABC";
  };

  if (step === 'code') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Введите код</CardTitle>
              <CardDescription>
                Код отправлен на {sentToEmail}
              </CardDescription>
            </CardHeader>
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(onSubmitCode)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Код подтверждения (6 цифр)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="text-center text-xl tracking-widest font-mono"
                            {...field}
                            onChange={(e) => {
                              // Разрешаем только цифры
                              const numericValue = e.target.value.replace(/[^0-9]/g, '');
                              field.onChange(numericValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={codeForm.control}
                    name="newPassword"
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
                    control={codeForm.control}
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
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                    disabled={isLoadingForm}
                  >
                    {isLoadingForm ? "Изменение пароля..." : "Изменить пароль"}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      // Очищаем форму кода при возвращении назад
                      codeForm.reset({
                        code: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setStep('email');
                    }}
                    variant="outline" 
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Вернуться назад
                  </Button>
                </CardFooter>
              </form>
            </Form>
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
            <CardTitle className="text-2xl font-bold">Забыли пароль?</CardTitle>
            <CardDescription>
              Введите свой email или OPT ID, и мы отправим код для сброса пароля
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEmail)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailOrOptId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email или OPT ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="text" 
                            placeholder={getPlaceholderText()}
                            {...field} 
                            className="pr-10"
                          />
                          {getInputIcon() && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {getInputIcon()}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {inputType && (
                        <p className="text-xs text-muted-foreground">
                          {inputType === 'email' 
                            ? "✓ Определен как email адрес" 
                            : "✓ Определен как OPT ID"}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {showCaptcha && (
                  <SimpleCaptcha
                    isVisible={showCaptcha}
                    onVerify={setCaptchaVerified}
                  />
                )}

                {failedAttempts > 0 && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    Неудачных попыток: {failedAttempts}/2
                    {failedAttempts >= 2 && " (требуется CAPTCHA)"}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoadingForm || (showCaptcha && !captchaVerified)}
                >
                  {isLoadingForm ? "Отправка..." : "Отправить код"}
                </Button>
                
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <Link to="/login" className="text-optapp-dark hover:underline">
                    <ArrowLeft className="h-4 w-4 inline mr-1" />
                    Вернуться к входу
                  </Link>
                  <span className="text-muted-foreground">|</span>
                  <Link to="/register" className="text-optapp-dark hover:underline">
                    Регистрация
                  </Link>
                </div>
                
                <div className="text-center text-xs text-muted-foreground border-t pt-4">
                  <p>💡 Подсказка: Вы можете использовать:</p>
                  <p>• Email адрес (example@mail.com)</p>
                  <p>• OPT ID (ABC, DEF, GHI и т.д.)</p>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
