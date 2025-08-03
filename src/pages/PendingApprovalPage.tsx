import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Clock, Building2, LogOut, Phone, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';

const pendingApprovalTranslations = {
  ru: {
    meta: {
      title: "Аккаунт на рассмотрении - PartsBay.ae",
      description: "Ваш аккаунт находится на рассмотрении у администраторов PartsBay.ae"
    },
    title: "Аккаунт на рассмотрении",
    subtitle: "Спасибо за регистрацию в PartsBay!",
    description: "Ваш аккаунт успешно создан и находится на рассмотрении у наших администраторов. Обычно процесс верификации занимает от нескольких часов до 1 рабочего дня.",
    whatNext: "Что дальше?",
    steps: [
      "Наши администраторы проверят предоставленную информацию",
      "После одобрения вы получите полный доступ к платформе",
      "Вы сможете покупать и продавать автозапчасти",
      "При необходимости мы свяжемся с вами для уточнения деталей"
    ],
    note: "Если у вас возникли вопросы, вы можете связаться с нами через Telegram или email.",
    timeExpectation: "Процесс занимает от 5 минут",
    timeExpectationDesc: "Обычно верификация происходит в течение 5 минут. В редких случаях может потребоваться до 1 рабочего дня.",
    adminContact: "Администратор может связаться с вами",
    adminContactDesc: "Если потребуется дополнительная информация, администратор свяжется с вами по указанному номеру телефона:",
    loadingVerification: "Инициализация процесса верификации...",
    signOutButton: "Выйти из аккаунта",
    checkingStatus: "Проверяем статус...",
    approved: "Аккаунт одобрен! Перенаправляем..."
  },
  en: {
    meta: {
      title: "Account Under Review - PartsBay.ae",
      description: "Your account is under review by PartsBay.ae administrators"
    },
    title: "Account Under Review",
    subtitle: "Thank you for registering with PartsBay!",
    description: "Your account has been successfully created and is currently under review by our administrators. The verification process usually takes from a few hours to 1 business day.",
    whatNext: "What's next?",
    steps: [
      "Our administrators will review the provided information",
      "After approval, you will get full access to the platform",
      "You will be able to buy and sell auto parts",
      "If needed, we will contact you for additional details"
    ],
    note: "If you have any questions, you can contact us via Telegram or email.",
    timeExpectation: "Process takes from 5 minutes",
    timeExpectationDesc: "Verification usually happens within 5 minutes. In rare cases, it may take up to 1 business day.",
    adminContact: "Administrator may contact you",
    adminContactDesc: "If additional information is needed, an administrator will contact you at the provided phone number:",
    loadingVerification: "Initializing verification process...",
    signOutButton: "Sign Out",
    checkingStatus: "Checking status...",
    approved: "Account approved! Redirecting..."
  }
};

const PendingApprovalPage = () => {
  const { signOut, profile } = useAuth();
  const { language } = useLanguage();
  const { isChecking, isApproved } = useApprovalStatus();
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const t = pendingApprovalTranslations[language];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  if (isChecking) {
    return (
      <Layout language={language}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t.checkingStatus}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (showInitialLoading) {
    return (
      <Layout language={language}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
          <div className="text-center animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
              <div className="absolute inset-2 bg-primary/40 rounded-full animate-[pulse_2s_ease-in-out_infinite] animation-delay-300"></div>
              <div className="absolute inset-4 bg-primary rounded-full animate-spin"></div>
              <Clock className="absolute inset-0 w-8 h-8 m-auto text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.loadingVerification}</h3>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isApproved) {
    return (
      <Layout language={language}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-600">{t.approved}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t.meta.title}</title>
        <meta name="description" content={t.meta.description} />
      </Helmet>

      <Layout language={language}>
        <section className="min-h-screen bg-background py-20 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              
              {/* Header */}
              <div className="text-center mb-12 animate-scale-in">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6 animate-[pulse_2s_ease-in-out_infinite]">
                  <Clock className="w-10 h-10 text-orange-600" />
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t.title}
                </h1>
                
                <h2 className="text-xl text-muted-foreground mb-6">
                  {t.subtitle}
                </h2>
              </div>

              {/* Main Card */}
              <Card className="bg-card/90 backdrop-blur-sm border border-border/20 shadow-card-elegant animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-8 animate-scale-in" style={{ animationDelay: '0.3s' }}>
                  
                  {/* User Info */}
                  {profile && (
                    <div className="bg-secondary/20 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{profile.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {profile.user_type === 'seller' ? 'Продавец' : 'Покупатель'} • OPT_ID: {profile.opt_id}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time Expectation */}
                  <Card className="border-amber-200 bg-amber-50/50 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <Timer className="w-4 h-4 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-amber-800">{t.timeExpectation}</h3>
                      </div>
                      <p className="text-sm text-amber-700 ml-11">{t.timeExpectationDesc}</p>
                    </CardContent>
                  </Card>

                  {/* Admin Contact Info */}
                  {profile?.phone && (
                    <Card className="border-blue-200 bg-blue-50/50 mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="w-4 h-4 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-blue-800">{t.adminContact}</h3>
                        </div>
                        <p className="text-sm text-blue-700 ml-11 mb-2">{t.adminContactDesc}</p>
                        <div className="ml-11 bg-white/60 rounded-lg px-3 py-2 border border-blue-200">
                          <span className="font-mono font-medium text-blue-800">{profile.phone}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Description */}
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t.description}
                  </p>

                  {/* What's Next Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">{t.whatNext}</h3>
                    <ul className="space-y-3">
                      {t.steps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                            <span className="text-sm font-medium text-primary">{index + 1}</span>
                          </div>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700">{t.note}</p>
                  </div>

                  {/* Sign Out Button */}
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut}
                      className="min-w-[150px]"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t.signOutButton}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default PendingApprovalPage;