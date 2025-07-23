
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { detectInputType, getEmailByOptId } from '@/utils/authUtils';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResolvingOptId, setIsResolvingOptId] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем URL для переадресации из query параметров
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('from') || '/';

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let email = identifier;
      const inputType = detectInputType(identifier);
      
      if (inputType === 'opt_id') {
        setIsResolvingOptId(true);
        const { email: resolvedEmail, isRateLimited } = await getEmailByOptId(identifier);
        setIsResolvingOptId(false);
        
        if (isRateLimited) {
          setError('Слишком много попыток. Попробуйте позже.');
          setLoading(false);
          return;
        }
        
        if (!resolvedEmail) {
          setError('OPT ID не найден. Проверьте правильность введенных данных.');
          setLoading(false);
          return;
        }
        
        email = resolvedEmail;
      }

      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          setError('Неверный email/OPT ID или пароль');
        } else if (signInError.message === 'Email not confirmed') {
          setError('Пожалуйста, подтвердите ваш email перед входом');
        } else {
          setError(signInError.message);
        }
      } else {
        // Успешный вход - переадресация произойдет через useEffect
        console.log('Login successful, redirecting to:', redirectTo);
      }
    } catch (error) {
      setError('Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
            <CardDescription>
              Войдите в свой аккаунт для доступа к платформе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email или OPT ID
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Введите email или OPT ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isResolvingOptId ? 'Поиск аккаунта...' : loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Забыли пароль?
              </Link>
              <div className="text-sm text-gray-600">
                Нет аккаунта?{' '}
                <Link 
                  to={`/register${redirectTo && redirectTo !== '/' ? `?from=${encodeURIComponent(redirectTo)}` : ''}`}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
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
