
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/ProductCard";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, User, Package, UserCheck, ShoppingCart } from "lucide-react";

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
}

const AdminCreateOrderFromProduct = () => {
  const [step, setStep] = useState(1);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Загрузка продавцов
  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, opt_id, telegram")
        .eq("user_type", "seller")
        .not("full_name", "is", null)
        .order("full_name");

      if (error) {
        console.error("Error fetching sellers:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список продавцов",
          variant: "destructive",
        });
      } else {
        setSellers(data || []);
      }
    };

    fetchSellers();
  }, []);

  // Загрузка покупателей
  useEffect(() => {
    const fetchBuyers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, opt_id, telegram")
        .eq("user_type", "buyer")
        .not("opt_id", "is", null)
        .order("full_name");

      if (error) {
        console.error("Error fetching buyers:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список покупателей",
          variant: "destructive",
        });
      } else {
        setBuyers(data || []);
      }
    };

    fetchBuyers();
  }, []);

  // Загрузка товаров выбранного продавца
  useEffect(() => {
    if (selectedSeller) {
      const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("seller_id", selectedSeller.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching products:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить товары продавца",
            variant: "destructive",
          });
        } else {
          setProducts(data || []);
        }
        setIsLoading(false);
      };

      fetchProducts();
    }
  }, [selectedSeller]);

  const handleSellerSelect = (sellerId: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    setSelectedSeller(seller || null);
    setSelectedProduct(null);
    setStep(2);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setStep(3);
  };

  const handleBuyerSelect = (buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    setSelectedBuyer(buyer || null);
    setStep(4);
  };

  const createOrder = async () => {
    if (!selectedSeller || !selectedProduct || !selectedBuyer) {
      toast({
        title: "Ошибка",
        description: "Не все данные заполнены",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Используем RPC функцию для создания заказа администратором
      const { data: orderId, error: orderError } = await supabase
        .rpc('admin_create_order', {
          p_title: selectedProduct.title,
          p_price: selectedProduct.price,
          p_place_number: 1,
          p_seller_id: selectedSeller.id,
          p_order_seller_name: selectedSeller.full_name,
          p_seller_opt_id: selectedSeller.opt_id,
          p_buyer_id: selectedBuyer.id,
          p_brand: selectedProduct.brand || '',
          p_model: selectedProduct.model || '',
          p_status: 'seller_confirmed',
          p_order_created_type: 'product_order',
          p_telegram_url_order: selectedBuyer.telegram || null,
          p_images: [],
          p_product_id: selectedProduct.id,
          p_delivery_method: 'self_pickup',
          p_text_order: null,
          p_delivery_price_confirm: selectedProduct.delivery_price || null
        });

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      // Обновляем статус товара на "sold"
      const { error: updateError } = await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', selectedProduct.id);

      if (updateError) {
        console.error("Error updating product status:", updateError);
        toast({
          title: "Предупреждение",
          description: "Заказ создан, но статус товара не обновился",
          variant: "destructive",
        });
      }

      toast({
        title: "Заказ создан",
        description: `Заказ #${orderId} успешно создан`,
      });

      // Сброс формы
      setSelectedSeller(null);
      setSelectedProduct(null);
      setSelectedBuyer(null);
      setProducts([]);
      setStep(1);

    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании заказа",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const resetForm = () => {
    setSelectedSeller(null);
    setSelectedProduct(null);
    setSelectedBuyer(null);
    setProducts([]);
    setStep(1);
  };

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return <User className="h-4 w-4" />;
      case 2: return <Package className="h-4 w-4" />;
      case 3: return <UserCheck className="h-4 w-4" />;
      case 4: return <ShoppingCart className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Создание заказа из товара</h1>
          <p className="text-gray-600 mt-2">
            Выберите продавца, товар и покупателя для создания заказа
          </p>
        </div>

        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[
              { num: 1, title: "Продавец", completed: step > 1 },
              { num: 2, title: "Товар", completed: step > 2 },
              { num: 3, title: "Покупатель", completed: step > 3 },
              { num: 4, title: "Создание", completed: false }
            ].map((stepItem, index) => (
              <React.Fragment key={stepItem.num}>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step === stepItem.num 
                      ? 'border-primary bg-primary text-white' 
                      : stepItem.completed 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-500'
                  }`}>
                    {getStepIcon(stepItem.num)}
                  </div>
                  <span className={`text-sm font-medium ${
                    step === stepItem.num ? 'text-primary' : stepItem.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </span>
                </div>
                {index < 3 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Шаг 1: Выбор продавца */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 1: Выберите продавца</CardTitle>
              <CardDescription>
                Выберите продавца, товар которого хотите продать
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="seller">Продавец</Label>
                <Select onValueChange={handleSellerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите продавца" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.full_name} ({seller.opt_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Шаг 2: Выбор товара */}
        {step === 2 && selectedSeller && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 2: Выберите товар</CardTitle>
              <CardDescription>
                Товары продавца: {selectedSeller.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Загрузка товаров...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  У данного продавца нет активных товаров
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="aspect-square mb-3 bg-gray-100 rounded overflow-hidden">
                        {product.product_images?.[0] ? (
                          <img
                            src={product.product_images[0].url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.title}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">${product.price}</span>
                        <Badge variant="secondary">{product.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Назад
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Шаг 3: Выбор покупателя */}
        {step === 3 && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 3: Выберите покупателя</CardTitle>
              <CardDescription>
                Товар: {selectedProduct.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="buyer">Покупатель</Label>
                <Select onValueChange={handleBuyerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите покупателя" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.id}>
                        {buyer.full_name} ({buyer.opt_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-6 flex space-x-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Назад
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Шаг 4: Подтверждение и создание заказа */}
        {step === 4 && selectedSeller && selectedProduct && selectedBuyer && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 4: Подтверждение заказа</CardTitle>
              <CardDescription>
                Проверьте данные перед созданием заказа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Информация о продавце */}
              <div>
                <h3 className="font-semibold mb-2">Продавец</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Имя:</strong> {selectedSeller.full_name}</p>
                  <p><strong>OPT ID:</strong> {selectedSeller.opt_id}</p>
                  {selectedSeller.telegram && (
                    <p><strong>Telegram:</strong> @{selectedSeller.telegram}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Информация о товаре */}
              <div>
                <h3 className="font-semibold mb-2">Товар</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Название:</strong> {selectedProduct.title}</p>
                  <p><strong>Цена:</strong> ${selectedProduct.price}</p>
                  {selectedProduct.brand && (
                    <p><strong>Бренд:</strong> {selectedProduct.brand}</p>
                  )}
                  {selectedProduct.model && (
                    <p><strong>Модель:</strong> {selectedProduct.model}</p>
                  )}
                  {selectedProduct.delivery_price && (
                    <p><strong>Стоимость доставки:</strong> ${selectedProduct.delivery_price}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Информация о покупателе */}
              <div>
                <h3 className="font-semibold mb-2">Покупатель</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Имя:</strong> {selectedBuyer.full_name}</p>
                  <p><strong>OPT ID:</strong> {selectedBuyer.opt_id}</p>
                  {selectedBuyer.telegram && (
                    <p><strong>Telegram:</strong> @{selectedBuyer.telegram}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Назад
                </Button>
                <Button 
                  onClick={createOrder} 
                  disabled={isCreatingOrder}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreatingOrder ? "Создание..." : "Создать заказ"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Начать заново
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCreateOrderFromProduct;
