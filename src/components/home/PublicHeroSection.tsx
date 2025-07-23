
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Store, TrendingUp, Shield, Clock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicHeroSection = () => {
  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-optapp-yellow/10 rounded-full"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full"></div>
      
      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-800 leading-tight">
                Оптовый рынок
                <span className="text-optapp-yellow"> автозапчастей</span>
                <br />
                из ОАЭ
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Покупайте автозапчасти оптом напрямую у проверенных поставщиков из Дубая. 
                Более 100 продавцов, 5000+ товаров, прозрачные цены.
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-optapp-yellow">100+</div>
                <div className="text-sm text-gray-600">Продавцов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-optapp-yellow">5000+</div>
                <div className="text-sm text-gray-600">Товаров</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-optapp-yellow">24/7</div>
                <div className="text-sm text-gray-600">Поддержка</div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-optapp-yellow hover:bg-optapp-yellow/90 text-white">
                <Link to="/register">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Начать покупки
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/seller-register">
                  <Store className="h-5 w-5 mr-2" />
                  Стать продавцом
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right content - Preview */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Каталог автозапчастей</h3>
                  <div className="bg-optapp-yellow/10 text-optapp-yellow px-3 py-1 rounded-full text-sm font-medium">
                    Требуется регистрация
                  </div>
                </div>
                
                {/* Blurred preview items */}
                <div className="space-y-3 relative">
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Shield className="h-8 w-8 text-optapp-yellow mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Доступно после регистрации</p>
                    </div>
                  </div>
                  
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="text-optapp-yellow font-semibold">$***</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHeroSection;
