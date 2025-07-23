
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Users, Globe, Clock, Award, Star, CheckCircle, Lock, Eye } from 'lucide-react';

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
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-foreground/70">Товаров в каталоге</div>
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in [animation-delay:800ms]">
            <Button size="lg" className="group shadow-2xl hover:shadow-elevation-hover transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90 text-lg px-8 py-4" asChild>
              <Link to="/register">
                <Users className="mr-2 h-5 w-5" />
                Получить доступ
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 text-lg px-8 py-4" asChild>
              <Link to="/login">
                <Lock className="mr-2 h-5 w-5" />
                Уже есть аккаунт?
              </Link>
            </Button>
          </div>

          {/* Preview Card */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 animate-fade-in [animation-delay:1000ms] max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl"></div>
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 border border-gray-200">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-primary/10 rounded-full p-4">
                      <Eye className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Превью платформы</h3>
                  <p className="text-gray-600 mb-6">
                    Полный функционал доступен только зарегистрированным пользователям
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-4 text-center">
                      <div className="text-primary font-bold text-lg">Каталог</div>
                      <div className="text-sm text-gray-600">10,000+ товаров</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4 text-center">
                      <div className="text-secondary font-bold text-lg">Поставщики</div>
                      <div className="text-sm text-gray-600">150+ магазинов</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Что вы получите после регистрации</h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Эксклюзивные возможности для профессионалов автобизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                icon: Award,
                title: "Прозрачное ценообразование",
                description: "Никаких скрытых комиссий - только честные оптовые цены",
                color: "primary"
              },
              {
                icon: Users,
                title: "Персональный менеджер",
                description: "Для крупных заказов - индивидуальное сопровождение сделки",
                color: "secondary"
              },
              {
                icon: Clock,
                title: "Поддержка 24/7",
                description: "Техническая поддержка на русском языке круглосуточно",
                color: "primary"
              },
              {
                icon: Star,
                title: "Система рейтингов",
                description: "Отзывы и рейтинги помогут выбрать лучших поставщиков",
                color: "secondary"
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

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Почему профессионалы выбирают нас</h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Уникальные преимущества для успешного бизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                "Эксклюзивный доступ к рынку автозапчастей ОАЭ",
                "Прямые контакты с производителями и дистрибьюторами",
                "Система контроля качества и гарантий",
                "Логистическая поддержка и доставка",
                "Юридическое сопровождение сделок",
                "Персональные скидки для постоянных клиентов"
              ].map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-lg text-foreground/80">{benefit}</div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
              <Card className="relative bg-white/90 backdrop-blur-sm shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-primary mb-2">Присоединяйтесь</div>
                    <div className="text-lg text-foreground/70">к профессиональному сообществу</div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span>Регистрация</span>
                      <span className="font-bold text-primary">Бесплатно</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span>Доступ к каталогу</span>
                      <span className="font-bold text-primary">∞</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span>Поддержка</span>
                      <span className="font-bold text-primary">24/7</span>
                    </div>
                  </div>

                  <Button className="w-full group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" size="lg" asChild>
                    <Link to="/register">
                      <Users className="mr-2 h-5 w-5" />
                      Начать прямо сейчас
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
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
            Присоединяйтесь к тысячам профессионалов, которые уже используют нашу платформу
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
