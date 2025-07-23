
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Users, Globe, Star, CheckCircle, TrendingUp, Clock } from 'lucide-react';

const PublicLandingPage = () => {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-primary/5 min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 lg:py-28">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
            <Shield className="w-4 h-4 mr-2" />
            Эксклюзивная B2B платформа для профессионалов
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight animate-fade-in [animation-delay:200ms]">
            <span className="text-foreground">Прямой доступ к </span>
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              поставщикам
            </span>
            <span className="block text-secondary">автозапчастей ОАЭ</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 animate-fade-in [animation-delay:400ms] leading-relaxed">
            Получите доступ к крупнейшему B2B маркетплейсу автозапчастей региона.
            <span className="block mt-2 font-semibold text-primary">
              Только для зарегистрированных профессионалов
            </span>
          </p>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-fade-in [animation-delay:600ms]">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">150+</div>
              <div className="text-sm text-foreground/70">Проверенных поставщиков</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-foreground/70">Активных компаний</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">3</div>
              <div className="text-sm text-foreground/70">Эмирата покрытия</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-foreground/70">Поддержка на русском</div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-in [animation-delay:800ms]">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Для покупателей</h3>
                <p className="text-primary text-lg font-semibold">Найдите поставщика за 5 минут</p>
                <p className="text-sm text-foreground/70 mt-2">Прямой доступ к 150+ проверенным поставщикам из ОАЭ</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Для продавцов</h3>
                <p className="text-secondary text-lg font-semibold">Получите первых клиентов за 24 часа</p>
                <p className="text-sm text-foreground/70 mt-2">Доступ к активной базе покупателей автозапчастей</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in [animation-delay:1000ms]">
            <Button size="lg" className="group shadow-2xl hover:shadow-elevation-hover transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90 text-lg px-8 py-4" asChild>
              <Link to="/register">
                <Users className="mr-2 h-5 w-5" />
                Получить доступ
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 text-lg px-8 py-4" asChild>
              <Link to="/login">
                Уже есть аккаунт?
              </Link>
            </Button>
          </div>

          {/* Urgency Notice */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 mb-12 animate-fade-in [animation-delay:1200ms]">
            <div className="flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-primary mr-2" />
              <span className="text-xl font-bold">Ограниченное количество приглашений</span>
            </div>
            <p className="text-foreground/70 mb-4">
              Мы принимаем только проверенных профессионалов для поддержания высокого качества сервиса
            </p>
            <div className="text-sm text-primary font-medium">
              🔥 Присоединяйтесь к 500+ компаниям уже работающим на платформе
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Что вы получите после регистрации</h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Эксклюзивные возможности для профессионалов автобизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Прямой доступ к ОАЭ",
                description: "Работайте напрямую с поставщиками из Дубая, Шарджи и Абу-Даби",
                color: "primary"
              },
              {
                icon: Shield,
                title: "Проверенные поставщики",
                description: "Все продавцы проходят многоуровневую проверку и имеют рейтинги",
                color: "secondary"
              },
              {
                icon: Users,
                title: "Персональный менеджер",
                description: "Для крупных заказов - индивидуальное сопровождение сделки",
                color: "primary"
              }
            ].map((feature, index) => (
              <Card key={index} className={`group hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 shadow-lg animate-fade-in`} style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${feature.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'} group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8 ${feature.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-foreground/70">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы начать работу с лучшими поставщиками?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Присоединяйтесь к профессионалам, которые уже используют нашу платформу
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group shadow-2xl hover:shadow-elevation-hover transition-all duration-300 hover:scale-105 text-lg px-8 py-4" asChild>
              <Link to="/register">
                <Users className="mr-2 h-5 w-5" />
                Зарегистрироваться
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4" asChild>
              <Link to="/login">
                Войти в систему
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicLandingPage;
