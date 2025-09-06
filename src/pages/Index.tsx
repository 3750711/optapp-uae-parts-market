
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import StatisticsSection from "@/components/home/StatisticsSection";
import { ProfessionalAuthBlock } from "@/components/auth/ProfessionalAuthBlock";
import { TelegramLoginWidget } from "@/components/auth/TelegramLoginWidget";
import { RealtimeDiagnostics } from "@/components/realtime/RealtimeDiagnostics";
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
        <section className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center">
              
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

              {/* Statistics Section */}
              <div className="mb-12">
                <StatisticsSection language={language} />
              </div>

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
                    <div className="max-w-lg mx-auto">
                      <ProfessionalAuthBlock language={language === 'bn' ? 'en' : language} />
                    </div>
                  )}
               </div>

                 {/* Hidden Telegram Login Widget for incomplete profiles */}
                 {user && profile?.auth_method === 'telegram' && !profile?.profile_completed && (
                   <div className="hidden">
                     <TelegramLoginWidget language={language === 'bn' ? 'en' : language} />
                   </div>
                 )}

                 {/* Realtime Diagnostics - for development/testing */}
                 {import.meta.env.DEV && (
                   <div className="mt-8 max-w-2xl mx-auto">
                     <RealtimeDiagnostics />
                   </div>
                 )}
             </div>
           </div>
         </section>
       </Layout>
    </>
  );
};

export default Index;
