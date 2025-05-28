
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package, UserCheck, ShoppingCart, ChevronLeft } from "lucide-react";
import ProductSearchAndFilters, { SearchFilters } from "@/components/admin/ProductSearchAndFilters";
import AdminOrderConfirmationDialog from "@/components/admin/AdminOrderConfirmationDialog";
import { useNavigate } from "react-router-dom";
import { ConfirmationImagesUploadDialog } from "@/components/admin/ConfirmationImagesUploadDialog";
import { useAuth } from "@/contexts/AuthContext";

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
  lot_number: number;
}

const SellerSellProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConfirmImagesDialog, setShowConfirmImagesDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Проверяем, что пользователь - продавец
  useEffect(() => {
    if (profile && profile.user_type !== 'seller') {
      toast({
        title: "Ошибка доступа",
        description: "Эта страница доступна только продавцам",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [profile, navigate]);

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

  // Загрузка товаров текущего продавца
  useEffect(() => {
    if (user) {
      const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("seller_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching products:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить ваши товары",
            variant: "destructive",
          });
        } else {
          setProducts(data || []);
          setFilteredProducts(data || []);
        }
        setIsLoading(false);
      };

      fetchProducts();
    }
  }, [user]);

  const handleSearchChange = (filters: SearchFilters) => {
    let filtered = [...products];

    // Фильтр по названию
    if (filters.searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Фильтр по номеру лота
    if (filters.lotNumber.trim()) {
      filtered = filtered.filter(product =>
        product.lot_number.toString().includes(filters.lotNumber)
      );
    }

    // Фильтр по цене от
    if (filters.priceFrom.trim()) {
      const priceFrom = parseFloat(filters.priceFrom);
      if (!isNaN(priceFrom)) {
        filtered = filtered.filter(product => product.price >= priceFrom);
      }
    }

    // Фильтр по цене до
    if (filters.priceTo.trim()) {
      const priceTo = parseFloat(filters.priceTo);
      if (!isNaN(priceTo)) {
        filtered = filtered.filter(product => product.price <= priceTo);
      }
    }

    setFilteredProducts(filtered);
  };

  const handleClearFilters = () => {
    setFilteredProducts(products);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleBuyerSelect = (buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    setSelectedBuyer(buyer || null);
    setShowConfirmDialog(true);
  };

  const createOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
  }) => {
    if (!selectedProduct || !selectedBuyer || !profile) {
      toast({
        title: "Ошибка",
        description: "Не все данные заполнены",
        variant: "destructive",
      });
      return;
    }

    console.log("Creating order with data:", {
      seller: profile,
      product: selectedProduct,
      buyer: selectedBuyer,
      orderData
    });

    setIsCreatingOrder(true);

    try {
      // Валидация delivery_method
      const validDeliveryMethods = ['cargo_rf', 'cargo_kz', 'self_pickup'];
      if (!validDeliveryMethods.includes(orderData.deliveryMethod)) {
        throw new Error(`Invalid delivery method: ${orderData.deliveryMethod}`);
      }

      // Используем RPC функцию для создания заказов продавцами
      const orderPayload = {
        p_title: selectedProduct.title,
        p_price: orderData.price,
        p_place_number: 1,
        p_order_seller_name: profile.full_name || '',
        p_buyer_id: selectedBuyer.id,
        p_brand: selectedProduct.brand || '',
        p_model: selectedProduct.model || '',
        p_status: 'seller_confirmed' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: selectedBuyer.telegram || '',
        p_images: orderData.orderImages,
        p_product_id: selectedProduct.id,
        p_delivery_method: orderData.deliveryMethod as 'cargo_rf' | 'cargo_kz' | 'self_pickup',
        p_text_order: '',
        p_delivery_price_confirm: orderData.deliveryPrice || null
      };

      console.log("RPC payload:", orderPayload);

      const { data: orderId, error: orderError } = await supabase
        .rpc('seller_create_order', orderPayload);

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Order created with ID:", orderId);
      setCreatedOrderId(orderId);

      // Получаем данные созданного заказа для Telegram уведомления
      const { data: createdOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error("Error fetching created order:", fetchError);
      }

      // Отправляем Telegram уведомление о создании заказа
      if (createdOrder) {
        try {
          console.log("Sending Telegram notification for order creation:", createdOrder);
          
          const { error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              order: createdOrder,
              action: 'create'
            }
          });

          if (notificationError) {
            console.error("Error sending order creation notification:", notificationError);
          } else {
            console.log("Order creation notification sent successfully");
          }
        } catch (notificationError) {
          console.error("Exception while sending order notification:", notificationError);
        }
      }

      toast({
        title: "Заказ создан",
        description: `Заказ успешно создан`,
      });

      // Закрываем диалог подтверждения и открываем диалог загрузки фото
      setShowConfirmDialog(false);
      setShowConfirmImagesDialog(true);

    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({
        title: "Ошибка создания заказа",
        description: `Детали: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleConfirmImagesComplete = () => {
    // Закрываем диалог загрузки фото и переходим на страницу заказов продавца
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/order/${createdOrderId}`);
    } else {
      navigate('/seller/orders');
    }
  };

  const handleSkipConfirmImages = () => {
    // Пропускаем загрузку фото и переходим на страницу заказов продавца
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/order/${createdOrderId}`);
    } else {
      navigate('/seller/orders');
    }
  };

  const handleCancelConfirmImages = () => {
    // Просто закрываем диалог без перехода
    setShowConfirmImagesDialog(false);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedBuyer(null);
    setStep(1);
    setShowConfirmDialog(false);
    setShowConfirmImagesDialog(false);
    setCreatedOrderId(null);
  };

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return <Package className="h-4 w-4" />;
      case 2: return <UserCheck className="h-4 w-4" />;
      case 3: return <ShoppingCart className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const handleGoBack = () => {
    navigate('/seller/profile');
  };

  if (!profile || profile.user_type !== 'seller') {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
            <h1 className="text-3xl font-bold">Продать товар</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Выберите товар из вашего склада и покупателя для создания заказа
          </p>
        </div>

        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[
              { num: 1, title: "Товар", completed: step > 1 },
              { num: 2, title: "Покупатель", completed: step > 2 },
              { num: 3, title: "Создание", completed: false }
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
                {index < 2 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Шаг 1: Выбор товара с поиском и фильтрами */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 1: Выберите товар</CardTitle>
              <CardDescription>
                Товары из вашего склада
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Компонент поиска и фильтров */}
              <ProductSearchAndFilters
                onSearchChange={handleSearchChange}
                onClearFilters={handleClearFilters}
              />
              
              {isLoading ? (
                <div className="text-center py-8">Загрузка товаров...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {products.length === 0 
                    ? "У вас нет активных товаров на складе"
                    : "Товары не найдены по заданным критериям"
                  }
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-3">
                    Найдено товаров: {filteredProducts.length} из {products.length}
                  </div>
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Лот: {product.lot_number || 'N/A'}
                            </Badge>
                            <Badge 
                              variant={product.status === 'active' ? 'success' : 'secondary'}
                              className="text-xs"
                            >
                              {product.status}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">
                            {product.title}
                          </h3>
                          {(product.brand || product.model) && (
                            <p className="text-sm text-gray-600 mb-1">
                              {[product.brand, product.model].filter(Boolean).join(' ')}
                            </p>
                          )}
                          {product.delivery_price && (
                            <p className="text-xs text-gray-500">
                              Доставка: ${formatPrice(product.delivery_price)}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className="text-lg font-bold text-primary">
                            ${formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Шаг 2: Выбор покупателя */}
        {step === 2 && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 2: Выберите покупателя</CardTitle>
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
                <Button variant="outline" onClick={() => setStep(1)}>
                  Назад
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Диалог подтверждения заказа */}
        {showConfirmDialog && selectedProduct && selectedBuyer && profile && (
          <AdminOrderConfirmationDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
            onConfirm={createOrder}
            isSubmitting={isCreatingOrder}
            product={selectedProduct}
            seller={{
              id: profile.id,
              full_name: profile.full_name || '',
              opt_id: profile.opt_id || '',
              telegram: profile.telegram
            }}
            buyer={selectedBuyer}
            onCancel={resetForm}
          />
        )}

        {/* Диалог загрузки фото подтверждения */}
        {showConfirmImagesDialog && createdOrderId && (
          <ConfirmationImagesUploadDialog
            open={showConfirmImagesDialog}
            orderId={createdOrderId}
            onComplete={handleConfirmImagesComplete}
            onSkip={handleSkipConfirmImages}
            onCancel={handleCancelConfirmImages}
          />
        )}
      </div>
    </Layout>
  );
};

export default SellerSellProduct;
