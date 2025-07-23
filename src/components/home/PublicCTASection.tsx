
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicCTASection = () => {
  const benefits = [
    "Доступ к эксклюзивным предложениям",
    "Прямые контакты с поставщиками",
    "Персональный менеджер",
    "Техподдержка на русском языке",
    "Безопасные сделки",
    "Аналитика и отчеты"
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-optapp-yellow to-optapp-yellow/80">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Готовы начать работу с PartsBay.ae?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Присоединяйтесь к тысячам компаний, которые уже работают с нами
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* For Buyers */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Для покупателей</h3>
              <div className="space-y-3 text-left">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-white/80" />
                    <span className="text-white/90">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full mt-6 bg-white text-optapp-yellow hover:bg-gray-100">
                <Link to="/register">
                  Начать покупки
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {/* For Sellers */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Для продавцов</h3>
              <div className="space-y-3 text-left">
                {benefits.slice(3).map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-white/80" />
                    <span className="text-white/90">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full mt-6 bg-white text-optapp-yellow hover:bg-gray-100">
                <Link to="/seller-register">
                  Стать продавцом
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          
          <p className="text-white/70 text-sm">
            Регистрация бесплатна и займет всего несколько минут
          </p>
        </div>
      </div>
    </section>
  );
};

export default PublicCTASection;
