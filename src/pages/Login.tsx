
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Mail, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { detectInputType, getEmailByOptId } from '@/utils/authUtils';
import { useRateLimit } from '@/hooks/useRateLimit';
import { TelegramLoginWidget } from '@/components/auth/TelegramLoginWidget';
import { TelegramAuthWarning } from '@/components/auth/TelegramAuthWarning';
import { AuthErrorAlert } from '@/components/auth/AuthErrorAlert';
import { Separator } from '@/components/ui/separator';
import { AuthErrorType, AuthError } from '@/types/auth';



const Login = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showTelegramWarning, setShowTelegramWarning] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkRateLimit } = useRateLimit();
  const { signIn } = useAuth();
  
  const from = searchParams.get('from') || '/';

  const inputType = detectInputType(loginInput);
  const isOptId = inputType === 'opt_id';
  
  // Показываем email как приоритетный, OPT ID как альтернативу
  const isEmailFormat = inputType === 'email' || loginInput.length === 0;

  const createAuthError = (type: AuthErrorType, customMessage?: string): AuthError => {
    const errorMessages = {
      [AuthErrorType.INVALID_CREDENTIALS]: 'Неверный пароль. Проверьте правильность введенных данных.',
      [AuthErrorType.USER_NOT_FOUND]: 'Пользователь с таким email не найден. Возможно, вы еще не зарегистрированы?',
      [AuthErrorType.OPT_ID_NOT_FOUND]: 'OPT ID не найден в системе. Проверьте правильность введенного ID.',
      [AuthErrorType.RATE_LIMITED]: 'Слишком много попыток входа. Попробуйте позже через несколько минут.',
      [AuthErrorType.NETWORK_ERROR]: 'Проблемы с подключением к интернету. Проверьте соединение и попробуйте снова.',
      [AuthErrorType.GENERIC_ERROR]: 'Произошла неожиданная ошибка. Попробуйте обновить страницу.'
    };

    const actionConfig = {
      [AuthErrorType.USER_NOT_FOUND]: { text: 'Зарегистрироваться', link: '/register' },
      [AuthErrorType.INVALID_CREDENTIALS]: { text: 'Восстановить пароль', link: '/forgot-password' },
      [AuthErrorType.OPT_ID_NOT_FOUND]: { text: 'Зарегистрироваться', link: '/register' }
    };

    return {
      type,
      message: customMessage || errorMessages[type],
      actionText: actionConfig[type]?.text,
      actionLink: actionConfig[type]?.link
    };
  };


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginInput || !password) {
      setAuthError(createAuthError(AuthErrorType.GENERIC_ERROR, 'Пожалуйста, заполните все поля'));
      return;
    }
    
    if (!checkRateLimit('вход в систему')) {
      setAuthError(createAuthError(AuthErrorType.RATE_LIMITED));
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setShowTelegramWarning(false);

    try {
      let email = loginInput;

      // Если введен OPT ID, получаем email
      if (isOptId) {
        const result = await getEmailByOptId(loginInput);
        
        if (result.isRateLimited) {
          setAuthError(createAuthError(AuthErrorType.RATE_LIMITED));
          return;
        }
        
        if (!result.email) {
          setAuthError(createAuthError(AuthErrorType.OPT_ID_NOT_FOUND));
          return;
        }
        
        email = result.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          try {
            // Проверяем метод аутентификации пользователя через безопасную функцию
            const { data: authData } = await supabase.rpc('check_user_auth_method', {
              p_login_input: loginInput
            });
            
            if (authData?.auth_method === 'telegram') {
              setShowTelegramWarning(true);
              return;
            } else if (authData?.auth_method === null) {
              // Пользователь не найден
              setAuthError(createAuthError(
                inputType === 'opt_id' ? AuthErrorType.OPT_ID_NOT_FOUND : AuthErrorType.USER_NOT_FOUND
              ));
              return;
            } else {
              // Пользователь найден, но пароль неверный
              setAuthError(createAuthError(AuthErrorType.INVALID_CREDENTIALS));
              return;
            }
          } catch (authCheckError) {
            console.error('Error checking auth method:', authCheckError);
            // Fallback to generic invalid credentials error
            setAuthError(createAuthError(AuthErrorType.INVALID_CREDENTIALS));
            return;
          }
        } else {
          // Other auth errors
          setAuthError(createAuthError(AuthErrorType.GENERIC_ERROR, error.message));
          return;
        }
      }

      toast({
        title: "Вход выполнен успешно",
        description: "Добро пожаловать!",
      });
      
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(createAuthError(AuthErrorType.NETWORK_ERROR));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Вход</CardTitle>
            <CardDescription className="text-center">
              Войдите в свой аккаунт для продолжения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <div className="space-y-4">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginInput" className="flex items-center gap-2">
                      {isEmailFormat ? (
                        <>
                          <Mail className="h-4 w-4" />
                          Email
                        </>
                      ) : (
                        <>
                          <Hash className="h-4 w-4" />
                          OPT ID
                        </>
                      )}
                    </Label>
                    <Input
                      id="loginInput"
                      type="text"
                      placeholder={isEmailFormat ? "Введите ваш email" : "Введите ваш OPT ID"}
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Вы можете войти используя <strong>email</strong> или OPT ID
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Введите ваш пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Входим...
                      </>
                    ) : (
                      'Войти'
                    )}
                  </Button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">или</span>
              </div>
            </div>

            {/* Telegram Login */}
            <div className="space-y-4">
              <TelegramLoginWidget 
                onSuccess={() => navigate(from, { replace: true })}
                onError={(error) => setAuthError(createAuthError(AuthErrorType.GENERIC_ERROR, error))}
              />
            </div>

            {showTelegramWarning && (
              <TelegramAuthWarning onClose={() => setShowTelegramWarning(false)} />
            )}

            {authError && (
              <AuthErrorAlert 
                error={authError} 
                onClose={() => setAuthError(null)} 
              />
            )}

            <div className="text-center space-y-2">
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:underline"
              >
                Забыли пароль?
              </Link>
              <div className="text-sm text-gray-600">
                Нет аккаунта?{' '}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Зарегистрироваться
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
