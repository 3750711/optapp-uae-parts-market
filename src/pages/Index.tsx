
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, User, Users } from 'lucide-react';

const FEATURES = [
  {
    title: 'Широкий каталог товаров',
    icon: <ShoppingCart className="text-violet-500" size={32} />,
    desc: 'Огромный выбор запасных частей и аксессуаров от надежных поставщиков.'
  },
  {
    title: 'Быстрая доставка',
    icon: <Truck className="text-yellow-500" size={32} />,
    desc: 'Экспресс-доставка по ОАЭ и в любые города. Надежно, удобно, быстро.'
  },
  {
    title: 'Преимущества для продавцов',
    icon: <User className="text-green-500" size={32} />,
    desc: 'Лёгкая загрузка товаров, широкая аудитория, удобные инструменты для управления заказами.'
  },
  {
    title: 'Платформа для покупателей',
    icon: <Users className="text-blue-500" size={32} />,
    desc: 'Простая система поиска и оформления заказа. Гарантия качества и поддержки сделок.'
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5DEFF] via-white to-[#D3E4FD]">
      {/* Верхнее меню */}
      <header className="bg-white/90 shadow-md sticky top-0 z-20">
        <nav className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
          <Link to="/" className="text-3xl font-extrabold text-indigo-700 tracking-tight drop-shadow">OPTAPP</Link>
          <div className="flex items-center gap-3">
            <Link to="/catalog">
              <Button variant="ghost" className="flex items-center gap-2 text-base text-gray-700 hover:text-violet-600">
                <ShoppingCart className="w-5 h-5" /> Каталог
              </Button>
            </Link>
            <a href="#delivery" className="no-underline">
              <Button variant="ghost" className="flex items-center gap-2 text-base text-gray-700 hover:text-yellow-600">
                <Truck className="w-5 h-5" /> Доставка
              </Button>
            </a>
            <a href="#for-sellers" className="no-underline">
              <Button variant="ghost" className="flex items-center gap-2 text-base text-gray-700 hover:text-green-600">
                <User className="w-5 h-5" /> Для продавцов
              </Button>
            </a>
            <a href="#for-buyers" className="no-underline">
              <Button variant="ghost" className="flex items-center gap-2 text-base text-gray-700 hover:text-blue-600">
                <Users className="w-5 h-5" /> Для покупателей
              </Button>
            </a>
            <Link to="/login">
              <Button variant="secondary" className="ml-2">Вход</Button>
            </Link>
            <Link to="/register">
              <Button variant="default" className="ml-2 bg-violet-500 hover:bg-violet-600">Регистрация</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Основной блок */}
      <main className="container mx-auto px-4 py-12">
        <section className="text-center py-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-indigo-700 drop-shadow">Оптовый рынок автозапчастей и аксессуаров в ОАЭ</h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-7 max-w-2xl mx-auto">
            Платформа, соединяющая продавцов и покупателей автозапчастей. Здесь каждый найдёт качественные товары, выгодные условия и удобный сервис.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link to="/catalog">
              <Button size="lg" className="bg-violet-500 hover:bg-violet-600 text-white px-8 py-4 text-lg shadow">
                К каталогу
              </Button>
            </Link>
            <Link to="/admin">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg shadow">
                Панель администратора
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
          {FEATURES.map((f, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl transition">
              {f.icon}
              <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-900">{f.title}</h2>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </section>

        <section id="delivery" className="bg-[#FEF7CD] rounded-2xl shadow-md p-8 my-12 mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">Доставка по всему миру</h2>
          <p className="text-gray-800 text-lg mb-2">
            Мы обеспечиваем быструю и надежную доставку во все регионы ОАЭ и за пределы страны. Следите за заказом онлайн. Для корпоративных клиентов доступны специальные условия!
          </p>
        </section>

        <section id="for-sellers" className="bg-[#F2FCE2] rounded-2xl shadow-md p-8 my-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-green-700 mb-2">Для продавцов</h2>
          <ul className="list-disc text-gray-800 ml-6 mt-2 space-y-2 text-left">
            <li>Публикуйте товары бесплатно и получайте доступ к тысячам покупателей.</li>
            <li>Удобная панель управления заказами и продажами.</li>
            <li>Аналитика, отчеты и поддержка на всех этапах.</li>
          </ul>
          <div className="mt-4 flex justify-center">
            <Link to="/register">
              <Button className="bg-green-500 hover:bg-green-600 text-white">Стать продавцом</Button>
            </Link>
          </div>
        </section>

        <section id="for-buyers" className="bg-[#D3E4FD] rounded-2xl shadow-md p-8 my-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Для покупателей</h2>
          <ul className="list-disc text-gray-800 ml-6 mt-2 space-y-2 text-left">
            <li>Быстрый поиск нужных запчастей и аксессуаров.</li>
            <li>Прозрачные условия покупки и гарантированное качество товаров.</li>
            <li>Поддержка на всех этапах заказа и доставки.</li>
          </ul>
          <div className="mt-4 flex justify-center">
            <Link to="/catalog">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Перейти в каталог</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;

