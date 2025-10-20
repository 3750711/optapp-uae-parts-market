
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import StatisticsSection from "@/components/home/StatisticsSection";
import { ProfessionalAuthBlock } from "@/components/auth/ProfessionalAuthBlock";
import { TelegramLoginWidget } from "@/components/auth/TelegramLoginWidget";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { HomeProductsSection } from "@/components/home/HomeProductsSection";

import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { getMainPageTranslations } from "@/utils/mainPageTranslations";

const Index = () => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const t = getMainPageTranslations(language);
  
  console.log('🌐 Index Page Language:', language);
  console.log('🌐 Current translations:', t.hero.title);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PartsBay.ae",
    "url": "https://partsbay.ae",
    "logo": "https://partsbay.ae/logo.png",
    "description": t.meta.description,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+971-XXX-XXXX",
      "contactType": "Customer Service",
      "areaServed": "AE",
      "availableLanguage": ["ru", "en", "ar"]
    }
  };

  return (
    <>
      <Helmet>
        <title>{t.meta.title}</title>
        <meta 
          name="description" 
          content={t.meta.description}
        />
        <meta 
          name="keywords" 
          content={t.meta.keywords}
        />
        <link rel="canonical" href="https://partsbay.ae/" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Layout language={language}>
        <ErrorBoundary fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center p-8">
              <h2 className="text-xl font-semibold mb-2">Ошибка загрузки страницы</h2>
              <p className="text-muted-foreground mb-4">Произошла ошибка при загрузке главной страницы</p>
              <Button onClick={() => window.location.reload()}>
                Обновить страницу
              </Button>
            </div>
          </div>
        }>
          <section className="bg-background">
            <div className="container mx-auto px-4 py-20">
              {/* Hero Section */}
              <div className="max-w-2xl mx-auto text-center mb-16">
                
                {/* Company Logo */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-8">
                  <Building2 className="w-8 h-8 text-primary-foreground" />
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {t.hero.title}
                </h1>
                
                <h2 className="text-xl md:text-2xl text-muted-foreground mb-2">
                  {t.hero.subtitle}
                </h2>
                
                {/* Subtitle */}
                <p className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto">
                  {t.hero.description}
                </p>

                <ErrorBoundary>
                  {/* Statistics Section */}
                  <div className="mb-12">
                    <StatisticsSection language={language} />
                  </div>
                </ErrorBoundary>

                {/* Access Notice */}
                <div className="bg-muted border border-border rounded-lg p-6 mb-8">
                  <p className="text-foreground font-medium">
                    {t.hero.accessTitle}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t.hero.accessDescription}
                  </p>
                </div>

                 {/* Authentication Section */}
                 <div className="max-w-md mx-auto">
                    {user ? (
                      <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-foreground mb-3">
                            {t.welcome.greeting}, {profile?.full_name || 'Участник'}!
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            {profile?.user_type === 'seller' 
                              ? t.welcome.sellerDescription
                              : t.welcome.buyerDescription
                            }
                          </p>
                          <Link 
                            to={profile?.user_type === 'seller' ? '/seller/dashboard' : '/catalog'}
                            className="inline-block w-full"
                          >
                            <Button className="w-full">
                              {profile?.user_type === 'seller' ? t.welcome.sellerButton : t.welcome.buyerButton}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <ErrorBoundary fallback={
                        <div className="bg-card border border-border rounded-lg p-6 text-center">
                          <p className="text-muted-foreground mb-4">Ошибка загрузки авторизации</p>
                          <Button variant="outline" onClick={() => window.location.reload()}>
                            Попробовать снова
                          </Button>
                        </div>
                      }>
                        <div className="max-w-lg mx-auto">
                          <ProfessionalAuthBlock language={language === 'bn' ? 'en' : language} />
                        </div>
                      </ErrorBoundary>
                    )}
                 </div>

                   <ErrorBoundary>
                     {/* Hidden Telegram Login Widget for incomplete profiles */}
                     {user && profile?.auth_method === 'telegram' && !profile?.profile_completed && (
                       <div className="hidden">
                         <TelegramLoginWidget language={language === 'bn' ? 'en' : language} />
                       </div>
                     )}
                   </ErrorBoundary>
               </div>

               {/* Products Catalog Section */}
               <div className="max-w-7xl mx-auto mt-20">
                 <div className="mb-8">
                   <h2 className="text-3xl font-bold text-foreground mb-2">Каталог запчастей</h2>
                   <p className="text-muted-foreground">Просмотрите доступные товары с возможностью поиска</p>
                 </div>
                 <ErrorBoundary fallback={
                   <div className="text-center py-12">
                     <p className="text-muted-foreground mb-4">Ошибка загрузки каталога</p>
                     <Button variant="outline" onClick={() => window.location.reload()}>
                       Обновить страницу
                     </Button>
                   </div>
                 }>
                   <HomeProductsSection />
                 </ErrorBoundary>
               </div>
             </div>
           </section>
        </ErrorBoundary>
       </Layout>
    </>
  );
};

export default Index;
