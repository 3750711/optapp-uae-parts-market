
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { detectInputType, getEmailByOptId } from '@/utils/authUtils';
import { useRateLimit } from '@/hooks/useRateLimit';
import TelegramLoginButton from '@/components/auth/TelegramLoginButton';


const Login = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkRateLimit } = useRateLimit();
  const { signIn, signInWithTelegram } = useAuth();
  
  const from = searchParams.get('from') || '/';

  const inputType = detectInputType(loginInput);
  const isOptId = inputType === 'opt_id';
  
  // Показываем email как приоритетный, OPT ID как альтернативу
  const isEmailFormat = inputType === 'email' || loginInput.length === 0;

  const handleTelegramAuth = async (user: any, authResult: any) => {
    try {
      console.log('🔧 Starting Telegram authentication...');
      
      const { error } = await signInWithTelegram(user);
      
      if (error) {
        console.error('❌ Telegram authentication failed:', error);
        setError(error);
        return;
      }
      
      console.log('✅ Telegram authentication successful');
      
      toast({
        title: "Вход выполнен успешно",
        description: `Добро пожаловать через Telegram!`,
      });
      
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('❌ Error handling Telegram auth:', error);
      setError('Authentication failed');
    }
  };

  const handleTelegramError = (error: string) => {
    setError(error);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkRateLimit('вход в систему')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let email = loginInput;

      // Если введен OPT ID, получаем email
      if (isOptId) {
        const result = await getEmailByOptId(loginInput);
        
        if (result.isRateLimited) {
          setError('Слишком много попыток поиска по OPT ID. Попробуйте позже.');
          return;
        }
        
        if (!result.email) {
          setError('OPT ID не найден в системе');
          return;
        }
        
        email = result.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (isOptId) {
          setError('Неверный OPT ID или пароль');
        } else {
          setError(error.message || 'Произошла ошибка при входе');
        }
      } else {
        toast({
          title: "Вход выполнен успешно",
          description: "Добро пожаловать!",
        });
        
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
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
            {/* Telegram Login - Priority */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-center text-muted-foreground">
                Быстрый вход
              </h3>
              <div className="flex justify-center">
            <TelegramLoginButton
              botUsername="Optnewads_bot"
              onAuth={handleTelegramAuth}
              onError={handleTelegramError}
              size="large"
            />
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">или</span>
              </div>
            </div>

            {/* Email/Password Form - Alternative */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowEmailForm(!showEmailForm)}
                type="button"
              >
                {showEmailForm ? 'Скрыть' : 'Войти через Email/OPT ID'}
              </Button>

              {showEmailForm && (
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
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
