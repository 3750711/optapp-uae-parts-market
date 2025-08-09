
import React from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

import BackButton from "@/components/navigation/BackButton";

const Contact = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <BackButton className="mb-6" fallback="/" />
        <h1 className="text-3xl font-bold text-center mb-12">Связаться с нами</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Отправьте сообщение</CardTitle>
              <CardDescription>
                Заполните форму, и мы свяжемся с вами в ближайшее время
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" placeholder="Введите ваше имя" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="example@mail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Тема</Label>
                <Input id="subject" placeholder="Тема сообщения" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Сообщение</Label>
                <Textarea 
                  id="message" 
                  placeholder="Опишите ваш вопрос подробнее..." 
                  rows={5}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-primary text-white hover:bg-primary/90">
                Отправить сообщение
              </Button>
            </CardFooter>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-primary p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-white mb-6">Контактные данные</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-3 text-white" />
                  <div>
                    <p className="font-medium text-white">Телефон</p>
                    <p className="text-white">+971 58 123 4567</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-3 text-white" />
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-white">info@partsbay.ae</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-white" />
                  <div>
                    <p className="font-medium text-white">Адрес</p>
                    <p className="text-white">Sheikh Zayed Road, Dubai, UAE</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 text-white" />
                  <div>
                    <p className="font-medium text-white">Время работы</p>
                    <p className="text-white">Пн-Пт: 9:00 - 18:00</p>
                    <p className="text-white">Сб: 10:00 - 15:00</p>
                    <p className="text-white">Вс: Выходной</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="relative h-72 bg-gray-200 rounded-lg overflow-hidden shadow">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">Карта будет здесь</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
