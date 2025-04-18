import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/ui/image-upload";

const SellerCreateOrder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [lotNumber, setLotNumber] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    quantity: "1",
    buyerOptId: "",
    brand: "Default Brand",
    model: "Default Model",
  });

  useEffect(() => {
    const fetchNextLotNumber = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('lot_number', { count: 'exact' })
          .order('lot_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setLotNumber(data ? data.lot_number + 1 : 8000);
      } catch (error) {
        console.error("Error fetching lot number:", error);
        setLotNumber(8000); // Default to 8000 if there's an error
      }
    };

    fetchNextLotNumber();
  }, []);

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
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          buyer_opt_id: formData.buyerOptId,
          seller_id: user.id,
          seller_opt_id: profile?.opt_id || null,
          seller_name_order: profile?.full_name || "Неизвестный продавец",
          brand: formData.brand,
          model: formData.model,
          buyer_id: user.id,
          lot_number: lotNumber || 8000,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (images.length > 0) {
        const { error: imagesError } = await supabase
          .from('order_images')
          .insert(
            images.map((url, index) => ({
              order_id: orderData.id,
              url,
              is_primary: index === 0
            }))
          );

        if (imagesError) throw imagesError;
      }

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

  const handleImageUpload = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const handleImageDelete = (urlToDelete: string) => {
    setImages(prev => prev.filter(url => url !== urlToDelete));
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
          {lotNumber && (
            <div className="text-center mb-8">
              <h2 className="text-6xl font-bold text-optapp-dark">
                № {lotNumber}
              </h2>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
              <CardDescription>
                Заполните необходимые поля для создания нового заказа
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Наименование</Label>
                    <Input 
                      id="title" 
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required 
                      placeholder="Введите наименование"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Количество мест</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      required 
                      min="1"
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
                    <Label htmlFor="buyerOptId">OPT_ID получателя</Label>
                    <Input 
                      id="buyerOptId"
                      value={formData.buyerOptId}
                      onChange={(e) => handleInputChange('buyerOptId', e.target.value)}
                      placeholder="Введите OPT_ID получателя"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>OPT_ID отправителя</Label>
                  <Input 
                    value={profile?.opt_id || ''} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Телеграм отправителя</Label>
                  <Input 
                    value={profile?.telegram || ''} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Фотографии заказа</Label>
                  <ImageUpload
                    images={images}
                    onUpload={handleImageUpload}
                    onDelete={handleImageDelete}
                    maxImages={5}
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
