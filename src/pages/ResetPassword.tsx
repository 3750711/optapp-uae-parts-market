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
  const { user, status, profile, updatePassword, isRecoveryMode, clearRecoveryMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<'checking' | 'valid' | 'invalid' | 'timeout'>('checking');
  const [showInvalidAfterDelay, setShowInvalidAfterDelay] = useState(false);
  const [isTelegramUser, setIsTelegramUser] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });

  // Validate reset password session
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const validateResetSession = () => {
      console.log('🔍 [ResetPassword] Validating reset session', { 
        isRecoveryMode,
        authStatus: status,
        hasUser: !!user,
        validationMethod: 'recovery_flag',
        currentUrl: window.location.href
      });
      
      // Fallback: проверяем URL напрямую, если AuthContext еще загружается
      const hasRecoveryInUrl = () => {
        try {
          const hash = window.location.hash?.substring(1);
          if (hash) {
            const params = new URLSearchParams(hash);
            if (params.get('type') === 'recovery' && params.get('access_token')) {
              return true;
            }
          }
          
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('type') === 'recovery' && urlParams.get('token')) {
            return true;
          }
          
          return false;
        } catch {
          return false;
        }
      };
      
      // Если контекст еще загружается, проверяем URL напрямую как fallback
      if (status === 'checking') {
        if (hasRecoveryInUrl()) {
          console.log('🔍 [ResetPassword] Recovery tokens detected in URL (fallback check)');
          setValidationState('checking');
        } else if (!isRecoveryMode) {
          console.log('⏳ [ResetPassword] Waiting for AuthContext to process recovery mode...');
          setValidationState('checking');
        }
        return;
      }
      
      // Use recovery mode flag instead of URL parsing
      if (!isRecoveryMode) {
        console.log('❌ [ResetPassword] Not in recovery mode');
        setValidationState('invalid');
        return;
      }
      
      // If we have a user, session is established
      if (user && status === 'authed') {
        console.log('✅ [ResetPassword] Valid recovery session established');
        setValidationState('valid');
        
        // Check if user is a Telegram user setting first password
        if (profile) {
          setIsTelegramUser(!!profile.telegram_id && !profile.has_password);
        }
        return;
      }
      
      // If no user after auth loading complete, session is invalid
      if (status === 'guest') {
        console.log('❌ [ResetPassword] No user session established - invalid reset link');
        setValidationState('invalid');
        return;
      }
    };
    
    // Initial validation
    validateResetSession();
    
    // Set timeout for session establishment (10 seconds)
    timeoutId = setTimeout(() => {
      if (validationState === 'checking') {
        console.warn('Reset password session timeout - forcing invalid state');
        setValidationState('timeout');
      }
    }, 10000);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [status, user, profile, validationState, isRecoveryMode]);

  // Handle delayed error display to fix race condition
  useEffect(() => {
    if (validationState === 'invalid') {
      const timer = setTimeout(() => {
        setShowInvalidAfterDelay(true);
      }, 1000); // Увеличенная задержка для исправления race condition
      
      return () => clearTimeout(timer);
    } else {
      setShowInvalidAfterDelay(false);
    }
  }, [validationState]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error("Password update error:", error);
        
        // Detailed error handling
        let errorMessage = "Не удалось обновить пароль";
        let errorTitle = "Ошибка";
        
        if (error.message?.includes("New password should be different")) {
          errorTitle = "Пароль не изменен";
          errorMessage = "Новый пароль должен отличаться от текущего. Попробуйте другой пароль.";
        } else if (error.message?.includes("Password should be")) {
          errorTitle = "Слабый пароль";
          errorMessage = "Пароль должен быть более надежным. Используйте комбинацию букв, цифр и символов.";
        } else if (error.message?.includes("session_not_found") || error.message?.includes("invalid_session")) {
          errorTitle = "Сессия истекла";
          errorMessage = "Ваша сессия для сброса пароля истекла. Запросите новую ссылку для сброса.";
        } else if (error.message?.includes("token_expired") || error.message?.includes("expired")) {
          errorTitle = "Ссылка истекла";
          errorMessage = "Ссылка для сброса пароля истекла. Запросите новую ссылку.";
        } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
          errorTitle = "Проблема с соединением";
          errorMessage = "Проверьте подключение к интернету и попробуйте еще раз.";
        } else if (error.message?.includes("rate_limit")) {
          errorTitle = "Слишком много попыток";
          errorMessage = "Превышен лимит попыток изменения пароля. Попробуйте через несколько минут.";
        } else if (error.message?.includes("weak_password")) {
          errorTitle = "Слабый пароль";
          errorMessage = "Пароль слишком простой. Используйте минимум 8 символов с буквами, цифрами и специальными символами.";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        
        // Redirect to forgot password for expired sessions
        if (error.message?.includes("session_not_found") || 
            error.message?.includes("token_expired") || 
            error.message?.includes("expired")) {
          setTimeout(() => {
            navigate('/forgot-password', {
              state: { message: 'Ссылка истекла. Запросите новую ссылку для сброса пароля.' }
            });
          }, 3000);
        }
        
        return;
      }

      // If this is a Telegram user setting their first password, update has_password
      if (isTelegramUser && profile) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ has_password: true })
          .eq('id', profile.id);
        
        if (profileUpdateError) {
          console.error('Error updating profile:', profileUpdateError);
        } else {
          console.log('✅ Profile updated - has_password set to true');
        }
      }

      // Clear recovery mode flag
      clearRecoveryMode();

      toast({
        title: isTelegramUser ? "Пароль установлен" : "Пароль обновлен",
        description: isTelegramUser 
          ? "Ваш первый пароль успешно установлен. Теперь вы можете входить через email и пароль."
          : "Ваш пароль успешно изменен. Теперь вы можете войти с новым паролем.",
      });

      // Redirect to login page
      setTimeout(() => {
        navigate('/login', { 
          state: { message: isTelegramUser 
            ? 'Пароль установлен. Войдите с новым паролем.' 
            : 'Пароль успешно изменен. Войдите с новым паролем.' 
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error("Unexpected error:", error);
      
      // Handle unexpected errors
      let errorMessage = "Произошла неожиданная ошибка";
      
      if (error instanceof TypeError && error.message?.includes("fetch")) {
        errorMessage = "Проблема с подключением к серверу. Проверьте интернет-соединение.";
      } else if (error instanceof Error) {
        errorMessage = `Техническая ошибка: ${error.message}`;
      }
      
      toast({
        title: "Системная ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating session or during delayed error display
  if (validationState === 'checking' || (validationState === 'invalid' && !showInvalidAfterDelay)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-medium">Проверка ссылки сброса пароля</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Устанавливаем безопасное соединение...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show error if session is invalid (with delay) or timed out
  if ((validationState === 'invalid' && showInvalidAfterDelay) || validationState === 'timeout') {
    const isTimeout = validationState === 'timeout';
    
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {isTimeout ? 'Время ожидания истекло' : 'Ссылка недействительна'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {isTimeout 
                  ? 'Не удалось установить соединение для сброса пароля. Попробуйте запросить новую ссылку.'
                  : 'Ссылка для сброса пароля недействительна или истекла.'
                }
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isTelegramUser ? "Установить пароль" : "Создать новый пароль"}
            </CardTitle>
            
            {/* Password requirements info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Требования к паролю:</strong>
              </p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• Минимум 6 символов (рекомендуется 8+)</li>
                <li>• Хотя бы одна буква и одна цифра</li>
                <li>• Должен отличаться от текущего пароля</li>
              </ul>
            </div>
            
            {isTelegramUser && profile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Telegram пользователь:</strong> {profile.first_name || profile.full_name}
                </p>
                {profile.opt_id && (
                  <p className="text-sm text-green-600">
                    <strong>OPT ID:</strong> {profile.opt_id}
                  </p>
                )}
                <p className="text-xs text-green-600 mt-1">
                  Вы устанавливаете свой первый пароль для входа через email.
                </p>
              </div>
            )}
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