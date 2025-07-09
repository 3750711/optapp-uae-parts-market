
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

const Login = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkRateLimit } = useRateLimit();
  
  const from = searchParams.get('from') || '/';

  const inputType = detectInputType(loginInput);
  const isOptId = inputType === 'opt_id';

  const handleSubmit = async (e: React.FormEvent) => {
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
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginInput" className="flex items-center gap-2">
                  {isOptId ? (
                    <>
                      <Hash className="h-4 w-4" />
                      OPT ID
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Email
                    </>
                  )}
                </Label>
                <Input
                  id="loginInput"
                  type="text"
                  placeholder={isOptId ? "Введите ваш OPT ID" : "Введите ваш email"}
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Вы можете войти используя email или OPT ID
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

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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

            <div className="mt-4 text-center space-y-2">
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
