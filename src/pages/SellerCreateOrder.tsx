
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Phone, CalendarClock, Truck, MapPin } from "lucide-react";

const SellerCreateOrder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    price: "",
    buyerId: "", 
    lotNumber: Math.floor(Math.random() * 1000) + 7000,
    description: "",
    city: "",
    deliveryDate: "",
    customerName: "",
    customerPhone: "",
    address: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания заказа",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          title: formData.title,
          brand: formData.brand,
          model: formData.model,
          price: parseFloat(formData.price),
          buyer_id: formData.buyerId || user.id,
          seller_id: user.id,
          lot_number: formData.lotNumber,
          description: formData.description,
          seller_name_order: profile?.full_name || "Неизвестный продавец"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast({
        title: "Заказ создан",
        description: "Ваш заказ был успешно создан",
      });

      navigate("/seller/dashboard");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании заказа",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Создать заказ</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
              <CardDescription>
                Заполните все необходимые поля для создания нового заказа
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Basic Order Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Наименование товара</Label>
                      <Input 
                        id="title" 
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required 
                        placeholder="Введите наименование товара"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lotNumber">Номер лота</Label>
                      <Input 
                        id="lotNumber" 
                        value={formData.lotNumber}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Марка</Label>
                      <Input 
                        id="brand" 
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        required 
                        placeholder="Введите марку"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Модель</Label>
                      <Input 
                        id="model" 
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        required 
                        placeholder="Введите модель"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Цена (AED)</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        required 
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Город</Label>
                      <Input 
                        id="city" 
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Введите город"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2">
                  <Label htmlFor="description">Описание товара</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Введите описание товара"
                    rows={4}
                  />
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Информация о покупателе</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Имя покупателя</Label>
                      <Input 
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        placeholder="Введите имя покупателя"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Телефон покупателя</Label>
                      <Input 
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        placeholder="Введите телефон покупателя"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Дополнительные заметки</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Введите дополнительную информацию"
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Отмена
                </Button>
                <Button 
                  type="submit"
                  className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                >
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
