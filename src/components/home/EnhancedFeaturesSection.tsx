
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ShoppingCart, Info, ChevronRight, Shield, Award, Globe, Users, Clock, Star } from 'lucide-react';

const EnhancedFeaturesSection = () => {
  const features = [
    {
      icon: Store,
      title: "Для поставщиков",
      description: "Расширьте свой бизнес с помощью нашей платформы",
      benefits: [
        "Доступ к тысячам оптовых покупателей",
        "Бесплатное размещение товаров",
        "Профессиональные инструменты продаж",
        "Аналитика и отчетность"
      ],
      cta: "Стать поставщиком",
      link: "/seller-register",
      color: "primary",
      bgGradient: "from-primary/5 to-primary/10"
    },
    {
      icon: ShoppingCart,
      title: "Для покупателей",
      description: "Найдите нужные запчасти по лучшим ценам",
      benefits: [
        "Прямой контакт с поставщиками ОАЭ",
        "Оптовые цены без посредников",
        "Широкий выбор качественных запчастей",
        "Система рейтингов и отзывов"
      ],
      cta: "Начать покупки",
      link: "/catalog",
      color: "secondary",
      bgGradient: "from-secondary/5 to-secondary/10"
    },
    {
      icon: Info,
      title: "Наши преимущества",
      description: "Почему тысячи компаний выбирают нас",
      benefits: [
        "Более 150 проверенных поставщиков",
        "Прозрачная система рейтингов",
        "Поддержка на русском языке 24/7",
        "Юридическая поддержка сделок"
      ],
      cta: "Узнать больше",
      link: "/about",
      color: "primary",
      bgGradient: "from-primary/5 to-secondary/5"
    }
  ];

  const additionalFeatures = [
    {
      icon: Shield,
      title: "Безопасность",
      description: "Проверенные поставщики и гарантия качества"
    },
    {
      icon: Award,
      title: "Качество",
      description: "Только оригинальные запчасти от официальных дилеров"
    },
    {
      icon: Globe,
      title: "География",
      description: "Покрытие всех крупных рынков ОАЭ"
    },
    {
      icon: Users,
      title: "Сообщество",
      description: "Активное сообщество профессионалов"
    },
    {
      icon: Clock,
      title: "Скорость",
      description: "Быстрая обработка заказов и доставка"
    },
    {
      icon: Star,
      title: "Репутация",
      description: "Высокие рейтинги и положительные отзывы"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Main Features */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Эксклюзивные возможности для профессионалов
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Получите доступ к лучшим инструментам для развития вашего бизнеса
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className={`group hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 shadow-xl bg-gradient-to-br ${feature.bgGradient} animate-fade-in overflow-hidden relative`} style={{ animationDelay: `${index * 200}ms` }}>
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
              
              <CardContent className="p-8 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color === 'primary' ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-secondary/10 group-hover:bg-secondary/20'} transition-colors group-hover:scale-110 transform duration-300`}>
                  <feature.icon className={`h-8 w-8 ${feature.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-foreground/70 mb-6 leading-relaxed">{feature.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className={`mr-3 mt-1 text-lg font-bold ${feature.color === 'primary' ? 'text-primary' : 'text-secondary'}`}>•</span>
                      <span className="text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className={`w-full group/btn shadow-lg hover:shadow-xl transition-all duration-300 ${feature.color === 'primary' ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'}`} asChild>
                  <Link to={feature.link}>
                    {feature.cta}
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Дополнительные преимущества
          </h3>
          <p className="text-lg text-foreground/70">
            Что делает нас лучшим выбором для вашего бизнеса
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 hover:border-primary/30 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-foreground/70 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnhancedFeaturesSection;
