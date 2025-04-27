import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, User, Users, ChevronRight, Check } from 'lucide-react';

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

const Index = () => {
  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
        <div className="container mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              <span className="text-foreground">Оптовый рынок </span> 
              <span className="text-primary">автозапчастей</span> 
              <br className="hidden md:block" />
              <span className="text-secondary">в ОАЭ</span>
            </h1>
            <p className="text-lg text-foreground/80 mb-8 max-w-lg">
              PartsBay - платформа, объединяющая продавцов и покупателей автозапчастей. Здесь каждый найдет качественные товары, надежных партнеров и комфортный сервис.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Button size="lg" className="group">
                К каталогу
                <ChevronRight className="ml-1 transform group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Регистрация</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 relative animate-float">
            <div className="w-full h-80 md:h-96 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl shadow-elevation relative overflow-hidden">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-primary">OPTAPP</h3>
                  <p className="text-foreground/70 mt-2">Ваш надежный партнер</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Наши преимущества</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-100 p-6 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
              >
                <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-foreground/70">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="delivery" className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-xl shadow-elevation p-8 md:p-12 max-w-4xl mx-auto text-center animate-fade-in">
            <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full mb-6 mx-auto">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-6">Доставка по ОАЭ и миру</h2>
            <p className="max-w-2xl mx-auto text-foreground/70 mb-8 text-lg">
              Обеспечиваем быструю и надежную доставку заказов по всем регионам ОАЭ и за пределы страны. Корпоративным клиентам доступны специальные условия и индивидуальный подход.
            </p>
            <Button variant="outline" size="lg">Подробнее о доставке</Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div id="for-sellers" className="bg-primary/5 rounded-xl p-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg mb-5">
                <User className="text-primary" size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-6">Для продавцов</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">Бесплатная публикация товаров и доступ к широкой аудитории.</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">Удобная панель для управления товарами, заказами и продажами.</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">Поддержка и аналитика на всех этапах работы.</span>
                </li>
              </ul>
              <Button variant="default" asChild>
                <Link to="/register">Стать продавцом</Link>
              </Button>
            </div>
            
            <div id="for-buyers" className="bg-secondary/5 rounded-xl p-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 flex items-center justify-center bg-secondary/10 rounded-lg mb-5">
                <Users className="text-secondary" size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-6">Для покупателей</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">Быстрый поиск нужных запчастей и аксессуаров.</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">Прозрачные условия покупки и гарантия качества товаров.</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">Круглосуточная поддержка на всех этапах заказа.</span>
                </li>
              </ul>
              <Button variant="secondary" asChild>
                <Link to="/catalog">Перейти в каталог</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary to-primary-focus">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Готовы начать?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Присоединяйтесь к тысячам продавцов и покупателей на платформе PartsBay уже сегодня
          </p>
          <Button variant="secondary" size="lg" className="animate-pulse-soft" asChild>
            <Link to="/register">Зарегистрироваться</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
