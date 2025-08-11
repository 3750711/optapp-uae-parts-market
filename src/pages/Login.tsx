
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
import { getLoginTranslations } from '@/utils/loginTranslations';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageToggle from '@/components/auth/LanguageToggle';



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
  const { language, changeLanguage } = useLanguage('ru');
  
  const from = searchParams.get('from') || '/';
  const t = getLoginTranslations(language);

  const inputType = detectInputType(loginInput);
  const isOptId = inputType === 'opt_id';
  
  // Показываем email как приоритетный, OPT ID как альтернативу
  const isEmailFormat = inputType === 'email' || loginInput.length === 0;

  const createAuthError = (type: AuthErrorType, customMessage?: string): AuthError => {
    const errorMessages = {
      [AuthErrorType.INVALID_CREDENTIALS]: t.errors.invalidCredentials,
      [AuthErrorType.USER_NOT_FOUND]: t.errors.userNotFound,
      [AuthErrorType.OPT_ID_NOT_FOUND]: t.errors.optIdNotFound,
      [AuthErrorType.RATE_LIMITED]: t.errors.rateLimited,
      [AuthErrorType.NETWORK_ERROR]: t.errors.networkError,
      [AuthErrorType.GENERIC_ERROR]: t.errors.genericError
    };

    const actionConfig = {
      [AuthErrorType.USER_NOT_FOUND]: { text: t.errorActions.register, link: '/register' },
      [AuthErrorType.INVALID_CREDENTIALS]: { text: t.errorActions.recoverPassword, link: '/forgot-password' },
      [AuthErrorType.OPT_ID_NOT_FOUND]: { text: t.errorActions.register, link: '/register' }
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
      setAuthError(createAuthError(AuthErrorType.GENERIC_ERROR, t.errors.fillAllFields));
      return;
    }
    
    if (!checkRateLimit(language === 'ru' ? 'вход в систему' : 'login')) {
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
        title: t.loginSuccess,
        description: t.welcomeBack,
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
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-center">{t.loginTitle}</CardTitle>
                <CardDescription className="text-center">
                  {t.loginDescription}
                </CardDescription>
              </div>
              <LanguageToggle
                language={language}
                onLanguageChange={changeLanguage}
                className="mt-1"
              />
            </div>
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
                          {t.email}
                        </>
                      ) : (
                        <>
                          <Hash className="h-4 w-4" />
                          {t.optId}
                        </>
                      )}
                    </Label>
                    <Input
                      id="loginInput"
                      type="text"
                      placeholder={isEmailFormat ? t.emailPlaceholder : t.optIdPlaceholder}
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.loginHelperText}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">{t.password}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t.passwordPlaceholder}
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
                        {t.signingIn}
                      </>
                    ) : (
                      t.signIn
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
                <span className="bg-background px-2 text-muted-foreground">{t.or}</span>
              </div>
            </div>

            {/* Telegram Login */}
            <div className="space-y-4">
              <TelegramLoginWidget 
                language={language}
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
                {t.forgotPassword}
              </Link>
              <div className="text-sm text-gray-600">
                {t.noAccount}{' '}
                <Link to="/register" className="text-blue-600 hover:underline">
                  {t.register}
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
