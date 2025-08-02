
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import StatisticsSection from "@/components/home/StatisticsSection";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="min-h-screen bg-gradient-subtle">
          {/* Hero Section */}
          <section className="relative pt-20 pb-16 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                {/* Logo/Brand */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-8 shadow-elegant animate-fade-in-scale">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-in-up">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    PartsBay.ae
                  </span>
                </h1>

                {/* Elegant Tagline */}
                <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto animate-slide-in-up animation-delay-200">
                  Эксклюзивная платформа премиальных автозапчастей
                </p>

                {/* Statistics */}
                <div className="mb-16 animate-slide-in-up animation-delay-300">
                  <StatisticsSection />
                </div>

                {/* Auth Section */}
                <div className="max-w-md mx-auto animate-slide-in-up animation-delay-500">
                  {user ? (
                    <div className="bg-card/60 backdrop-blur-sm rounded-3xl shadow-floating border border-border/20 p-8">
                      <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-3">
                          Добро пожаловать, {profile?.full_name || 'Пользователь'}!
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          {profile?.user_type === 'seller' 
                            ? 'Управляйте своими товарами и заказами'
                            : 'Исследуйте премиальные автозапчасти'
                          }
                        </p>
                        <Link 
                          to={profile?.user_type === 'seller' ? '/seller/dashboard' : '/catalog'}
                          className="inline-block w-full"
                        >
                          <Button className="w-full h-12 bg-gradient-primary hover:hover-glow text-white font-medium rounded-xl text-base">
                            {profile?.user_type === 'seller' ? 'Панель управления' : 'Открыть каталог'}
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <LoginForm />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section for Non-authenticated */}
          {!user && (
            <section className="py-16 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10">
              <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
                    Присоединяйтесь к элитному сообществу
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 animate-fade-in animation-delay-100">
                    Получите доступ к эксклюзивным предложениям от проверенных поставщиков ОАЭ
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-200">
                    <Link to="/register">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-gradient-primary hover:hover-glow text-white px-8 py-4 text-lg rounded-xl shadow-elegant"
                      >
                        Стать клиентом
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    
                    <Link to="/seller-register">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg rounded-xl hover-lift"
                      >
                        Для поставщиков
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Index;
