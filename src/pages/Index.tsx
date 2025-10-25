
import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { CompactStatsBlock } from "@/components/home/CompactStatsBlock";
import { TelegramLoginWidget } from "@/components/auth/TelegramLoginWidget";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { HomeProductsSection } from "@/components/home/HomeProductsSection";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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
              <h2 className="text-xl font-semibold mb-2">{t.errors.pageLoadError}</h2>
              <p className="text-muted-foreground mb-4">{t.errors.pageLoadErrorDesc}</p>
              <Button onClick={() => window.location.reload()}>
                {t.errors.refreshPage}
              </Button>
            </div>
          </div>
        }>
          <section className="bg-background">
            <div className="container mx-auto px-4 py-12">
              
              {/* Compact Statistics Block */}
              <ErrorBoundary>
                <div className="mb-12">
                  <CompactStatsBlock language={language} />
                </div>
              </ErrorBoundary>

              {/* Hidden Telegram Login Widget for incomplete profiles */}
              <ErrorBoundary>
                {user && profile?.auth_method === 'telegram' && !profile?.profile_completed && (
                  <div className="hidden">
                    <TelegramLoginWidget language={language === 'bn' ? 'en' : language} />
                  </div>
                )}
              </ErrorBoundary>

              {/* Products Catalog Section */}
              <div className="max-w-7xl mx-auto">
                 <ErrorBoundary fallback={
                   <div className="text-center py-12">
                     <p className="text-muted-foreground mb-4">{t.errors.catalogLoadError}</p>
                     <Button variant="outline" onClick={() => window.location.reload()}>
                       {t.errors.refreshPage}
                     </Button>
                   </div>
                 }>
                   <HomeProductsSection language={language} />
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
