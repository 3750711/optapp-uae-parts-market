
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ShoppingCart, Store, Wallet, Package, MessageSquare, HelpCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const BuyerGuide = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col max-w-4xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-4 bg-primary/10 p-3 rounded-full">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Как покупать товар?</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Подробная инструкция для покупателей по использованию платформы PartsBay
            </p>
          </div>

          {/* Steps section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <span className="bg-primary/10 p-2 rounded-full mr-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </span>
                Пошаговая инструкция
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Step 1 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">Регистрация на платформе</h3>
                </div>
                <div className="ml-14">
                  <p className="text-muted-foreground">
                    Создайте аккаунт, чтобы получить доступ ко всем функциям платформы. Регистрация займет всего несколько минут.
                  </p>
                  <div className="mt-4 flex">
                    <Link 
                      to="/register" 
                      className="inline-flex items-center text-primary hover:underline font-medium"
                    >
                      Зарегистрироваться
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">Поиск товаров</h3>
                </div>
                <div className="ml-14">
                  <p className="text-muted-foreground">
                    Используйте каталог или поисковую систему для нахождения необходимых запчастей. Фильтры помогут уточнить поиск по марке и модели автомобиля.
                  </p>
                  <div className="mt-4 flex">
                    <Link 
                      to="/catalog" 
                      className="inline-flex items-center text-primary hover:underline font-medium"
                    >
                      Перейти в каталог
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Step 3 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">Связь с продавцом</h3>
                </div>
                <div className="ml-14">
                  <p className="text-muted-foreground">
                    После выбора товара, свяжитесь с продавцом для уточнения деталей. Вы можете увидеть контактную информацию продавца на странице товара.
                  </p>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <HelpCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm">
                          Обратите внимание: для связи с продавцом необходимо быть авторизованным пользователем. OPT ID продавца будет виден только после авторизации.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Step 4 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                    4
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">Создание запроса</h3>
                </div>
                <div className="ml-14">
                  <p className="text-muted-foreground">
                    Если вы не нашли нужную запчасть в каталоге, вы можете создать запрос на поиск запчасти. Продавцы смогут откликнуться на ваш запрос.
                  </p>
                  <div className="mt-4 flex">
                    <Link 
                      to="/requests/create" 
                      className="inline-flex items-center text-primary hover:underline font-medium"
                    >
                      Создать запрос
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Step 5 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                    5
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">Обсуждение условий и оплата</h3>
                </div>
                <div className="ml-14">
                  <p className="text-muted-foreground">
                    Обсудите с продавцом условия сделки: цена, доставка, сроки. После соглашения по всем вопросам, следуйте инструкциям продавца для оплаты.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Step 6 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                    6
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">Получение товара</h3>
                </div>
                <div className="ml-14">
                  <p className="text-muted-foreground">
                    Отслеживайте статус вашего заказа в личном кабинете. После получения товара вы можете оставить отзыв о продавце.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <span className="bg-primary/10 p-2 rounded-full mr-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </span>
                Часто задаваемые вопросы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Как узнать, что продавец надежный?</h4>
                <p className="text-muted-foreground">
                  Обратите внимание на рейтинг продавца, количество отзывов и статус верификации. Продавцы с высоким рейтингом и отметкой "OPT" являются проверенными поставщиками.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Что делать, если товар не соответствует описанию?</h4>
                <p className="text-muted-foreground">
                  Свяжитесь с продавцом для решения проблемы. Если продавец не идет на контакт, вы можете обратиться к администратору платформы.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Как организована доставка?</h4>
                <p className="text-muted-foreground">
                  Условия доставки обсуждаются индивидуально с продавцом. Вы можете выбрать удобный для вас способ доставки.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Можно ли вернуть товар?</h4>
                <p className="text-muted-foreground">
                  Условия возврата зависят от продавца. Рекомендуем обсудить этот вопрос до совершения покупки.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <span className="bg-primary/10 p-2 rounded-full mr-3">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </span>
                Поддержка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Если у вас остались вопросы, вы всегда можете обратиться к администратору платформы.
              </p>
              <a 
                href="https://t.me/ElenaOPTcargo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline font-medium"
              >
                Связаться с администратором
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerGuide;
