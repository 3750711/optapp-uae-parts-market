import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, User, Package, UserCheck, ShoppingCart, AlertTriangle } from "lucide-react";
import ProductSearchAndFilters, { SearchFilters } from "@/components/admin/ProductSearchAndFilters";
import AdminOrderConfirmationDialog from "@/components/admin/AdminOrderConfirmationDialog";
import { OrderConfirmImagesDialog } from "@/components/order/OrderConfirmImagesDialog";
import { useNavigate } from "react-router-dom";
import { ConfirmationImagesUploadDialog } from "@/components/admin/ConfirmationImagesUploadDialog";

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
  lot_number: number;
}

const AdminCreateOrderFromProduct = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConfirmImagesDialog, setShowConfirmImagesDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

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

  // Загрузка товаров выбранного продавца с проверкой статуса
  useEffect(() => {
    if (selectedSeller) {
      const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("seller_id", selectedSeller.id)
          .eq("status", "active") // Загружаем только активные товары
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
          setFilteredProducts(data || []);
        }
        setIsLoading(false);
      };

      fetchProducts();
    }
  }, [selectedSeller]);

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

  const handleSellerSelect = (sellerId: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    setSelectedSeller(seller || null);
    setSelectedProduct(null);
    setStep(2);
  };

  const handleProductSelect = async (product: Product) => {
    // Проверяем статус товара перед выбором
    console.log("Checking product status before selection:", product.id);
    
    try {
      const { data: currentProduct, error } = await supabase
        .from('products')
        .select('status')
        .eq('id', product.id)
        .single();
        
      if (error) {
        console.error('Error checking product status:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось проверить статус товара",
          variant: "destructive",
        });
        return;
      }
      
      if (currentProduct.status !== 'active') {
        toast({
          title: "Товар недоступен",
          description: `Этот товар уже продан или недоступен. Текущий статус: ${currentProduct.status}`,
          variant: "destructive",
        });
        // Обновляем список товаров, исключая недоступный товар
        setFilteredProducts(prev => prev.filter(p => p.id !== product.id));
        setProducts(prev => prev.filter(p => p.id !== product.id));
        return;
      }
      
      setSelectedProduct(product);
      setStep(3);
    } catch (error) {
      console.error('Unexpected error checking product status:', error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка при проверке товара",
        variant: "destructive",
      });
    }
  };

  const handleBuyerSelect = async (buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    setSelectedBuyer(buyer || null);
    
    // Финальная проверка статуса товара перед показом диалога подтверждения
    if (selectedProduct) {
      console.log("Final product status check before confirmation dialog:", selectedProduct.id);
      
      try {
        const { data: currentProduct, error } = await supabase
          .from('products')
          .select('status')
          .eq('id', selectedProduct.id)
          .single();
          
        if (error) {
          console.error('Error in final product status check:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось проверить статус товара",
            variant: "destructive",
          });
          return;
        }
        
        if (currentProduct.status !== 'active') {
          toast({
            title: "Товар недоступен",
            description: `Этот товар уже продан или недоступен. Статус: ${currentProduct.status}`,
            variant: "destructive",
          });
          // Возвращаемся к выбору товара
          setStep(2);
          setSelectedProduct(null);
          setSelectedBuyer(null);
          // Обновляем список товаров
          setFilteredProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
          setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
          return;
        }
        
        setShowConfirmDialog(true);
      } catch (error) {
        console.error('Unexpected error in final product check:', error);
        toast({
          title: "Ошибка",
          description: "Произошла неожиданная ошибка",
          variant: "destructive",
        });
      }
    } else {
      setShowConfirmDialog(true);
    }
  };

  const createOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
  }) => {
    if (!selectedSeller || !selectedProduct || !selectedBuyer) {
      toast({
        title: "Ошибка",
        description: "Не все данные заполнены",
        variant: "destructive",
      });
      return;
    }

    console.log("Creating order with data:", {
      seller: selectedSeller,
      product: selectedProduct,
      buyer: selectedBuyer,
      orderData
    });

    // Отключаем кнопку создания заказа для предотвращения двойного нажатия
    if (isCreatingOrder) {
      console.log("Order creation already in progress, ignoring duplicate request");
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Валидация delivery_method
      const validDeliveryMethods = ['cargo_rf', 'cargo_kz', 'self_pickup'];
      if (!validDeliveryMethods.includes(orderData.deliveryMethod)) {
        throw new Error(`Invalid delivery method: ${orderData.deliveryMethod}`);
      }

      // Используем RPC функцию для создания заказа администратором
      const orderPayload = {
        p_title: selectedProduct.title,
        p_price: orderData.price,
        p_place_number: 1,
        p_seller_id: selectedSeller.id,
        p_order_seller_name: selectedSeller.full_name,
        p_seller_opt_id: selectedSeller.opt_id || '',
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
        .rpc('admin_create_order', orderPayload);

      if (orderError) {
        console.error("Error creating order:", orderError);
        
        // Обработка специфических ошибок от базы данных
        if (orderError.message?.includes('Product is not available for order')) {
          toast({
            title: "Товар недоступен",
            description: "Этот товар уже продан или недоступен для заказа",
            variant: "destructive",
          });
          // Возвращаемся к выбору товара
          setStep(2);
          setSelectedProduct(null);
          setSelectedBuyer(null);
          setShowConfirmDialog(false);
          // Обновляем список товаров
          setFilteredProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
          setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
          return;
        }
        
        if (orderError.message?.includes('An active order already exists')) {
          toast({
            title: "Заказ уже существует",
            description: "Для этого товара уже создан активный заказ",
            variant: "destructive",
          });
          setShowConfirmDialog(false);
          return;
        }
        
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
            // Не прерываем процесс создания заказа при ошибке уведомления
          } else {
            console.log("Order creation notification sent successfully");
          }
        } catch (notificationError) {
          console.error("Exception while sending order notification:", notificationError);
          // Не прерываем процесс создания заказа при ошибке уведомления
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
    // Закрываем диалог загрузки фото и переходим на страницу заказа
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/admin/orders/${createdOrderId}`);
    }
  };

  const handleSkipConfirmImages = () => {
    // Пропускаем загрузку фото и переходим на страницу заказа
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/admin/orders/${createdOrderId}`);
    }
  };

  const handleCancelConfirmImages = () => {
    // Просто закрываем диалог без перехода
    setShowConfirmImagesDialog(false);
  };

  const resetForm = () => {
    setSelectedSeller(null);
    setSelectedProduct(null);
    setSelectedBuyer(null);
    setProducts([]);
    setFilteredProducts([]);
    setStep(1);
    setShowConfirmDialog(false);
    setShowConfirmImagesDialog(false);
    setCreatedOrderId(null);
    setIsCreatingOrder(false);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
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

        {/* Шаг 2: Выбор товара с поиском и фильтрами */}
        {step === 2 && selectedSeller && (
          <Card>
            <CardHeader>
              <CardTitle>Шаг 2: Выберите товар</CardTitle>
              <CardDescription>
                Товары продавца: {selectedSeller.full_name}
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
                    ? "У данного продавца нет активных товаров"
                    : "Товары не найдены по заданным критериям"
                  }
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-3">
                    Найдено активных товаров: {filteredProducts.length} из {products.length}
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
                            {product.status === 'active' && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                Доступен для заказа
                              </Badge>
                            )}
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
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Лот: {selectedProduct.lot_number}
                  </Badge>
                  <Badge variant="success" className="text-xs">
                    {selectedProduct.status}
                  </Badge>
                </div>
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

        {/* Диалог подтверждения заказа */}
        {showConfirmDialog && selectedSeller && selectedProduct && selectedBuyer && (
          <AdminOrderConfirmationDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
            onConfirm={createOrder}
            isSubmitting={isCreatingOrder}
            product={selectedProduct}
            seller={selectedSeller}
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
    </AdminLayout>
  );
};

export default AdminCreateOrderFromProduct;
