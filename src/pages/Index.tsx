
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import StatisticsSection from "@/components/home/StatisticsSection";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, profile } = useAuth();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PartsBay.ae",
    "url": "https://partsbay.ae",
    "logo": "https://partsbay.ae/logo.png",
    "description": "Закрытая B2B/B2C платформа автозапчастей в ОАЭ. Профессиональное сообщество поставщиков и покупателей.",
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
        <title>PartsBay.ae - B2B/B2C Платформа Автозапчастей</title>
        <meta 
          name="description" 
          content="Закрытая профессиональная платформа автозапчастей в ОАЭ. Доступ только для зарегистрированных пользователей." 
        />
        <meta 
          name="keywords" 
          content="B2B автозапчасти ОАЭ, платформа автозапчастей, закрытое сообщество" 
        />
        <link rel="canonical" href="https://partsbay.ae/" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Layout>
        <section className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center">
              
              {/* Company Logo */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-8">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                PartsBay.ae
              </h1>
              
              <h2 className="text-xl md:text-2xl text-muted-foreground mb-2">
                B2B/B2C Платформа Автозапчастей
              </h2>
              
              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto">
                Закрытое профессиональное сообщество поставщиков и покупателей автозапчастей в ОАЭ
              </p>

              {/* Statistics Section */}
              <div className="mb-12">
                <StatisticsSection />
              </div>

              {/* Access Notice */}
              <div className="bg-muted border border-border rounded-lg p-6 mb-8">
                <p className="text-foreground font-medium">
                  Доступ только по регистрации
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Для доступа к платформе необходимо пройти авторизацию
                </p>
              </div>

              {/* Authentication Section */}
              <div className="max-w-md mx-auto">
                {user ? (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Добро пожаловать, {profile?.full_name || 'Участник'}!
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {profile?.user_type === 'seller' 
                          ? 'Управляйте своими автозапчастями и заказами'
                          : 'Просматривайте каталог автозапчастей'
                        }
                      </p>
                      <Link 
                        to={profile?.user_type === 'seller' ? '/seller/dashboard' : '/catalog'}
                        className="inline-block w-full"
                      >
                        <Button className="w-full">
                          {profile?.user_type === 'seller' ? 'Панель управления' : 'Открыть каталог'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <LoginForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Index;
