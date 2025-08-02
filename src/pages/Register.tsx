import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Building2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { MultiStepRegistration } from '@/components/registration/MultiStepRegistration';
import { useLanguage } from '@/hooks/useLanguage';

const registerTranslations = {
  ru: {
    meta: {
      title: "Регистрация в PartsBay.ae - Лучшая B2B платформа автозапчастей в ОАЭ",
      description: "Зарегистрируйтесь в PartsBay.ae - ведущей B2B платформе автозапчастей в ОАЭ. Быстрая регистрация, выгодные цены, надежные поставщики.",
      keywords: "регистрация, автозапчасти ОАЭ, B2B платформа, PartsBay"
    },
    title: "Присоединяйтесь к PartsBay",
    subtitle: "Лучшая B2B платформа автозапчастей в ОАЭ",
    description: "Зарегистрируйтесь и получите доступ к тысячам автозапчастей от проверенных поставщиков"
  },
  en: {
    meta: {
      title: "Register at PartsBay.ae - Best B2B Auto Parts Platform in UAE",
      description: "Register at PartsBay.ae - leading B2B auto parts platform in UAE. Quick registration, competitive prices, reliable suppliers.",
      keywords: "registration, auto parts UAE, B2B platform, PartsBay"
    },
    title: "Join PartsBay",
    subtitle: "Best B2B Auto Parts Platform in UAE",
    description: "Register and get access to thousands of auto parts from verified suppliers"
  }
};

const Register = () => {
  const { language } = useLanguage();
  const t = registerTranslations[language];

  return (
    <>
      <Helmet>
        <title>{t.meta.title}</title>
        <meta name="description" content={t.meta.description} />
        <meta name="keywords" content={t.meta.keywords} />
        <link rel="canonical" href="https://partsbay.ae/register" />
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
                {t.title}
              </h1>
              
              <h2 className="text-xl md:text-2xl text-muted-foreground mb-2">
                {t.subtitle}
              </h2>
              
              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto">
                {t.description}
              </p>

              {/* Registration Form */}
              <div className="max-w-lg mx-auto">
                <MultiStepRegistration language={language} />
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Register;
