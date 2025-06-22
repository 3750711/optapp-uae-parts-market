
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
import { toast } from "@/components/ui/use-toast";
import { detectInputType, getEmailByOptId, logSuccessfulLogin } from "@/utils/authUtils";
import { Mail, User, Shield, Loader2 } from "lucide-react";
import SimpleCaptcha from "@/components/ui/SimpleCaptcha";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  emailOrOptId: z.string().min(1, { message: "Введите email или OPT ID" }),
  password: z.string().min(1, { message: "Введите пароль" }),
});

type FormData = z.infer<typeof formSchema>;

const Login = () => {
  // ✅ All hooks declared first (before any conditional returns)
  const { user, isLoading, forceAuthReinit } = useAuth();
  const navigate = useNavigate();
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'opt_id' | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrOptId: "",
      password: "",
    }
  });

  const watchedInput = form.watch('emailOrOptId');

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Determine input type in real time
  useEffect(() => {
    if (watchedInput) {
      const type = detectInputType(watchedInput);
      setInputType(type);
    } else {
      setInputType(null);
    }
  }, [watchedInput]);

  // ✅ Conditional returns only after all hooks
  // Show loading while checking authorization
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

  // If user is authenticated, don't show form
  if (user) {
    return null;
  }

  // ✅ Event handlers after conditional returns
  const handleFailedAttempt = () => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);
    
    // Show CAPTCHA after 3 failed attempts
    if (newFailedAttempts >= 3) {
      setShowCaptcha(true);
      setCaptchaVerified(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    // Check CAPTCHA if required
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
      console.log("🔐 Attempting to sign in with:", data.emailOrOptId);
      
      const inputType = detectInputType(data.emailOrOptId);
      let emailToUse = data.emailOrOptId;

      // If OPT ID entered, find corresponding email
      if (inputType === 'opt_id') {
        console.log("🔍 Detected OPT ID, searching for email...");
        const result = await getEmailByOptId(data.emailOrOptId);
        
        if (result.isRateLimited) {
          setIsRateLimited(true);
          toast({
            title: "Слишком много попыток",
            description: "Попробуйте войти через 15 минут",
            variant: "destructive",
          });
          return;
        }
        
        if (!result.email) {
          handleFailedAttempt();
          toast({
            title: "Ошибка входа",
            description: "Неверные учетные данные",
            variant: "destructive",
          });
          return;
        }
        
        emailToUse = result.email;
        console.log("✅ Found email for OPT ID:", emailToUse);
      }

      // Sign in with found email
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: data.password,
      });

      if (error) {
        console.error("❌ Login error:", error);
        handleFailedAttempt();
        
        // Unified error message for all cases
        toast({
          title: "Ошибка входа",
          description: "Неверные учетные данные",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Login successful, user:", authData.user?.email);

      // Force auth reinitialize
      if (forceAuthReinit) {
        console.log('🔄 Forcing auth reinitialize...');
        await forceAuthReinit();
      }

      // Log successful login  
      await logSuccessfulLogin(data.emailOrOptId, inputType);

      // Reset counters after successful login
      setFailedAttempts(0);
      setShowCaptcha(false);
      setCaptchaVerified(false);
      setIsRateLimited(false);

      // Show success message
      toast({
        title: "Вход выполнен успешно",
        description: "Добро пожаловать в partsbay.ae",
      });
      
      // Check URL for "from" parameter for redirect
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from") || "/";

      // Add small delay for auth state update
      setTimeout(() => {
        console.log("🚀 Redirecting to:", from);
        navigate(from);
      }, 500);
      
    } catch (error: any) {
      console.error("💥 Login error:", error);
      handleFailedAttempt();
      
      // Unified error message
      toast({
        title: "Ошибка входа",
        description: "Неверные учетные данные",
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

  const generateRandomOptId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  };

  const getPlaceholderText = () => {
    if (inputType === 'email') return "example@mail.com";
    if (inputType === 'opt_id') return `${generateRandomOptId()}, ${generateRandomOptId()}, ${generateRandomOptId()}...`;
    return `example@mail.com или ${generateRandomOptId()}`;
  };

  // ✅ Main render after all hooks and functions
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Вход в аккаунт</CardTitle>
            <CardDescription>
              Введите свой email или OPT ID для входа в систему
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {isRateLimited && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 text-sm">
                      Превышен лимит попыток входа. Попробуйте через 15 минут.
                    </span>
                  </div>
                )}
                
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
                            disabled={isRateLimited}
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
                        <Input 
                          type="password" 
                          {...field} 
                          disabled={isRateLimited}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showCaptcha && (
                  <SimpleCaptcha
                    isVisible={showCaptcha}
                    onVerify={setCaptchaVerified}
                  />
                )}

                {failedAttempts > 0 && !isRateLimited && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    Неудачных попыток: {failedAttempts}/3
                    {failedAttempts >= 3 && " (требуется CAPTCHA)"}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoadingForm || isRateLimited || (showCaptcha && !captchaVerified)}
                >
                  {isLoadingForm ? "Вход..." : "Войти"}
                </Button>
                <div className="text-center text-sm">
                  Нет аккаунта?{" "}
                  <Link to="/register" className="text-optapp-dark font-medium hover:underline">
                    Зарегистрироваться
                  </Link>
                </div>
                <div className="text-center text-xs text-muted-foreground border-t pt-4">
                  <p>💡 Подсказка: Вы можете войти используя:</p>
                  <p>• Email адрес (example@mail.com)</p>
                  <p>• OPT ID ({generateRandomOptId()}, {generateRandomOptId()}, {generateRandomOptId()} и т.д.)</p>
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
