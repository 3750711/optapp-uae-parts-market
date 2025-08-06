
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Users,
  ShoppingCart,
  Store,
  Shield
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqCategories = [
    {
      title: "Общие вопросы",
      icon: HelpCircle,
      items: [
        {
          question: "Что такое PartsBay.ae?",
          answer: "PartsBay.ae - это онлайн-платформа для покупки и продажи автозапчастей в ОАЭ. Мы соединяем покупателей с проверенными продавцами автозапчастей."
        },
        {
          question: "Как зарегистрироваться на платформе?",
          answer: "Нажмите кнопку 'Регистрация' в верхней части сайта, заполните форму с вашими данными и подтвердите email адрес."
        },
        {
          question: "Платная ли регистрация?",
          answer: "Регистрация на PartsBay.ae абсолютно бесплатная как для покупателей, так и для продавцов."
        }
      ]
    },
    {
      title: "Для покупателей",
      icon: ShoppingCart,
      items: [
        {
          question: "Как найти нужную запчасть?",
          answer: "Используйте поиск по каталогу, фильтры по марке, модели автомобиля, году выпуска или просто введите название запчасти в строку поиска."
        },
        {
          question: "Как сделать заказ?",
          answer: "Найдите нужный товар, нажмите 'Купить', заполните форму заказа с контактными данными и подтвердите заказ."
        },
        {
          question: "Как работает система запросов?",
          answer: "Если вы не нашли нужную запчасть, создайте запрос с описанием. Продавцы смогут предложить вам подходящие варианты."
        },
        {
          question: "Как связаться с продавцом?",
          answer: "На странице товара указаны контактные данные продавца. Также вы можете отправить сообщение через платформу."
        }
      ]
    },
    {
      title: "Для продавцов",
      icon: Store,
      items: [
        {
          question: "Как стать продавцом?",
          answer: "При регистрации выберите тип аккаунта 'Продавец', заполните информацию о вашем магазине и дождитесь подтверждения."
        },
        {
          question: "Как добавить товар?",
          answer: "В панели продавца нажмите 'Добавить товар', заполните описание, добавьте фотографии и укажите цену."
        },
        {
          question: "Какие комиссии берет платформа?",
          answer: "Размещение товаров бесплатное. Комиссия взимается только с успешных продаж и составляет 3-5% от суммы сделки."
        },
        {
          question: "Как получить статус 'Проверенный продавец'?",
          answer: "Подайте заявку на верификацию в панели продавца. Мы проверим ваши документы и репутацию."
        }
      ]
    },
    {
      title: "Безопасность",
      icon: Shield,
      items: [
        {
          question: "Как проверить надежность продавца?",
          answer: "Обращайте внимание на рейтинг продавца, отзывы покупателей и статус 'Проверенный продавец'."
        },
        {
          question: "Что делать при возникновении спора?",
          answer: "Обратитесь в службу поддержки через форму обратной связи или по телефону. Мы поможем решить конфликт."
        },
        {
          question: "Гарантируете ли вы качество товаров?",
          answer: "Мы проверяем продавцов, но ответственность за качество товара несет продавец. Всегда проверяйте товар при получении."
        }
      ]
    }
  ];

  const filteredFaq = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь будет отправка формы
    toast({
      title: "Сообщение отправлено",
      description: "Мы ответим вам в течение 24 часов"
    });
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Помощь и поддержка
          </h1>
          <p className="text-muted-foreground">
            Найдите ответы на часто задаваемые вопросы или свяжитесь с нами
          </p>
        </div>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
          
          {filteredFaq.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ? "По вашему запросу ничего не найдено" : "Вопросы загружаются..."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredFaq.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="h-5 w-5" />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.items.map((item, itemIndex) => (
                        <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                          <AccordionTrigger className="text-left">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Связаться с нами
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Телефон</p>
                  <p className="text-sm text-muted-foreground">+971 4 123 4567</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@partsbay.ae</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-3">Время работы</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Пн-Пт: 9:00 - 18:00</p>
                  <p>Сб: 9:00 - 15:00</p>
                  <p>Вс: выходной</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Обратная связь</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input
                  placeholder="Ваше имя"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                />
                <Input
                  placeholder="Тема сообщения"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Ваше сообщение"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  rows={4}
                  required
                />
                <Button type="submit" className="w-full">
                  Отправить сообщение
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Help;
