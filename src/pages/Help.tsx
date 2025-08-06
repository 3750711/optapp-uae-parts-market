
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
  Shield,
  User,
  Package,
  CreditCard,
  Settings
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useHelpData } from '@/hooks/useHelpData';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const { data: helpData, isLoading, error } = useHelpData();

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      HelpCircle,
      User,
      ShoppingCart,
      Package,
      CreditCard,
      Settings,
      Store,
      Shield
    };
    return iconMap[iconName] || HelpCircle;
  };

  // Filter FAQ categories based on search query
  const filteredCategories = helpData?.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.help_items?.some(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

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
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Загрузка FAQ...</p>
              </div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-destructive">
                  Ошибка при загрузке FAQ. Попробуйте обновить страницу.
                </p>
              </CardContent>
            </Card>
          ) : filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ? "По вашему запросу ничего не найдено" : "FAQ пуст"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon_name);
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.help_items?.map((item) => (
                          <AccordionItem key={item.id} value={`item-${item.id}`}>
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
                );
              })}
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
