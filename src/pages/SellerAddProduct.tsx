
import React from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const SellerAddProduct = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Информация о товаре</CardTitle>
              <CardDescription>
                Заполните все поля для размещения вашего товара на маркетплейсе
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название товара</Label>
                  <Input id="name" placeholder="Например: Передний бампер BMW X5 F15" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (AED)</Label>
                    <Input id="price" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Состояние</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите состояние" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новый</SelectItem>
                        <SelectItem value="used">Б/У</SelectItem>
                        <SelectItem value="refurbished">Восстановленный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Car Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Информация об автомобиле</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Марка</Label>
                    <Input id="brand" placeholder="Например: BMW" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Модель</Label>
                    <Input id="model" placeholder="Например: X5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Год выпуска</Label>
                    <Input id="year" placeholder="Например: 2018-2022" />
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea 
                  id="description" 
                  placeholder="Подробно опишите товар, его характеристики, состояние и т.д." 
                  rows={6}
                />
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Местоположение</Label>
                <Select>
                  <SelectTrigger>
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
              
              {/* Images */}
              <div className="space-y-2">
                <Label>Фотографии товара</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square">
                    <div className="text-3xl text-gray-300">+</div>
                    <p className="text-sm text-gray-500">Добавить фото</p>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square">
                    <div className="text-3xl text-gray-300">+</div>
                    <p className="text-sm text-gray-500">Добавить фото</p>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square">
                    <div className="text-3xl text-gray-300">+</div>
                    <p className="text-sm text-gray-500">Добавить фото</p>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square">
                    <div className="text-3xl text-gray-300">+</div>
                    <p className="text-sm text-gray-500">Добавить фото</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Добавьте до 8 фотографий. Первое фото будет главным в объявлении.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button variant="outline" className="border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white">
                Отмена
              </Button>
              <Button className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
                Опубликовать товар
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellerAddProduct;
