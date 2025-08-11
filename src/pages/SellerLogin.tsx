import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Store, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { TelegramLoginWidget } from "@/components/auth/TelegramLoginWidget";
import { devLog } from "@/utils/logger";
import { getLoginTranslations } from '@/utils/loginTranslations';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageToggle from '@/components/auth/LanguageToggle';

const SellerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithTelegram, user, profile, isProfileLoading } = useAuth();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage('en');
  
  const t = getLoginTranslations(language);

  // Handle redirection after successful authentication
  useEffect(() => {
    console.log('🔐 SellerLogin: Auth state changed', {
      hasUser: !!user,
      hasProfile: !!profile,
      isProfileLoading,
      userType: profile?.user_type,
      verificationStatus: profile?.verification_status,
      timestamp: new Date().toISOString()
    });

    // Only redirect if we have both user and profile loaded, and user is a seller
    if (user && profile && !isProfileLoading) {
      if (profile.user_type === 'seller') {
        console.log('🔐 SellerLogin: Redirecting seller to dashboard');
        navigate('/seller/dashboard', { replace: true });
      } else if (profile.verification_status === 'pending') {
        console.log('🔐 SellerLogin: Redirecting to pending approval');
        navigate('/pending-approval', { replace: true });
      } else {
        console.log('🔐 SellerLogin: User type not seller:', profile.user_type);
        toast({
          title: language === 'en' ? 'Access Denied' : 'Доступ запрещен',
          description: language === 'en' ? 'This login is for sellers only.' : 'Этот вход только для продавцов.',
          variant: "destructive",
        });
      }
    }
  }, [user, profile, isProfileLoading, navigate, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 SellerLogin: Starting login process');
      const { error } = await signIn(email, password);
      
      if (error) {
        console.log('🔐 SellerLogin: Login error:', error);
        toast({
          title: t.errors.loginFailed,
          description: error.message || t.errors.invalidCredentials,
          variant: "destructive",
        });
      } else {
        console.log('🔐 SellerLogin: Login successful, waiting for profile to load');
        toast({
          title: t.welcomeBack,
          description: language === 'en' ? "Successfully logged in. Loading your profile..." : "Успешный вход. Загрузка профиля...",
        });
        // Don't navigate here - let useEffect handle it after profile loads
      }
    } catch (error) {
      console.error('🔐 SellerLogin: Login exception:', error);
      devLog('Login error:', error);
      toast({
        title: t.errors.loginFailed,
        description: t.errors.genericError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left side - Info */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  <span className="text-primary">{language === 'en' ? 'Seller' : 'Продавец'}</span> {t.sellerPortal}
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  {t.sellerPortalDescription}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-card">
                  <Store className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{t.manageInventory}</h3>
                  <p className="text-sm text-gray-600">{t.manageInventoryDesc}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-card">
                  <ShoppingBag className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="font-semibold mb-2">{t.processOrders}</h3>
                  <p className="text-sm text-gray-600">{t.processOrdersDesc}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-card">
                  <Users className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{t.connectWithBuyers}</h3>
                  <p className="text-sm text-gray-600">{t.connectWithBuyersDesc}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-card">
                  <TrendingUp className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="font-semibold mb-2">{t.growYourBusiness}</h3>
                  <p className="text-sm text-gray-600">{t.growYourBusinessDesc}</p>
                </div>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md bg-white shadow-elevation border-0">
                <CardHeader className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-center">
                      <CardTitle className="text-2xl font-bold">{t.sellerLoginTitle}</CardTitle>
                      <p className="text-gray-600">{t.sellerLoginDescription}</p>
                    </div>
                    <LanguageToggle
                      language={language}
                      onLanguageChange={changeLanguage}
                      className="mt-1"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        {t.email} {language === 'en' ? 'Address' : 'адрес'}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.sellerEmailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        {t.password}
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t.sellerPasswordPlaceholder}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? t.signingIn : t.signIn}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">{t.orContinueWith}</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <TelegramLoginWidget
                      language={language}
                      onSuccess={() => {
                        console.log('🔐 SellerLogin: Telegram login successful, waiting for profile to load');
                        toast({
                          title: t.welcomeBack,
                          description: language === 'en' ? "Successfully logged in via Telegram. Loading your profile..." : "Успешный вход через Telegram. Загрузка профиля...",
                        });
                        // Don't navigate here - let useEffect handle it after profile loads
                      }}
                      onError={(error) => {
                        console.log('🔐 SellerLogin: Telegram login error:', error);
                        toast({
                          title: t.errors.telegramLoginFailed,
                          description: error || (language === 'en' ? "Unable to login with Telegram. Please try again." : "Не удалось войти через Telegram. Попробуйте снова."),
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-4 text-center text-sm">
                    <Link 
                      to="/forgot-password" 
                      className="text-primary hover:underline block"
                    >
                      {t.forgotPassword}
                    </Link>
                    
                    <div className="space-y-2">
                      <p className="text-gray-600">{t.dontHaveSellerAccount}</p>
                      <Link 
                        to="/seller-register" 
                        className="text-secondary hover:underline font-medium"
                      >
                        {t.registerAsSeller}
                      </Link>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-gray-600 mb-2">{t.lookingForBuyerAccess}</p>
                      <Link 
                        to="/login" 
                        className="text-primary hover:underline font-medium"
                      >
                        {t.buyerLogin}
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerLogin;