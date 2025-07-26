import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, ShoppingCart, Store, Shield } from 'lucide-react';
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SellerRegister: React.FC = () => {
  return (
    <Layout>
      <div className="bg-white">
        {/* Hero section */}
        <section className="bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 py-12 md:py-24 lg:py-32 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 md:mb-8 leading-tight animate-fade-in">
                <span className="text-foreground">Станьте продавцом на </span> 
                <span className="text-primary relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-primary/30 after:rounded-full">partsbay.ae</span>
              </h1>
              <p className="text-base md:text-xl text-foreground/80 mb-8 md:mb-10 max-w-lg mx-auto md:mx-0 animate-fade-in [animation-delay:300ms]">
                Расширьте свой бизнес и привлеките новых клиентов, став частью ведущего B2B-маркетплейса автозапчастей в ОАЭ.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 animate-fade-in [animation-delay:600ms]">
                <Button 
                  size="lg" 
                  className="group shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] font-semibold text-base rounded-xl ring-offset-2 ring-primary/30 focus:ring-4" 
                  asChild
                >
                  <a href="#register-form" className="flex items-center gap-2">
                    <span>Начать сейчас</span>
                    <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative animate-fade-in [animation-delay:900ms]">
              <div className="relative mx-auto max-w-md">
                <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-secondary/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-[-15px] left-[-15px] w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                <Card className="bg-white shadow-elevation overflow-hidden border-0">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
                      <Store className="w-16 h-16 text-primary opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 w-full h-12 md:h-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
              <path fill="#f9fafb" fillOpacity="1" d="M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,192C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </section>

        {/* Benefits section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Преимущества для продавцов</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Benefit 1 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px]">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Доступ к крупной клиентской базе</h3>
                <p className="text-gray-600">Тысячи оптовых покупателей автозапчастей из России, Казахстана и других стран СНГ.</p>
              </div>
              
              {/* Benefit 2 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px]">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Бесплатное размещение</h3>
                <p className="text-gray-600">Никаких абонентских плат и скрытых комиссий. Размещайте свои товары бесплатно.</p>
              </div>
              
              {/* Benefit 3 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px]">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Безопасные сделки</h3>
                <p className="text-gray-600">Прозрачная система рейтингов и отзывов. Прямое взаимодействие с покупателями.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Как это работает</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Регистрация</h3>
                <p className="text-gray-600">Заполните форму регистрации и подтвердите email</p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Верификация</h3>
                <p className="text-gray-600">Пройдите быструю верификацию вашего бизнеса</p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Добавление товаров</h3>
                <p className="text-gray-600">Добавьте ваши товары в каталог маркетплейса</p>
              </div>
              
              {/* Step 4 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Получение заказов</h3>
                <p className="text-gray-600">Получайте заказы и связывайтесь с покупателями</p>
              </div>
            </div>
          </div>
        </section>

        {/* Registration form section */}
        <section id="register-form" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Зарегистрироваться как продавец</h2>
              <p className="text-center text-gray-600 mb-8">Заполните форму ниже и начните продавать свои автозапчасти на маркетплейсе partsbay.ae</p>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                    <Input 
                      id="fullName" 
                      placeholder="Введите ваше полное имя" 
                      className="w-full"
                      required
                    />
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="example@email.com" 
                      className="w-full"
                      required
                    />
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                    <Input 
                      id="phone" 
                      placeholder="+971 XX XXX XXXX" 
                      className="w-full"
                    />
                  </div>
                  
                  {/* Telegram */}
                  <div>
                    <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                    <Input 
                      id="telegram" 
                      placeholder="@username" 
                      className="w-full"
                    />
                  </div>
                  
                  {/* Company Name */}
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Название компании</label>
                    <Input 
                      id="companyName" 
                      placeholder="Введите название вашей компании" 
                      className="w-full"
                    />
                  </div>
                  
                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Локация в ОАЭ</label>
                    <Input 
                      id="location" 
                      placeholder="Например: Dubai, Sharjah" 
                      className="w-full"
                    />
                  </div>
                  
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Минимум 8 символов" 
                      className="w-full"
                      required
                    />
                  </div>
                  
                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Повторите пароль" 
                      className="w-full"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto md:px-12 group shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px]"
                  >
                    Зарегистрироваться
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  Уже зарегистрированы? <Link to="/seller-login" className="text-primary hover:underline">Войти как продавец</Link>
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Часто задаваемые вопросы</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {/* FAQ Item 1 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2">Сколько стоит размещение товаров?</h3>
                <p className="text-gray-600">Размещение товаров на платформе partsbay.ae абсолютно бесплатное. Никаких абонентских плат или скрытых комиссий.</p>
              </div>
              
              {/* FAQ Item 2 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2">Как я буду получать заказы?</h3>
                <p className="text-gray-600">Вы будете получать уведомления о новых заказах через платформу. Также покупатели смогут связываться с вами напрямую через указанные контакты.</p>
              </div>
              
              {/* FAQ Item 3 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2">Как долго занимает верификация?</h3>
                <p className="text-gray-600">Процесс верификации обычно занимает 1-2 рабочих дня. После подтверждения вы сможете начать добавлять свои товары.</p>
              </div>
              
              {/* FAQ Item 4 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2">Нужно ли мне быть в ОАЭ для регистрации?</h3>
                <p className="text-gray-600">Да, наша платформа работает только с продавцами, физически находящимися в ОАЭ и имеющими товарные запасы на территории страны.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/90 to-secondary/90 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Готовы расширить свой бизнес?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">Присоединяйтесь к partsbay.ae сегодня и начните продавать свои товары тысячам оптовых покупателей из России, Казахстана и других стран СНГ.</p>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary font-semibold text-base py-3 px-8 rounded-xl ring-offset-2 ring-white/30 focus:ring-4"
              asChild
            >
              <a href="#register-form" className="flex items-center gap-2">
                <span>Начать сейчас</span>
                <ArrowRight className="ml-1 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SellerRegister;
