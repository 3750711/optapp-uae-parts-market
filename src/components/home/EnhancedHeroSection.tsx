
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, Users, Shield, Globe, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const EnhancedHeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-white via-blue-50/30 to-primary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl animate-pulse-soft"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-2xl animate-pulse-soft [animation-delay:1s]"></div>
      
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-32 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
              <Shield className="w-4 h-4 mr-2" />
              Эксклюзивная B2B платформа для профессионалов
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 leading-tight animate-fade-in [animation-delay:200ms]">
              <span className="text-foreground">Ваш прямой </span>
              <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent relative">
                доступ
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full"></div>
              </span>
              <span className="block mt-2">к рынку </span>
              <span className="text-secondary bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
                автозапчастей ОАЭ
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 mb-8 animate-fade-in [animation-delay:400ms] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Работайте напрямую с проверенными поставщиками из Дубая, Шарджи и Абу-Даби.
              <span className="block mt-2 font-semibold text-primary">
                Прозрачные цены • Качественный сервис • Надежные партнеры
              </span>
            </p>
            
            {/* Enhanced Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in [animation-delay:600ms]">
              {[
                { value: "150+", label: "Поставщиков", icon: Users, color: "primary" },
                { value: "10K+", label: "Товаров", icon: Car, color: "secondary" },
                { value: "3", label: "Эмирата", icon: Globe, color: "primary" },
                { value: "98%", label: "Качество", icon: Award, color: "secondary" }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${stat.color === 'primary' ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-secondary/10 group-hover:bg-secondary/20'} transition-colors`}>
                    <stat.icon className={`w-5 h-5 ${stat.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in [animation-delay:800ms]">
              <Button size="lg" className="group shadow-2xl hover:shadow-elevation-hover transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90 text-lg px-8 py-4" asChild>
                <Link to="/catalog">
                  <Car className="mr-2 h-5 w-5" />
                  Перейти в каталог
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 text-lg px-8 py-4" asChild>
                <Link to="/stores">
                  <Users className="mr-2 h-5 w-5" />
                  Поставщики
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right Content - Enhanced Interactive Card */}
          <div className="lg:w-1/2 relative animate-fade-in [animation-delay:1000ms]">
            <div className="relative max-w-md mx-auto">
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl animate-float"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-xl animate-float [animation-delay:2s]"></div>
              
              {/* Main Card */}
              <Card className="bg-white/90 backdrop-blur-sm shadow-2xl overflow-hidden border-0 relative z-10 hover:shadow-elevation-hover transition-all duration-500 hover:scale-105">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 text-center">
                    <div className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium mb-4">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      ONLINE
                    </div>
                    <h3 className="text-xl font-bold mb-2">PartsBay.ae</h3>
                    <p className="text-sm text-foreground/70">B2B Маркетплейс автозапчастей</p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {[
                        { label: "Продавцы", value: "150+", icon: Users, color: "primary" },
                        { label: "Товары", value: "10K+", icon: Car, color: "secondary" },
                        { label: "Рейтинг", value: "4.9", icon: Award, color: "primary" },
                        { label: "Рост", value: "+25%", icon: TrendingUp, color: "secondary" }
                      ].map((item, index) => (
                        <div key={index} className={`${item.color === 'primary' ? 'bg-primary/5' : 'bg-secondary/5'} rounded-xl p-4 text-center hover:scale-105 transition-transform`}>
                          <item.icon className={`w-6 h-6 ${item.color === 'primary' ? 'text-primary' : 'text-secondary'} mx-auto mb-2`} />
                          <div className="text-lg font-bold">{item.value}</div>
                          <div className="text-xs text-foreground/70">{item.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Action Button */}
                    <Button className="w-full group shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                      <Link to="/catalog">
                        <Globe className="mr-2 h-4 w-4" />
                        Исследовать платформу
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Wave */}
      <div className="absolute bottom-0 left-0 w-full h-20 md:h-24">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>
          <path 
            fill="url(#waveGradient)" 
            fillOpacity="1" 
            d="M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,192C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
