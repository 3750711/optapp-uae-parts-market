
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from "@/components/layout/Layout";
import EnhancedHeroSection from "@/components/home/EnhancedHeroSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import EnhancedFeaturesSection from "@/components/home/EnhancedFeaturesSection";
import PublicLandingPage from "@/components/home/PublicLandingPage";
import SEOHead from "@/components/seo/SEOHead";

const Index = () => {
  const { user } = useAuth();

  // Structured Data для SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PartsBay.ae",
    "url": "https://partsbay.ae",
    "logo": "https://partsbay.ae/logo.png",
    "description": "Эксклюзивная B2B платформа для профессионалов автобизнеса. Прямой доступ к поставщикам автозапчастей из ОАЭ.",
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
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "150"
    }
  };

  // SEO для неавторизованных пользователей
  const publicSEO = {
    title: "PartsBay.ae - Эксклюзивная B2B платформа автозапчастей ОАЭ | Доступ только для профессионалов",
    description: "Получите эксклюзивный доступ к крупнейшему B2B маркетплейсу автозапчастей ОАЭ. 150+ проверенных поставщиков, прямые поставки из Дубая, прозрачные цены. Только для зарегистрированных профессионалов.",
    keywords: "B2B автозапчасти ОАЭ, эксклюзивная платформа, поставщики Дубай, профессиональный маркетплейс, регистрация поставщиков, оптовые закупки"
  };

  // SEO для авторизованных пользователей
  const memberSEO = {
    title: "PartsBay.ae - Ваш личный кабинет | B2B Маркетплейс автозапчастей",
    description: "Добро пожаловать в PartsBay.ae! Исследуйте каталог, работайте с поставщиками, управляйте заказами. Полный доступ к B2B платформе автозапчастей из ОАЭ.",
    keywords: "личный кабинет, каталог автозапчастей, заказы, поставщики ОАЭ, B2B платформа"
  };

  const seoData = user ? memberSEO : publicSEO;

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl="https://partsbay.ae"
        structuredData={structuredData}
      />
      
      {user ? (
        // Контент для авторизованных пользователей (БЕЗ "Последние опубликованные товары")
        <Layout>
          <div className="bg-white">
            <EnhancedHeroSection />
            <HowItWorksSection />
            <EnhancedFeaturesSection />
          </div>
        </Layout>
      ) : (
        // Контент для неавторизованных пользователей (сокращенный)
        <Layout>
          <PublicLandingPage />
        </Layout>
      )}
    </>
  );
};

export default Index;
