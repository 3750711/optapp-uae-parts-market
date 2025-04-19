import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ImageUpload } from "@/components/ui/image-upload";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";

const BuyerCreateOrder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const [images, setImages] = useState<string[]>([]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    quantity: "1",
    sellerOptId: "",
    brand: "",
    model: "",
  });

  useEffect(() => {
    const fetchProductData = async () => {
      if (productId) {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить данные товара",
            variant: "destructive",
          });
          return;
        }

        if (product) {
          setFormData({
            title: product.title,
            price: product.price.toString(),
            quantity: "1",
            sellerOptId: product.optid_created || "", // Get seller's OPT_ID from product.optid_created
            brand: product.brand || "",
            model: product.model || "",
          });
        }
      }
    };

    fetchProductData();
  }, [productId]);

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

    if (!formData.title.trim()) {
      toast({
        title: "Ошибка",
        description: "Наименование обязательно для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Ошибка",
        description: "Укажите корректную цену",
        variant: "destructive",
      });
      return;
    }

    if (!formData.sellerOptId.trim()) {
      toast({
        title: "Ошибка",
        description: "OPT_ID продавца обязателен для заполнения",
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
          seller_opt_id: formData.sellerOptId,
          buyer_id: user.id,
          buyer_opt_id: profile?.opt_id || null,
          seller_name_order: "Неизвестный продавец",
          brand: formData.brand,
          model: formData.model,
          seller_id: user.id,
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

      setCreatedOrder(orderData);
      toast({
        title: "Заказ создан",
        description: "Ваш заказ был успешно создан",
      });
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

  const handleOrderUpdate = (updatedOrder: any) => {
    setCreatedOrder(updatedOrder);
  };

  if (createdOrder) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="mr-4"
            >
              На главную
            </Button>
            <Button 
              onClick={() => {
                setCreatedOrder(null);
                setFormData({
                  title: "",
                  price: "",
                  quantity: "1",
                  sellerOptId: "",
                  brand: "",
                  model: "",
                });
                setImages([]);
              }}
            >
              Создать новый заказ
            </Button>
          </div>
          <OrderConfirmationCard 
            order={createdOrder} 
            images={images}
            onOrderUpdate={handleOrderUpdate}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                    <Label htmlFor="title">Наименование *</Label>
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
                    <Label htmlFor="brand">Бренд</Label>
                    <Input 
                      id="brand" 
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Введите бренд"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Модель</Label>
                    <Input 
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="Введите модель"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (AED) *</Label>
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
                    <Label htmlFor="sellerOptId">OPT_ID продавца *</Label>
                    <Input 
                      id="sellerOptId"
                      value={formData.sellerOptId}
                      onChange={(e) => handleInputChange('sellerOptId', e.target.value)}
                      required
                      placeholder="Введите OPT_ID продавца"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>OPT_ID продавца</Label>
                  <Input 
                    value={formData.sellerOptId} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OPT_ID покупателя</Label>
                  <Input 
                    value={profile?.opt_id || ''} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Телеграм покупателя</Label>
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

export default BuyerCreateOrder;
