
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, User, Users, ChevronRight, Check, Clock, ShoppingBag, Award, Send } from 'lucide-react';
import Layout from "@/components/layout/Layout";

const FEATURES = [
  {
    title: 'Широкий каталог товаров',
    icon: <ShoppingCart className="text-primary" size={24} />,
    desc: 'Огромный выбор автозапчастей и аксессуаров от надежных поставщиков.'
  },
  {
    title: 'Быстрая доставка',
    icon: <Truck className="text-primary" size={24} />,
    desc: 'Экспресс-доставка по ОАЭ и в любые города. Надежно, удобно, быстро.'
  },
  {
    title: 'Преимущества для продавцов',
    icon: <User className="text-primary" size={24} />,
    desc: 'Удобная работа с товарами, широкий круг покупателей и полный контроль заказов.'
  },
  {
    title: 'Удобство для покупателей',
    icon: <Users className="text-primary" size={24} />,
    desc: 'Простая система поиска, прозрачные условия и гарантия качества.'
  }
];

// Request parts promo component
const RequestPartsPromo = () => (
  <div className="relative overflow-hidden rounded-xl mb-8 mt-4 md:mb-12 md:mt-6 p-4 md:p-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-fade-in">
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
    
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Не можете найти нужную запчасть?</h2>
        <div className="text-white/90 max-w-2xl space-y-2 md:space-y-3">
          <p className="text-base md:text-lg font-medium leading-relaxed animate-fade-in" style={{animationDelay: '100ms'}}>
            <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent font-semibold">Оставьте запрос и получите предложения от 100+ продавцов</span> — быстро и без лишних усилий!
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-amber-200" />
              </div>
              <p className="text-xs md:text-sm">Предложения за минуты</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-amber-200" />
              </div>
              <p className="text-xs md:text-sm">Огромный выбор</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Award className="h-3 w-3 md:h-4 md:w-4 text-amber-200" />
              </div>
              <p className="text-xs md:text-sm">Лучшие цены</p>
            </div>
          </div>
        </div>
      </div>
      
      <Button size={window.innerWidth < 768 ? "sm" : "lg"} className="group relative w-full md:w-auto overflow-hidden bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg" asChild>
        <Link to="/requests/create">
          <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
          <Send className="mr-2 h-4 w-4" />
          <span className="whitespace-nowrap">Оставить запрос</span>
        </Link>
      </Button>
    </div>
  </div>
);

const Index = () => {
  return (
    <Layout>
      <div className="bg-background">
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
          <div className="container mx-auto px-4 py-12 md:px-6 md:py-20 lg:py-32 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0 animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold mb-4 md:mb-6 leading-tight">
                <span className="text-foreground">Оптовый рынок </span> 
                <span className="text-primary">автозапчастей</span> 
                <span className="block mt-1 md:mt-2">
                  <span className="text-secondary">partsbay.ae</span>
                </span>
              </h1>
              <p className="text-base md:text-lg text-foreground/80 mb-6 md:mb-8 max-w-lg">
                PartsBay - платформа, объединяющая продавцов и покупателей автозапчастей. Здесь каждый найдет качественные товары, надежных партнеров и комфортный сервис.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 md:gap-4">
                <Button size="lg" className="group w-full sm:w-auto" asChild>
                  <Link to="/catalog">
                    К каталогу
                    <ChevronRight className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to="/register">Регистрация</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative animate-float">
              <div className="w-full h-60 md:h-80 lg:h-96 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl shadow-elevation relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-primary">OPTAPP</h3>
                    <p className="text-foreground/70 mt-2">Ваш надежный партнер</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <RequestPartsPromo />
            
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-16">Наши преимущества</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {FEATURES.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-100 p-4 md:p-6 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-primary/10 rounded-lg mb-3 md:mb-5">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">{feature.title}</h3>
                  <p className="text-sm md:text-base text-foreground/70">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="delivery" className="py-12 md:py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="bg-white rounded-xl shadow-elevation p-6 md:p-8 lg:p-12 max-w-4xl mx-auto text-center animate-fade-in">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-primary/10 rounded-full mb-4 md:mb-6 mx-auto">
                <Truck className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Доставка по ОАЭ и миру</h2>
              <p className="max-w-2xl mx-auto text-foreground/70 mb-6 md:mb-8 text-base md:text-lg">
                Обеспечиваем быструю и надежную доставку заказов по всем регионам ОАЭ и за пределы страны. Корпоративным клиентам доступны специальные условия и индивидуальный подход.
              </p>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Подробнее о доставке</Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div id="for-sellers" className="bg-primary/5 rounded-xl p-6 md:p-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-primary/10 rounded-lg mb-4 md:mb-5">
                  <User className="text-primary" size={24} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Для продавцов</h2>
                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base text-foreground/70">Бесплатная публикация товаров и доступ к широкой аудитории.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base text-foreground/70">Удобная панель для управления товарами, заказами и продажами.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base text-foreground/70">Поддержка и аналитика на всех этапах работы.</span>
                  </li>
                </ul>
                <Button variant="default" className="w-full sm:w-auto" asChild>
                  <Link to="/register">Стать продавцом</Link>
                </Button>
              </div>
              
              <div id="for-buyers" className="bg-secondary/5 rounded-xl p-6 md:p-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-secondary/10 rounded-lg mb-4 md:mb-5">
                  <Users className="text-secondary" size={24} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Для покупателей</h2>
                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base text-foreground/70">Быстрый поиск нужных запчастей и аксессуаров.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base text-foreground/70">Прозрачные условия покупки и гарантия качества товаров.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base text-foreground/70">Круглосуточная поддержка на всех этапах заказа.</span>
                  </li>
                </ul>
                <Button variant="secondary" className="w-full sm:w-auto" asChild>
                  <Link to="/catalog">Перейти в каталог</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gradient-to-br from-primary to-primary-focus">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">Готовы начать?</h2>
            <p className="text-white/80 mb-6 md:mb-8 max-w-lg mx-auto text-sm md:text-base">
              Присоединяйтесь к тысячам продавцов и покупателей на платформе PartsBay уже сегодня
            </p>
            <Button variant="secondary" size="lg" className="animate-pulse-soft w-full sm:w-auto" asChild>
              <Link to="/register">Зарегистрироваться</Link>
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
