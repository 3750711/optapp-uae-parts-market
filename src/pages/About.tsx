
import React from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/SimpleAuthContext";

const About = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">О нас</h1>
          
          <div className="prose prose-lg mx-auto">
            <p className="text-xl text-gray-600 mb-6">
              OptApp - это современная платформа для торговли автозапчастями в ОАЭ.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Для покупателей</h3>
                <p className="text-gray-600">
                  Найдите нужные автозапчасти быстро и легко. 
                  Широкий выбор от проверенных продавцов.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Для продавцов</h3>
                <p className="text-gray-600">
                  Расширьте свой бизнес с помощью нашей платформы. 
                  Легкое управление товарами и заказами.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
