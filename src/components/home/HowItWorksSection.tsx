
import React from 'react';
import { Search, MessageCircle, Truck, CheckCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      title: "Найдите товар",
      description: "Используйте поиск или фильтры по марке и модели автомобиля",
      color: "bg-blue-500"
    },
    {
      icon: MessageCircle,
      title: "Свяжитесь с продавцом",
      description: "Обсудите детали заказа напрямую с поставщиком из ОАЭ",
      color: "bg-green-500"
    },
    {
      icon: Truck,
      title: "Оформите доставку",
      description: "Согласуйте логистику и способ доставки в вашу страну",
      color: "bg-orange-500"
    },
    {
      icon: CheckCircle,
      title: "Получите товар",
      description: "Отследите посылку и получите качественные автозапчасти",
      color: "bg-purple-500"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Как это работает</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Простой процесс покупки автозапчастей оптом от проверенных поставщиков из ОАЭ
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                {/* Номер шага */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                  {index + 1}
                </div>
                
                {/* Иконка */}
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Заголовок */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                
                {/* Описание */}
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                
                {/* Соединительная линия (кроме последнего элемента) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-300 transform -translate-y-1/2">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <p className="text-gray-600 mb-4">Есть вопросы о процессе покупки?</p>
          <a 
            href="/buyer-guide" 
            className="text-primary hover:text-primary/80 font-medium underline transition-colors"
          >
            Подробное руководство для покупателей →
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
