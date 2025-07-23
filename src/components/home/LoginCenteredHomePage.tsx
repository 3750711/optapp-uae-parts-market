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
import { 
  Loader2, 
  Mail, 
  Lock, 
  AlertCircle, 
  Package, 
  ShoppingCart, 
  Building2, 
  Users,
  Shield,
  Truck,
  Clock,
  Star,
  Check,
  ArrowRight,
  Globe
} from 'lucide-react';

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
  const [animationStep, setAnimationStep] = useState(0);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем URL для переадресации из query параметров
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('from') || '/';

  // Анимация появления элементов
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep(prev => prev + 1);
    }, 200);

    return () => clearInterval(timer);
  }, []);

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

  const trustFactors = [
    { icon: Shield, title: "Проверенные поставщики", description: "Только сертифицированные компании" },
    { icon: Truck, title: "Прямые поставки", description: "Из складов в Дубае и Шардже" },
    { icon: Clock, title: "Быстрая обработка", description: "Заказы обрабатываются за 2-4 часа" },
    { icon: Star, title: "Качественный сервис", description: "Персональный менеджер для каждого клиента" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="container mx-auto px-4 pt-12 pb-8">
          {/* Logo & Brand */}
          <div className={`text-center mb-8 ${animationStep >= 1 ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
                  <Globe className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-extrabold tracking-tight leading-none">
                  <span className="text-primary">partsbay</span>
                  <span className="text-secondary">.ae</span>
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Professional B2B Platform
                </p>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Эксклюзивная B2B платформа для оптовых закупок 
                <span className="text-primary"> автозапчастей из ОАЭ</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Прямой доступ к проверенным поставщикам из Дубая и Шарджи. 
                Профессиональный сервис для серьезного бизнеса.
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 ${animationStep >= 2 ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            {trustFactors.map((factor, index) => (
              <div key={index} className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <factor.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{factor.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>

          {/* Platform Statistics */}
          <div className={`flex justify-center gap-8 mb-12 ${animationStep >= 3 ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <div className="relative">
                <div className="text-3xl font-bold text-primary animate-pulse-soft">
                  {stats.activeProducts.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground font-medium">активных объявлений</div>
                <div className="absolute -top-2 -right-2">
                  <Package className="w-4 h-4 text-primary animate-float" />
                </div>
              </div>
            </div>
            <div className="w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
            <div className="text-center">
              <div className="relative">
                <div className="text-3xl font-bold text-secondary animate-pulse-soft" style={{ animationDelay: '0.5s' }}>
                  {stats.maxOrderNumber.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground font-medium">успешных сделок</div>
                <div className="absolute -top-2 -right-2">
                  <ShoppingCart className="w-4 h-4 text-secondary animate-float" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className={`grid lg:grid-cols-2 gap-8 items-stretch ${animationStep >= 4 ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            
            {/* Email Login Form */}
            <Card className="h-full shadow-elevation border-0 bg-white/80 backdrop-blur-sm hover:shadow-elevation-hover transition-all duration-300">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Вход по Email</CardTitle>
                <CardDescription className="text-base">
                  Введите ваши учетные данные для доступа к платформе
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="w-4 h-4 text-muted-foreground" />
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
                      className="h-12 bg-white/50 border-border focus:border-primary focus:ring-primary/20 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="w-4 h-4 text-muted-foreground" />
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
                      className="h-12 bg-white/50 border-border focus:border-primary focus:ring-primary/20 transition-colors"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold shadow-button hover:shadow-lg transition-all duration-200" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {isResolvingOptId ? 'Поиск аккаунта...' : loading ? 'Вход...' : 'Войти в систему'}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Забыли пароль?
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Telegram Login */}
            <Card className="h-full shadow-elevation border-0 bg-white/80 backdrop-blur-sm hover:shadow-elevation-hover transition-all duration-300">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0088cc] to-[#0088cc]/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold">Быстрый вход</CardTitle>
                <CardDescription className="text-base">
                  Войдите через Telegram одним кликом
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <TelegramLoginWidget 
                  onSuccess={handleTelegramSuccess}
                  onError={handleTelegramError}
                />
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    Безопасная авторизация
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    Мгновенный доступ
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration CTA */}
          <div className={`text-center mt-12 ${animationStep >= 5 ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
            <div className="bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-2xl font-bold mb-3">Нет аккаунта?</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Присоединяйтесь к профессиональному сообществу торговцев автозапчастями
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Link to={`/register${redirectTo && redirectTo !== '/' ? `?from=${encodeURIComponent(redirectTo)}` : ''}`} className="flex-1">
                  <Button className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold shadow-button transition-all duration-200">
                    <Users className="w-5 h-5 mr-2" />
                    Регистрация покупателя
                  </Button>
                </Link>
                <Link to={`/seller-register${redirectTo && redirectTo !== '/' ? `?from=${encodeURIComponent(redirectTo)}` : ''}`} className="flex-1">
                  <Button variant="outline" className="w-full h-12 border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold transition-all duration-200">
                    <Building2 className="w-5 h-5 mr-2" />
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