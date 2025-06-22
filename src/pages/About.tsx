
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShieldCheck, 
  Truck, 
  Award, 
  TrendingUp, 
  Users, 
  Globe, 
  MessageCircle, 
  Clock 
} from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';

const About = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-green-600" />,
      title: "Надежность",
      description: "Все продавцы проходят верификацию, гарантируя качество товаров и безопасность сделок."
    },
    {
      icon: <Truck className="h-8 w-8 text-blue-600" />,
      title: "Быстрая доставка",
      description: "Доставка по России и Казахстану через проверенные логистические компании."
    },
    {
      icon: <Award className="h-8 w-8 text-yellow-600" />,
      title: "Качество",
      description: "Только оригинальные запчасти от проверенных поставщиков с гарантией качества."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
      title: "Рост бизнеса",
      description: "Помогаем развивать ваш бизнес через эффективные инструменты продаж и аналитики."
    }
  ];

  const stats = [
    { label: "Активных продавцов", value: "500+" },
    { label: "Товаров в каталоге", value: "10,000+" },
    { label: "Довольных клиентов", value: "5,000+" },
    { label: "Городов доставки", value: "200+" }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            О платформе OptCargo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ведущая платформа для продажи автозапчастей, объединяющая продавцов и покупателей 
            по всей России и Казахстану
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Почему выбирают OptCargo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-12" />

        {/* Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Наша миссия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Мы создаем удобную и безопасную экосистему для торговли автозапчастями, 
                где каждый продавец может эффективно развивать свой бизнес, а покупатели 
                получают качественные товары по справедливым ценам.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                География работы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="outline" className="mr-2">Россия</Badge>
                <Badge variant="outline" className="mr-2">Казахстан</Badge>
              </div>
              <p className="text-muted-foreground mt-4">
                Доставка во все регионы через надежных логистических партнеров
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Свяжитесь с нами</CardTitle>
            <CardDescription>
              Есть вопросы? Мы готовы помочь!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>Telegram: @OptCargo_Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Поддержка 24/7</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Время ответа: обычно в течение 15 минут
            </p>
          </CardContent>
        </Card>

        {user && (
          <div className="mt-8 text-center">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-green-800">
                  Добро пожаловать на OptCargo! Вы уже являетесь частью нашего сообщества.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default About;
