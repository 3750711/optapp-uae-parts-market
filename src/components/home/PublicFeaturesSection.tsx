
import React from 'react';
import { Shield, Clock, Globe, TrendingUp, Users, Headphones } from 'lucide-react';

const PublicFeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Проверенные поставщики",
      description: "Все продавцы проходят тщательную проверку. Система рейтингов и отзывов гарантирует качество.",
      color: "text-green-600"
    },
    {
      icon: Clock,
      title: "Быстрая доставка",
      description: "Прямые поставки из ОАЭ. Логистические решения для быстрой доставки по всему миру.",
      color: "text-blue-600"
    },
    {
      icon: Globe,
      title: "Международная торговля",
      description: "Работаем с покупателями из разных стран. Поддержка множества валют и языков.",
      color: "text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Оптовые цены",
      description: "Прямые контакты с производителями. Никаких посредников - только выгодные цены.",
      color: "text-optapp-yellow"
    },
    {
      icon: Users,
      title: "B2B сообщество",
      description: "Присоединяйтесь к сообществу профессионалов автомобильного бизнеса.",
      color: "text-indigo-600"
    },
    {
      icon: Headphones,
      title: "Поддержка 24/7",
      description: "Наша команда всегда готова помочь. Поддержка на русском, английском и арабском языках.",
      color: "text-red-600"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Почему выбирают PartsBay.ae?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Мы создали платформу, которая объединяет надежных поставщиков и серьезных покупателей автозапчастей
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
              <div className={`w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicFeaturesSection;
