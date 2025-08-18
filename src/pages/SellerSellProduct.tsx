import React, { useState, useEffect, useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package, UserCheck, ShoppingCart, ChevronLeft, Eye } from "lucide-react";
import AdminOrderConfirmationDialog from "@/components/admin/AdminOrderConfirmationDialog";
import { useNavigate } from "react-router-dom";
import { ConfirmationImagesUploadDialog } from "@/components/admin/ConfirmationImagesUploadDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

// Новые оптимизированные компоненты
import OptimizedProductCard from "@/components/seller/OptimizedProductCard";
import EnhancedProductSearch, { SearchFilters } from "@/components/seller/EnhancedProductSearch";
import ProductBreadcrumbs from "@/components/seller/ProductBreadcrumbs";
import { ProductGridSkeleton, StepSkeleton } from "@/components/ui/SkeletonLoader";
import ProductQuickPreview from "@/components/seller/ProductQuickPreview";
import MobileProductCard from "@/components/seller/MobileProductCard";
import KeyboardShortcuts from "@/components/seller/KeyboardShortcuts";

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
  place_number?: number;
  description?: string;
}

const SellerSellProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  
  // State management
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
  
  // Новые состояния для улучшенного UX
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);

  // Memoized breadcrumbs
  const breadcrumbItems = useMemo(() => [
    { label: "Sell Product" }
  ], []);

  // Проверяем, что пользователь - продавец
  useEffect(() => {
    if (profile && profile.user_type !== 'seller') {
      toast({
        title: "Access Error",
        description: "This page is only available to sellers",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [profile, navigate]);

  // Загрузка покупателей с обработкой ошибок
  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, opt_id, telegram")
          .eq("user_type", "buyer")
          .not("opt_id", "is", null)
          .order("full_name");

        if (error) throw error;
        setBuyers(data || []);
      } catch (error) {
        console.error("Error fetching buyers:", error);
        toast({
          title: "Error",
          description: "Failed to load buyers list",
          variant: "destructive",
        });
      }
    };

    fetchBuyers();
  }, []);

  // Загрузка товаров с обработкой ошибок и cleanup
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("seller_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (isMounted) {
          setProducts(data || []);
          setFilteredProducts(data || []);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error("Error fetching products:", error);
          toast({
            title: "Error",
            description: "Failed to load your products",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user]);

  // Оптимизированная функция поиска с мемоизацией
  const handleSearchChange = useCallback((filters: SearchFilters) => {
    let filtered = [...products];

    // Фильтр по названию
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.model?.toLowerCase().includes(searchLower)
      );
    }

    // Фильтр по номеру лота
    if (filters.lotNumber.trim()) {
      filtered = filtered.filter(product =>
        product.lot_number.toString().includes(filters.lotNumber)
      );
    }

    // Фильтр по цене
    if (filters.priceFrom.trim()) {
      const priceFrom = parseFloat(filters.priceFrom);
      if (!isNaN(priceFrom)) {
        filtered = filtered.filter(product => product.price >= priceFrom);
      }
    }

    if (filters.priceTo.trim()) {
      const priceTo = parseFloat(filters.priceTo);
      if (!isNaN(priceTo)) {
        filtered = filtered.filter(product => product.price <= priceTo);
      }
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'lot_number':
          aValue = a.lot_number;
          bValue = b.lot_number;
          break;
        default:
          return 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products]);

  const handleClearFilters = useCallback(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setStep(2);
  }, []);

  const handleProductPreview = useCallback((product: Product) => {
    setPreviewProduct(product);
    setShowPreview(true);
  }, []);

  const handleBuyerSelect = useCallback((buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    setSelectedBuyer(buyer || null);
    setShowConfirmDialog(true);
  }, [buyers]);

  // Обработчики горячих клавиш
  const handleKeyboardCancel = useCallback(() => {
    if (showConfirmDialog) {
      setShowConfirmDialog(false);
    } else if (showPreview) {
      setShowPreview(false);
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/seller/dashboard');
    }
  }, [showConfirmDialog, showPreview, step, navigate]);

  const handleKeyboardSearch = useCallback(() => {
    if (searchInputRef) {
      searchInputRef.focus();
    }
  }, [searchInputRef]);

  const createOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
    editedData?: {
      title?: string;
      brand?: string;
      model?: string;
      price?: number;
      deliveryPrice?: number;
      placeNumber?: number;
      textOrder?: string;
    };
  }) => {
    if (!selectedProduct || !selectedBuyer || !profile) {
      toast({
        title: "Error",
        description: "Not all data is filled",
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
        p_place_number: orderData.editedData?.placeNumber || selectedProduct.place_number || 1,
        p_order_seller_name: profile.full_name || '',
        p_buyer_id: selectedBuyer.id,
        p_brand: selectedProduct.brand || '',
        p_model: selectedProduct.model || '',
        p_status: 'seller_confirmed' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: selectedBuyer.telegram || '',
        p_images: orderData.orderImages,
        p_videos: [], // ДОБАВЛЕНО: пустой массив видео для заказов из товаров
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

      // Уведомления будут отправлены автоматически через триггеры базы данных
      console.log("Order created, notifications will be sent via database triggers");

      toast({
        title: "Order Created",
        description: `Order successfully created`,
      });

      // Закрываем диалог подтверждения и открываем диалог загрузки фото
      setShowConfirmDialog(false);
      setShowConfirmImagesDialog(true);

    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Order Creation Error",
        description: `Details: ${errorMessage}`,
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

  const handleGoBack = () => {
    navigate('/seller/dashboard');
  };

  if (!profile || profile.user_type !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Горячие клавиши */}
      <KeyboardShortcuts
        onCancel={handleKeyboardCancel}
        onSearch={handleKeyboardSearch}
        disabled={isCreatingOrder || showConfirmDialog || showConfirmImagesDialog}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <ProductBreadcrumbs items={breadcrumbItems} />

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-bold">Sell Product</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Select a product from your inventory and a buyer to create an order
          </p>
        </div>

        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[
              { num: 1, title: "Product", completed: step > 1 },
              { num: 2, title: "Buyer", completed: step > 2 },
              { num: 3, title: "Creation", completed: false }
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

        {/* Шаг 1: Выбор товара с улучшенным поиском */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Product</CardTitle>
              <CardDescription>
                Products from your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Улучшенный компонент поиска */}
              <EnhancedProductSearch
                onSearchChange={handleSearchChange}
                onClearFilters={handleClearFilters}
                totalProducts={products.length}
                filteredCount={filteredProducts.length}
              />
              
              {isLoading ? (
                <ProductGridSkeleton count={6} />
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {products.length === 0 
                      ? "No products in inventory"
                      : "No products found"
                    }
                  </h3>
                  <p className="text-gray-500">
                    {products.length === 0 
                      ? "Add products to your inventory to start selling"
                      : "Try changing your search criteria"
                    }
                  </p>
                </div>
              ) : (
                <div className={isMobile ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}>
                  {filteredProducts.map((product) => (
                    isMobile ? (
                      <MobileProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleProductSelect}
                        onPreview={handleProductPreview}
                      />
                    ) : (
                      <OptimizedProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleProductSelect}
                      />
                    )
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
              <CardTitle>Step 2: Select Buyer</CardTitle>
              <CardDescription>
                Product: {selectedProduct.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="buyer">Buyer</Label>
                <Select onValueChange={handleBuyerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select buyer" />
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
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Диалог предварительного просмотра товара */}
        <ProductQuickPreview
          product={previewProduct}
          open={showPreview}
          onOpenChange={setShowPreview}
          onSelectProduct={handleProductSelect}
        />

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
    </div>
  );
};

export default SellerSellProduct;
