import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Clock, Building2, LogOut } from 'lucide-react';
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
    signOutButton: "Sign Out",
    checkingStatus: "Checking status...",
    approved: "Account approved! Redirecting..."
  }
};

const PendingApprovalPage = () => {
  const { signOut, profile } = useAuth();
  const { language } = useLanguage();
  const { isChecking, isApproved } = useApprovalStatus();
  const t = pendingApprovalTranslations[language];

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