import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Car, Settings, Users, Award } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import { useAuth } from "@/contexts/AuthContext";

// Mock featured products data
const featuredProducts = [
  {
    id: "1",
    name: "Передний бампер BMW X5",
    price: 2500,
    image: "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=500&auto=format&fit=crop",
    condition: "Новый" as const,
    location: "Дубай",
    brand: "BMW",
    model: "X5",
    seller_name: "Auto Parts UAE"
  },
  {
    id: "2",
    name: "Двигатель Toyota Camry 2.5",
    price: 12000,
    image: "https://images.unsplash.com/photo-1579033014049-f33d9b13a1ce?q=80&w=500&auto=format&fit=crop",
    condition: "Восстановленный" as const,
    location: "Шарджа",
    brand: "Toyota",
    model: "Camry",
    seller_name: "Dubai Motors"
  },
  {
    id: "3",
    name: "Колесные диски R18 Mercedes",
    price: 3200,
    image: "https://images.unsplash.com/photo-1611921059263-39188082fb82?q=80&w=500&auto=format&fit=crop",
    condition: "Новый" as const,
    location: "Абу-Даби",
    brand: "Mercedes",
    model: "Various",
    seller_name: "Premium Auto Parts"
  },
  {
    id: "4",
    name: "Фары Lexus RX",
    price: 1800,
    image: "https://images.unsplash.com/photo-1582639510494-c80b5de9f148?q=80&w=500&auto=format&fit=crop",
    condition: "Б/У" as const,
    location: "Дубай",
    brand: "Lexus",
    model: "RX",
    seller_name: "Emirates Auto"
  }
];

const Index = () => {
  const { user, profile } = useAuth();
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-optapp-yellow to-yellow-400 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-optapp-dark mb-4">
                Автозапчасти из ОАЭ напрямую от поставщиков
              </h1>
              <p className="text-lg text-gray-800 mb-6">
                Качественные оригинальные и альтернативные запчасти для вашего автомобиля с доставкой
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Link to="/catalog">
                  <Button className="w-full sm:w-auto bg-optapp-dark text-white hover:bg-black">
                    Смотреть каталог
                  </Button>
                </Link>
                {!user && (
                  <Link to="/register">
                    <Button variant="outline" className="w-full sm:w-auto border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white">
                      Стать продавцом
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=500&auto=format&fit=crop" 
                alt="Автозапчасти"
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Почему OPTAPP?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-optapp-yellow p-4 rounded-full mb-4">
                <Car className="h-10 w-10 text-optapp-dark" />
              </div>
              <h3 className="text-xl font-bold mb-2">Широкий выбор деталей</h3>
              <p className="text-gray-600">
                Оригинальные и альтернативные запчасти для популярных марок автомобилей
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-optapp-yellow p-4 rounded-full mb-4">
                <Settings className="h-10 w-10 text-optapp-dark" />
              </div>
              <h3 className="text-xl font-bold mb-2">Гарантия качества</h3>
              <p className="text-gray-600">
                Все запчасти проверяются перед отправкой
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-optapp-yellow p-4 rounded-full mb-4">
                <Users className="h-10 w-10 text-optapp-dark" />
              </div>
              <h3 className="text-xl font-bold mb-2">Прямые поставки</h3>
              <p className="text-gray-600">
                Работаем напрямую с поставщиками из ОАЭ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Популярные товары</h2>
            <Link to="/catalog" className="text-optapp-yellow hover:underline font-medium">
              Смотреть все →
            </Link>
          </div>
          
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-optapp-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Станьте продавцом на OPTAPP
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Продавайте автозапчасти на самой быстрорастущей торговой платформе ОАЭ. 
            Получите доступ к тысячам клиентов.
          </p>
          {!user ? (
            <Link to="/register">
              <Button className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-400 px-8 py-6 text-lg">
                Начать продавать
              </Button>
            </Link>
          ) : profile?.user_type !== 'seller' ? (
            <Link to="/profile">
              <Button className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-400 px-8 py-6 text-lg">
                Стать продавцом
              </Button>
            </Link>
          ) : (
            <Link to="/seller/dashboard">
              <Button className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-400 px-8 py-6 text-lg">
                Перейти в панель продавца
              </Button>
            </Link>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
