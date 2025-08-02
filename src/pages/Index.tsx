
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import StatisticsSection from "@/components/home/StatisticsSection";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Car, Settings, Wrench, Cog, Shield, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutomotiveCard } from "@/components/ui/automotive-card";
import { AutomotiveBackground } from "@/components/ui/automotive-background";

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
        <AutomotiveBackground type="hero" className="min-h-screen">
          {/* Hero Section */}
          <section className="relative pt-20 pb-16 overflow-hidden">
            {/* Professional Automotive Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent-automotive/8"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-automotive opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 animate-automotive-float"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-metallic opacity-15 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 animate-automotive-float" style={{ animationDelay: '1s' }}></div>
            
            {/* Floating automotive elements */}
            <div className="absolute top-1/4 left-1/4 text-6xl text-primary/5 animate-automotive-float">
              <Settings />
            </div>
            <div className="absolute top-3/4 right-1/4 text-5xl text-accent-automotive/5 animate-automotive-float" style={{ animationDelay: '2s' }}>
              <Cog />
            </div>
            <div className="absolute top-1/2 right-1/6 text-4xl text-secondary/5 animate-automotive-float" style={{ animationDelay: '3s' }}>
              <Wrench />
            </div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-5xl mx-auto text-center">
                {/* Premium Automotive Logo */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-automotive rounded-3xl mb-8 shadow-metallic animate-fade-in-scale group">
                  <div className="relative">
                    <Car className="w-12 h-12 text-white animate-engine-pulse" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-chrome rounded-full flex items-center justify-center">
                      <Wrench className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Premium Brand Heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-in-up">
                  <span className="bg-gradient-automotive bg-clip-text text-transparent drop-shadow-lg">
                    PartsBay.ae
                  </span>
                </h1>

                {/* Automotive Tagline */}
                <p className="text-xl md:text-3xl text-muted-foreground mb-4 leading-relaxed max-w-3xl mx-auto animate-slide-in-up animation-delay-200 font-medium">
                  Эксклюзивная платформа премиальных автозапчастей ОАЭ
                </p>
                
                {/* Premium subtitle */}
                <div className="flex items-center justify-center gap-4 mb-16 animate-slide-in-up animation-delay-300">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/80 uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    Сертифицированное качество
                  </div>
                  <div className="w-2 h-2 bg-gradient-automotive rounded-full"></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/80 uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    Премиум поставщики
                  </div>
                </div>

                {/* Enhanced Statistics */}
                <div className="mb-20 animate-slide-in-up animation-delay-400">
                  <StatisticsSection />
                </div>

                {/* Premium Auth Section */}
                <div className="max-w-md mx-auto animate-slide-in-up animation-delay-600">
                  {user ? (
                    <AutomotiveCard metallic glowing className="p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-automotive rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-metallic">
                          <Car className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3 bg-gradient-automotive bg-clip-text text-transparent">
                          Добро пожаловать, {profile?.full_name || 'Участник'}!
                        </h2>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          {profile?.user_type === 'seller' 
                            ? 'Управляйте своими премиальными автозапчастями и заказами'
                            : 'Исследуйте эксклюзивный каталог автозапчастей премиум-класса'
                          }
                        </p>
                        <Link 
                          to={profile?.user_type === 'seller' ? '/seller/dashboard' : '/catalog'}
                          className="inline-block w-full"
                        >
                          <Button className="w-full h-12 bg-gradient-automotive hover:shadow-glow text-white font-medium rounded-xl text-base hover-lift">
                            <Car className="w-5 h-5 mr-2" />
                            {profile?.user_type === 'seller' ? 'Панель управления' : 'Открыть каталог'}
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </AutomotiveCard>
                  ) : (
                    <LoginForm />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Premium CTA Section for Non-authenticated */}
          {!user && (
            <section className="py-20 relative overflow-hidden">
              {/* Automotive background pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-gradient-automotive/20 via-transparent to-gradient-metallic/20"></div>
              <div className="absolute inset-0 bg-gradient-chrome opacity-5"></div>
              
              <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                  <div className="mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-3 mb-6">
                      <Settings className="w-8 h-8 text-accent-automotive animate-engine-pulse" />
                      <h2 className="text-4xl md:text-5xl font-bold bg-gradient-automotive bg-clip-text text-transparent">
                        Присоединяйтесь к элитному автосообществу
                      </h2>
                      <Wrench className="w-8 h-8 text-accent-automotive animate-automotive-float" />
                    </div>
                    <p className="text-xl text-muted-foreground mb-12 animate-fade-in animation-delay-100 max-w-3xl mx-auto leading-relaxed">
                      Получите эксклюзивный доступ к премиальным автозапчастям от проверенных поставщиков ОАЭ
                    </p>
                  </div>
                  
                  {/* Premium Features Grid */}
                  <div className="grid md:grid-cols-3 gap-6 mb-12 animate-fade-in animation-delay-200">
                    <AutomotiveCard hover3d className="p-6 text-center">
                      <Shield className="w-10 h-10 text-accent-automotive mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Сертифицированное качество</h3>
                      <p className="text-sm text-muted-foreground">Только оригинальные запчасти премиум-класса</p>
                    </AutomotiveCard>
                    <AutomotiveCard hover3d className="p-6 text-center">
                      <Award className="w-10 h-10 text-accent-automotive mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Проверенные поставщики</h3>
                      <p className="text-sm text-muted-foreground">Элитная сеть автомобильных партнеров</p>
                    </AutomotiveCard>
                    <AutomotiveCard hover3d className="p-6 text-center">
                      <Car className="w-10 h-10 text-accent-automotive mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Премиум сервис</h3>
                      <p className="text-sm text-muted-foreground">Индивидуальное обслуживание клиентов</p>
                    </AutomotiveCard>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in animation-delay-300">
                    <Link to="/register">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-gradient-automotive hover:shadow-glow text-white px-10 py-5 text-lg rounded-xl shadow-metallic hover-lift"
                      >
                        <Car className="w-6 h-6 mr-3" />
                        Стать клиентом
                        <ArrowRight className="w-6 h-6 ml-3" />
                      </Button>
                    </Link>
                    
                    <Link to="/seller-register">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full sm:w-auto border-2 border-accent-automotive text-accent-automotive hover:bg-gradient-automotive hover:text-white px-10 py-5 text-lg rounded-xl hover-lift shadow-elegant"
                      >
                        <Wrench className="w-6 h-6 mr-3" />
                        Для поставщиков
                        <Settings className="w-6 h-6 ml-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </AutomotiveBackground>
      </Layout>
    </>
  );
};

export default Index;
