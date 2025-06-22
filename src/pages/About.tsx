import React from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/SimpleAuthContext";

const About = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">О компании PartsBay.ae</h1>
          <div className="mb-12 text-center">
            <p className="text-lg text-gray-600">
              Инновационный маркетплейс автозапчастей из Объединенных Арабских Эмиратов
            </p>
          </div>
          
          {/* Our Story */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Наша история</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="mb-4">
                PartsBay.ae начал свою деятельность в 2023 году с простой идеи – создать надежную платформу для покупки и продажи качественных автозапчастей из ОАЭ. Мы заметили потребность рынка в прозрачной и удобной системе, которая соединяет поставщиков и покупателей автомобильных запчастей.
              </p>
              <p>
                Сегодня PartsBay.ae – это быстрорастущая платформа, соединяющая сотни продавцов и тысячи клиентов. Мы стремимся к постоянному совершенствованию и расширению предлагаемых услуг, чтобы обеспечить максимальное удобство для всех участников нашего маркетплейса.
              </p>
            </div>
          </div>
          
          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Наша миссия</h2>
              <p>
                Облегчить процесс поиска и покупки автозапчастей, обеспечивая высокое качество обслуживания как для покупателей, так и для продавцов. Мы стремимся создать прозрачный и честный рынок, где каждый может найти именно то, что ему нужно.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Наше видение</h2>
              <p>
                Стать лидирующей платформой на рынке автозапчастей ОАЭ, известной своей надежностью, широким ассортиментом и высоким уровнем клиентского сервиса. Мы стремимся к постоянным инновациям и развитию для удовлетворения потребностей всех наших клиентов.
              </p>
            </div>
          </div>
          
          {/* Values */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Наши ценности</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start bg-white rounded-lg shadow-md p-6">
                <div className="mr-4 p-2 bg-primary/10 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Качество и надежность</h3>
                  <p className="text-gray-600">Мы тщательно проверяем всех продавцов, чтобы гарантировать высокое качество товаров и услуг.</p>
                </div>
              </div>
              
              <div className="flex items-start bg-white rounded-lg shadow-md p-6">
                <div className="mr-4 p-2 bg-primary/10 rounded-full">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Быстрая доставка</h3>
                  <p className="text-gray-600">Мы стремимся обеспечить быструю и надежную доставку всех заказов.</p>
                </div>
              </div>
              
              <div className="flex items-start bg-white rounded-lg shadow-md p-6">
                <div className="mr-4 p-2 bg-primary/10 rounded-full">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Высокий сервис</h3>
                  <p className="text-gray-600">Мы предоставляем отличный клиентский сервис и техническую поддержку.</p>
                </div>
              </div>
              
              <div className="flex items-start bg-white rounded-lg shadow-md p-6">
                <div className="mr-4 p-2 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Постоянное развитие</h3>
                  <p className="text-gray-600">Мы постоянно совершенствуем нашу платформу и расширяем ассортимент.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="bg-primary rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Станьте частью PartsBay.ae!</h2>
            <p className="mb-6 text-white">
              Присоединяйтесь к нашей платформе сегодня и испытайте все преимущества надежной торговой площадки автозапчастей.
            </p>
            <div className="flex justify-center space-x-4">
              {!user && (
                <a href="/register" className="bg-white text-primary font-medium py-2 px-6 rounded shadow hover:shadow-lg">
                  Регистрация
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
