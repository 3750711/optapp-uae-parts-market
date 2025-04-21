
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
import { Database } from "@/integrations/supabase/types";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const BuyerCreateOrder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    quantity: "1",
    sellerOptId: "",
    brand: "",
    model: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            sellerOptId: product.optid_created || "",
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

    setIsSubmitting(true);

    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('opt_id', formData.sellerOptId)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (!sellerData?.id) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти продавца с указанным OPT ID",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let resolvedProductId = productId;

      if (!productId) {
        const { data: insertedProducts, error: productError } = await supabase
          .from('products')
          .insert({
            title: formData.title,
            price: parseFloat(formData.price),
            brand: formData.brand,
            model: formData.model,
            seller_id: sellerData.id,
            seller_name: sellerData.full_name || 'Unknown',
            condition: 'new',
          })
          .select();

        if (productError) {
          console.error("Ошибка создания вспомогательного продукта:", productError);
          toast({
            title: "Ошибка",
            description: "Не удалось создать временный товар для заказа",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        resolvedProductId = insertedProducts?.[0]?.id;
      }

      const orderPayload = {
        title: formData.title,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        seller_id: sellerData.id,
        order_seller_name: sellerData.full_name || 'Unknown',
        seller_opt_id: formData.sellerOptId,
        buyer_id: user.id,
        buyer_opt_id: profile?.opt_id || null,
        brand: formData.brand,
        model: formData.model,
        status: 'created' as OrderStatus,
        order_created_type: productId ? 'ads_order' as OrderCreatedType : 'free_order' as OrderCreatedType,
        product_id: resolvedProductId || null,
      };

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select();

      if (orderError) throw orderError;

      toast({
        title: "Заказ создан",
        description: "Ваш заказ был успешно создан",
      });

      navigate('/orders');
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании заказа",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                    <Label>OPT_ID продавца</Label>
                    <Input 
                      value={formData.sellerOptId}
                      readOnly 
                      className="bg-gray-100"
                    />
                  </div>
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Создание..." : "Создать заказ"}
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
