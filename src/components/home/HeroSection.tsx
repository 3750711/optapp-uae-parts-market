
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle, Car, Users, Shield } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-white via-blue-50/30 to-primary/5 relative overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-28 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0 z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 md:mb-8 leading-tight animate-fade-in">
            <span className="text-foreground">Оптовый рынок </span> 
            <span className="text-primary relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-primary/30 after:rounded-full">автозапчастей</span> 
            <span className="block mt-2 md:mt-3">
              <span className="text-secondary">partsbay.ae</span>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/90 mb-8 md:mb-10 max-w-lg mx-auto md:mx-0 animate-fade-in [animation-delay:300ms] leading-relaxed">
            B2B-маркетплейс, объединяющий продавцов и оптовых покупателей автозапчастей с рынков ОАЭ.
            <span className="block mt-2 font-medium text-primary">
              Проверенные поставщики • Прозрачные цены • Рейтинги и отзывы
            </span>
          </p>
          
          {/* Статистика */}
          <div className="flex justify-center md:justify-start gap-6 mb-8 animate-fade-in [animation-delay:500ms]">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100+</div>
              <div className="text-sm text-foreground/70">Продавцов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">5000+</div>
              <div className="text-sm text-foreground/70">Товаров</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-foreground/70">Поддержка</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 animate-fade-in [animation-delay:700ms]">
            <Button size="lg" className="group shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] bg-primary hover:bg-primary/90" asChild>
              <Link to="/catalog">
                <Car className="mr-2 h-5 w-5" />
                Перейти в каталог
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="group shadow-md hover:shadow-lg transition-all duration-300 border-2" asChild>
              <Link to="/buyer-guide" className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                Как покупать?
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="md:w-1/2 relative animate-fade-in [animation-delay:900ms]">
          <div className="relative mx-auto max-w-md">
            {/* Декоративные элементы */}
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-[-25px] left-[-25px] w-36 h-36 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-xl"></div>
            
            {/* Основная карточка */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl overflow-hidden border-0 relative z-10">
              <CardContent className="p-6">
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
                  <Car className="w-20 h-20 text-primary opacity-80 z-10" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    ONLINE
                  </div>
                </div>
                
                {/* Мини статистика в карточке */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-primary/5 rounded-lg p-3">
                    <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-sm font-medium">Продавцы</div>
                  </div>
                  <div className="bg-secondary/5 rounded-lg p-3">
                    <Shield className="w-5 h-5 text-secondary mx-auto mb-1" />
                    <div className="text-sm font-medium">Проверено</div>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <Car className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-sm font-medium">Запчасти</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Улучшенная декоративная волна */}
      <div className="absolute bottom-0 left-0 w-full h-16 md:h-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
          <path 
            fill="#f8fafc" 
            fillOpacity="1" 
            d="M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,192C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
