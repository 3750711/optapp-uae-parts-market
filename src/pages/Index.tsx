
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import StatisticsSection from "@/components/home/StatisticsSection";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutomotiveCard } from "@/components/ui/automotive-card";
import usedPartsBg from "@/assets/used-parts-bg.jpg";

const Index = () => {
  const { user, profile } = useAuth();

  // Структурированные данные для SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PartsBay.ae",
    "url": "https://partsbay.ae",
    "logo": "https://partsbay.ae/logo.png",
    "description": "Элитная платформа для оптовых продаж автозапчастей в ОАЭ. Эксклюзивное сообщество проверенных поставщиков.",
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
        <title>PartsBay.ae - Элитная платформа автозапчастей</title>
        <meta 
          name="description" 
          content="Эксклюзивная платформа для премиальных автозапчастей в ОАЭ. Закрытое сообщество проверенных поставщиков." 
        />
        <meta 
          name="keywords" 
          content="премиум автозапчасти ОАЭ, элитные поставщики, эксклюзивная платформа" 
        />
        <link rel="canonical" href="https://partsbay.ae/" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Layout>
        {/* Hero Section with Clean White Background and Used Parts */}
        <section 
          className="relative min-h-screen pt-20 pb-16 overflow-hidden bg-white"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.95)), url(${usedPartsBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Clean Logo */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-automotive rounded-2xl mb-8 shadow-lg animate-fade-in">
                <Car className="w-10 h-10 text-white" />
              </div>

              {/* Simple Brand Heading */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-in-up text-gray-800">
                PartsBay.ae
              </h1>

              {/* Clean Tagline */}
              <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto animate-slide-in-up animation-delay-200">
                Платформа автозапчастей ОАЭ
              </p>

              {/* Statistics */}
              <div className="mb-16 animate-slide-in-up animation-delay-400">
                <StatisticsSection />
              </div>

              {/* Auth Section */}
              <div className="max-w-md mx-auto animate-slide-in-up animation-delay-600">
                {user ? (
                  <AutomotiveCard className="p-8 bg-white/80 backdrop-blur-sm border">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-automotive rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Car className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold mb-3 text-gray-800">
                        Добро пожаловать, {profile?.full_name || 'Участник'}!
                      </h2>
                      <p className="text-gray-600 mb-6">
                        {profile?.user_type === 'seller' 
                          ? 'Управляйте своими автозапчастями и заказами'
                          : 'Исследуйте каталог автозапчастей'
                        }
                      </p>
                      <Link 
                        to={profile?.user_type === 'seller' ? '/seller/dashboard' : '/catalog'}
                        className="inline-block w-full"
                      >
                        <Button className="w-full h-12 bg-gradient-automotive hover:shadow-lg text-white font-medium rounded-xl">
                          <Car className="w-5 h-5 mr-2" />
                          {profile?.user_type === 'seller' ? 'Панель управления' : 'Открыть каталог'}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </AutomotiveCard>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border p-6">
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
