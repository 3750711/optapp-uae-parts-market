
import React from 'react';
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import SEOHead from "@/components/seo/SEOHead";
import { ShoppingCart, ChevronRight, Store, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  // Structured Data для SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PartsBay.ae",
    "url": "https://partsbay.ae",
    "logo": "https://partsbay.ae/logo.png",
    "description": "B2B маркетплейс автозапчастей из ОАЭ",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AE",
      "addressRegion": "Dubai"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["Russian", "English", "Arabic"]
    },
    "sameAs": [
      "https://t.me/partsbay_ae"
    ]
  };

  return (
    <>
      <SEOHead
        title="PartsBay.ae - Оптовый рынок автозапчастей из ОАЭ | B2B Маркетплейс"
        description="Покупайте автозапчасти оптом напрямую у проверенных поставщиков из ОАЭ. Более 100 продавцов, 5000+ товаров, прозрачные цены и быстрая доставка."
        keywords="автозапчасти оптом ОАЭ, B2B маркетплейс автозапчастей, поставщики Дубай, оптовые продажи запчастей, PartsBay"
        canonicalUrl="https://partsbay.ae"
        structuredData={structuredData}
      />
      
      <Layout>
        <div className="bg-white">
          {/* Hero секция с улучшенным дизайном */}
          <HeroSection />

          {/* Секция "Как это работает" */}
          <HowItWorksSection />

          {/* Улучшенная секция функций */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Почему выбирают нас</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sellers Block */}
                <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10"></div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors relative z-10">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Продавцам</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-primary font-bold">•</span>
                      <span>Доступ к тысячам оптовых покупателей</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary font-bold">•</span>
                      <span>Бесплатное размещение товаров</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary font-bold">•</span>
                      <span>Инструменты управления продажами</span>
                    </li>
                  </ul>
                  <div className="mt-5">
                    <Link 
                      to="/seller-register"
                      className="text-primary hover:text-primary-hover transition-colors inline-flex items-center group-hover:translate-x-1 transform duration-200"
                    >
                      Стать продавцом
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
                
                {/* Buyers Block */}
                <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-10 -mt-10"></div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors relative z-10">
                    <ShoppingCart className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Покупателям</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-secondary font-bold">•</span>
                      <span>Прямой контакт с поставщиками из ОАЭ</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-secondary font-bold">•</span>
                      <span>Оптовые цены без посредников</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-secondary font-bold">•</span>
                      <span>Широкий выбор автозапчастей</span>
                    </li>
                  </ul>
                  <div className="mt-5">
                    <Link 
                      to="/catalog"
                      className="text-secondary hover:text-secondary-hover transition-colors inline-flex items-center group-hover:translate-x-1 transform duration-200"
                    >
                      Перейти в каталог
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
                
                {/* About Us Block */}
                <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10"></div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors relative z-10">
                    <Info className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">О нас</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-primary font-bold">•</span>
                      <span>Более 100 проверенных продавцов</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary font-bold">•</span>
                      <span>Прозрачная система рейтингов</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary font-bold">•</span>
                      <span>Техподдержка на русском языке</span>
                    </li>
                  </ul>
                  <div className="mt-5">
                    <Link 
                      to="/about"
                      className="text-primary hover:text-primary-hover transition-colors inline-flex items-center group-hover:translate-x-1 transform duration-200"
                    >
                      О компании
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Популярные товары с lazy loading */}
          <FeaturedProductsSection />
        </div>
      </Layout>
    </>
  );
};

export default Index;
