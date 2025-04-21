
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, User, Users } from 'lucide-react';

const FEATURES = [
  {
    title: 'Широкий каталог товаров',
    icon: <ShoppingCart className="text-yellow-400" size={32} />,
    desc: 'Огромный выбор автозапчастей и аксессуаров от надежных поставщиков.'
  },
  {
    title: 'Быстрая доставка',
    icon: <Truck className="text-yellow-400" size={32} />,
    desc: 'Экспресс-доставка по ОАЭ и в любые города. Надежно, удобно, быстро.'
  },
  {
    title: 'Преимущества для продавцов',
    icon: <User className="text-yellow-400" size={32} />,
    desc: 'Удобная работа с товарами, широкий круг покупателей и полный контроль заказов.'
  },
  {
    title: 'Удобство для покупателей',
    icon: <Users className="text-yellow-400" size={32} />,
    desc: 'Простая система поиска, прозрачные условия и гарантия качества.'
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Верхнее меню */}
      <header className="bg-white shadow-md sticky top-0 z-30 border-b border-gray-200">
        <nav className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link to="/" className="text-3xl font-extrabold text-yellow-500 tracking-tight drop-shadow-md">
            OPTAPP
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/catalog">
              <Button variant="ghost" className="text-black hover:text-yellow-500 flex items-center gap-1">
                <ShoppingCart size={18} /> Каталог
              </Button>
            </Link>
            <a href="#delivery" className="no-underline">
              <Button variant="ghost" className="text-black hover:text-yellow-500 flex items-center gap-1">
                <Truck size={18} /> Доставка
              </Button>
            </a>
            <a href="#for-sellers" className="no-underline">
              <Button variant="ghost" className="text-black hover:text-yellow-500 flex items-center gap-1">
                <User size={18} /> Для продавцов
              </Button>
            </a>
            <a href="#for-buyers" className="no-underline">
              <Button variant="ghost" className="text-black hover:text-yellow-500 flex items-center gap-1">
                <Users size={18} /> Для покупателей
              </Button>
            </a>
          </div>
        </nav>
      </header>

      {/* Основной контент */}
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        <section className="text-center max-w-3xl mx-auto mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-500 drop-shadow-lg mb-6 leading-tight">
            Оптовый рынок автозапчастей и аксессуаров в ОАЭ
          </h1>
          <p className="text-lg text-gray-900 mb-8">
            Платформа, объединяющая продавцов и покупателей автозапчастей. Здесь каждый найдет качественные товары, надежных партнеров и комфортный сервис.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link to="/catalog">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-10 py-4 shadow-lg">
                К каталогу
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black font-bold px-10 py-4 shadow-lg">
                Регистрация
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-20">
          {FEATURES.map((feature, idx) => (
            <article key={idx} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl transition-shadow duration-300">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-700">{feature.desc}</p>
            </article>
          ))}
        </section>

        <section id="delivery" className="bg-yellow-50 border border-yellow-300 rounded-3xl max-w-4xl mx-auto p-10 mb-20 text-center text-yellow-900 shadow-md">
          <h2 className="text-3xl font-bold mb-4">Доставка по ОАЭ и миру</h2>
          <p className="max-w-xl mx-auto">
            Обеспечиваем быструю и надежную доставку заказов по всем регионам ОАЭ и за пределы страны. Корпоративным клиентам доступны специальные условия и индивидуальный подход.
          </p>
        </section>

        <section id="for-sellers" className="bg-yellow-50 border border-yellow-300 rounded-3xl max-w-4xl mx-auto p-10 mb-20 shadow-md text-yellow-900">
          <h2 className="text-3xl font-bold mb-6 text-center">Для продавцов</h2>
          <ul className="list-disc list-inside text-left space-y-3 max-w-lg mx-auto">
            <li>Бесплатная публикация товаров и доступ к широкой аудитории.</li>
            <li>Удобная панель для управления товарами, заказами и продажами.</li>
            <li>Поддержка и аналитика на всех этапах работы.</li>
          </ul>
          <div className="flex justify-center mt-8">
            <Link to="/register">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 rounded-lg shadow-md">
                Стать продавцом
              </Button>
            </Link>
          </div>
        </section>

        <section id="for-buyers" className="bg-yellow-50 border border-yellow-300 rounded-3xl max-w-4xl mx-auto p-10 mb-12 shadow-md text-yellow-900">
          <h2 className="text-3xl font-bold mb-6 text-center">Для покупателей</h2>
          <ul className="list-disc list-inside text-left space-y-3 max-w-lg mx-auto">
            <li>Быстрый поиск нужных запчастей и аксессуаров.</li>
            <li>Прозрачные условия покупки и гарантия качества товаров.</li>
            <li>Круглосуточная поддержка на всех этапах заказа.</li>
          </ul>
          <div className="flex justify-center mt-8">
            <Link to="/catalog">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 rounded-lg shadow-md">
                Перейти в каталог
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
