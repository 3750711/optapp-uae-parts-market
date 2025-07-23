
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { detectInputType, getEmailByOptId, formatCountdown } from '@/utils/authUtils';
import { AuthError, AuthErrorType } from '@/types/auth';
import Layout from '@/components/layout/Layout';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [countdown, setCountdown] = useState(0);

  const fromPath = searchParams.get('from') || '/';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const inputType = detectInputType(identifier.trim());
      let email = identifier.trim();

      // If input is OPT ID, get email first
      if (inputType === 'opt_id') {
        const { email: foundEmail, isRateLimited } = await getEmailByOptId(identifier.trim());
        
        if (isRateLimited) {
          setError({
            type: AuthErrorType.RATE_LIMITED,
            message: 'Слишком много попыток. Попробуйте через минуту.'
          });
          setCountdown(60);
          return;
        }

        if (!foundEmail) {
          setError({
            type: AuthErrorType.OPT_ID_NOT_FOUND,
            message: 'OPT ID не найден в системе',
            actionText: 'Зарегистрироваться',
            actionLink: '/register'
          });
          return;
        }

        email = foundEmail;
      }

      const { error: loginError } = await login(email, password);

      if (loginError) {
        console.error('Login error:', loginError);
        
        let errorType: AuthErrorType;
        let errorMessage: string;
        
        if (loginError.message?.includes('Invalid login credentials')) {
          errorType = AuthErrorType.INVALID_CREDENTIALS;
          errorMessage = 'Неверный email/OPT ID или пароль';
        } else if (loginError.message?.includes('Email not confirmed')) {
          errorType = AuthErrorType.USER_NOT_FOUND;
          errorMessage = 'Подтвердите email для входа в систему';
        } else {
          errorType = AuthErrorType.GENERIC_ERROR;
          errorMessage = loginError.message || 'Произошла ошибка при входе';
        }

        setError({
          type: errorType,
          message: errorMessage
        });
        return;
      }

      toast({
        title: "Успешный вход",
        description: "Добро пожаловать!",
      });

      // Redirect to the original page or home
      navigate(fromPath, { replace: true });
      
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError({
        type: AuthErrorType.GENERIC_ERROR,
        message: 'Произошла неожиданная ошибка'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">Вход в систему</CardTitle>
            <CardDescription className="text-base">
              Войдите в свой аккаунт, чтобы получить доступ к платформе
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <div className="flex flex-col space-y-2">
                    <span>{error.message}</span>
                    {error.actionText && error.actionLink && (
                      <Button variant="outline" size="sm" asChild className="w-fit">
                        <Link to={error.actionLink}>{error.actionText}</Link>
                      </Button>
                    )}
                    {error.type === AuthErrorType.RATE_LIMITED && countdown > 0 && (
                      <span className="text-sm">
                        Повторить можно через: {formatCountdown(countdown)}
                      </span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium">
                  Email или OPT ID
                </Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Введите email или OPT ID"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading || countdown > 0}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {detectInputType(identifier) === 'email' ? (
                      <Mail className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Phone className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Пароль
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading || countdown > 0}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading || countdown > 0}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || countdown > 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : countdown > 0 ? (
                  `Повторить через ${formatCountdown(countdown)}`
                ) : (
                  'Войти'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>

            <Separator />

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Нет аккаунта?
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/register">Зарегистрироваться</Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/seller-register">Для продавцов</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
