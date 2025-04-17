
import React from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const SellerCreateOrder = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // This is a placeholder for actual order submission
    toast({
      title: "Заказ создан",
      description: "Ваш заказ был успешно создан",
    });
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Создать заказ</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
              <CardDescription>
                Заполните все поля для создания нового заказа
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Информация о клиенте</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Имя клиента</Label>
                      <Input id="customerName" placeholder="Иван Иванов" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Телефон клиента</Label>
                      <Input id="customerPhone" placeholder="+7 999 123 45 67" />
                    </div>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Информация о товаре</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="product">Выберите товар</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите товар из вашего каталога" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product1">Передний бампер BMW X5 F15</SelectItem>
                        <SelectItem value="product2">Фара левая Mercedes-Benz GLE</SelectItem>
                        <SelectItem value="product3">Дверь задняя правая Audi Q7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Количество</Label>
                      <Input id="quantity" type="number" min="1" defaultValue="1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Цена (AED)</Label>
                      <Input id="price" type="number" placeholder="0.00" />
                    </div>
                  </div>
                </div>
                
                {/* Shipping Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Информация о доставке</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Адрес доставки</Label>
                    <Textarea id="address" placeholder="Полный адрес доставки" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Город</Label>
                      <Select>
                        <SelectTrigger id="city">
                          <SelectValue placeholder="Выберите город" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dubai">Дубай</SelectItem>
                          <SelectItem value="abudhabi">Абу-Даби</SelectItem>
                          <SelectItem value="sharjah">Шарджа</SelectItem>
                          <SelectItem value="ajman">Аджман</SelectItem>
                          <SelectItem value="rak">Рас-эль-Хайма</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDate">Дата доставки</Label>
                      <Input id="deliveryDate" type="date" />
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Дополнительная информация</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Комментарии к заказу, особенности доставки и т.д." 
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4">
                <Button variant="outline" className="border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white" type="button">
                  Отмена
                </Button>
                <Button className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500" type="submit">
                  Создать заказ
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellerCreateOrder;
