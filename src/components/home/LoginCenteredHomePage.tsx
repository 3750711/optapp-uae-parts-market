import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TelegramLoginWidget } from '@/components/auth/TelegramLoginWidget';
import { useAuth } from '@/contexts/AuthContext';
import { detectInputType, getEmailByOptId } from '@/utils/authUtils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, AlertCircle, Package, ShoppingCart, Building2, Users } from 'lucide-react';

interface PlatformStats {
  activeProducts: number;
  maxOrderNumber: number;
}

const LoginCenteredHomePage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResolvingOptId, setIsResolvingOptId] = useState(false);
  const [stats, setStats] = useState<PlatformStats>({ activeProducts: 0, maxOrderNumber: 0 });
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем URL для переадресации из query параметров
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('from') || '/';

  // Загружаем статистику платформы
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsResult, ordersResult] = await Promise.all([
          supabase.rpc('get_admin_metrics').then(({ data }) => data?.total_products || 773),
          supabase.from('orders').select('order_number').order('order_number', { ascending: false }).limit(1).single()
        ]);
        
        setStats({
          activeProducts: productsResult,
          maxOrderNumber: ordersResult.data?.order_number || 7549
        });
      } catch (error) {
        // Используем дефолтные значения при ошибке
        setStats({ activeProducts: 773, maxOrderNumber: 7549 });
      }
    };

    fetchStats();
  }, []);

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
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      setError('Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramSuccess = () => {
    navigate(redirectTo, { replace: true });
  };

  const handleTelegramError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="container mx-auto px-4 pt-8 pb-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">PartsBay.ae</h1>
          </div>
          <h2 className="text-xl text-muted-foreground mb-2">
            B2B платформа для оптовых закупок автозапчастей из ОАЭ
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Прямой доступ к проверенным поставщикам автозапчастей в ОАЭ. 
            Найдите нужные детали быстро и выгодно.
          </p>
        </div>

        {/* Statistics */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="flex items-center gap-2 text-primary">
            <Package className="w-5 h-5" />
            <span className="font-semibold text-lg">{stats.activeProducts.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">объявлений</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold text-lg">{stats.maxOrderNumber.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">заказов</span>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Email Login Form */}
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold">Вход по Email</CardTitle>
                <CardDescription>
                  Войдите используя email или OPT ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="mt-4 text-center">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Забыли пароль?
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Telegram Login */}
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold">Быстрый вход</CardTitle>
                <CardDescription>
                  Войдите через Telegram одним кликом
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <TelegramLoginWidget 
                  onSuccess={handleTelegramSuccess}
                  onError={handleTelegramError}
                />
              </CardContent>
            </Card>
          </div>

          {/* Registration CTA */}
          <div className="text-center mt-8">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-2">Нет аккаунта?</h3>
              <p className="text-muted-foreground mb-4">
                Зарегистрируйтесь и получите доступ к тысячам предложений
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to={`/register${redirectTo && redirectTo !== '/' ? `?from=${encodeURIComponent(redirectTo)}` : ''}`}>
                  <Button variant="default" className="w-full sm:w-auto">
                    <Users className="w-4 h-4 mr-2" />
                    Регистрация покупателя
                  </Button>
                </Link>
                <Link to={`/seller-register${redirectTo && redirectTo !== '/' ? `?from=${encodeURIComponent(redirectTo)}` : ''}`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Building2 className="w-4 h-4 mr-2" />
                    Регистрация продавца
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginCenteredHomePage;