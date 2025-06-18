import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import AdminOrderConfirmationDialog from "@/components/admin/AdminOrderConfirmationDialog";
import { ConfirmationImagesUploadDialog } from "@/components/admin/ConfirmationImagesUploadDialog";
import { useAdminOrderCreation } from "@/hooks/useAdminOrderCreation";
import { useOrderSteps } from "@/hooks/useOrderSteps";
import { useSellerProducts } from "@/hooks/useSellerProducts";
import { checkProductStatus } from "@/utils/productStatusChecker";
import OrderCreationProgress from "@/components/admin/order/OrderCreationProgress";
import SellerSelectionStep from "@/components/admin/order/SellerSelectionStep";
import ProductSelectionStep from "@/components/admin/order/ProductSelectionStep";
import BuyerSelectionStep from "@/components/admin/order/BuyerSelectionStep";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileOrderCreationHeader } from "@/components/admin/order/MobileOrderCreationHeader";
import { MobileOrderCreationSteps } from "@/components/admin/order/MobileOrderCreationSteps";
import { MobileSellerSelection } from "@/components/admin/order/MobileSellerSelection";
import { MobileStepNavigation } from "@/components/admin/order/MobileStepNavigation";
import { Product } from "@/types/product";

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
  const isMobile = useIsMobile();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConfirmImagesDialog, setShowConfirmImagesDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isLoadingSellers, setIsLoadingSellers] = useState(true);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(true);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);

  const { createOrder, isCreatingOrder } = useAdminOrderCreation();
  const {
    step,
    selectedSeller,
    selectedProduct,
    selectedBuyer,
    handleSellerSelect,
    handleProductSelect,
    handleBuyerSelect,
    resetForm,
    goToStep
  } = useOrderSteps();
  
  const {
    products,
    filteredProducts,
    isLoading,
    handleSearchChange,
    handleClearFilters,
    removeProductFromList
  } = useSellerProducts(selectedSeller);

  // Загрузка продавцов
  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoadingSellers(true);
      try {
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
      } catch (error) {
        console.error("Unexpected error fetching sellers:", error);
        toast({
          title: "Ошибка",
          description: "Произошла неожиданная ошибка при загрузке продавцов",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSellers(false);
      }
    };

    fetchSellers();
  }, []);

  // Загрузка покупателей
  useEffect(() => {
    const fetchBuyers = async () => {
      setIsLoadingBuyers(true);
      try {
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
      } catch (error) {
        console.error("Unexpected error fetching buyers:", error);
        toast({
          title: "Ошибка",
          description: "Произошла неожиданная ошибка при загрузке покупателей",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBuyers(false);
      }
    };

    fetchBuyers();
  }, []);

  const steps = [
    { number: 1, title: "Продавец", description: "Выберите продавца", completed: !!selectedSeller },
    { number: 2, title: "Товар", description: "Выберите товар", completed: !!selectedProduct },
    { number: 3, title: "Покупатель", description: "Выберите покупателя", completed: !!selectedBuyer }
  ];

  const handleSellerSelectWithSeller = (sellerId: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (seller) {
      handleSellerSelect(seller);
      setCreateOrderError(null); // Сбрасываем ошибки при новом выборе
    }
  };

  const handleProductSelectWithCheck = async (product: Product) => {
    console.log("Checking product status before selection:", product.id);
    
    try {
      const { isAvailable, status } = await checkProductStatus(product.id);
      
      if (!isAvailable) {
        toast({
          title: "Товар недоступен",
          description: `Этот товар уже продан или недоступен. Текущий статус: ${status}`,
          variant: "destructive",
        });
        removeProductFromList(product.id);
        return;
      }
      
      handleProductSelect(product);
      setCreateOrderError(null); // Сбрасываем ошибки при новом выборе
    } catch (error) {
      console.error('Unexpected error checking product status:', error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка при проверке товара",
        variant: "destructive",
      });
    }
  };

  const handleBuyerSelectWithCheck = async (buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    if (!buyer) return;
    
    handleBuyerSelect(buyer);
    setCreateOrderError(null); // Сбрасываем ошибки при новом выборе
    
    // Финальная проверка статуса товара перед показом диалога подтверждения
    if (selectedProduct) {
      console.log("Final product status check before confirmation dialog:", selectedProduct.id);
      
      try {
        const { isAvailable, status } = await checkProductStatus(selectedProduct.id);
        
        if (!isAvailable) {
          toast({
            title: "Товар недоступен",
            description: `Этот товар уже продан или недоступен. Статус: ${status}`,
            variant: "destructive",
          });
          goToStep(2);
          removeProductFromList(selectedProduct.id);
          return;
        }
        
        setShowConfirmDialog(true);
      } catch (error) {
        console.error('Unexpected error in final product check:', error);
        setCreateOrderError("Произошла ошибка при проверке товара");
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

  const handleCreateOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
  }) => {
    if (!selectedSeller || !selectedProduct || !selectedBuyer) {
      const errorMsg = "Не все данные заполнены";
      setCreateOrderError(errorMsg);
      toast({
        title: "Ошибка",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateOrderError(null);
      const orderId = await createOrder(selectedSeller, selectedProduct, selectedBuyer, orderData);
      
      if (orderId === 'product_unavailable') {
        goToStep(2);
        removeProductFromList(selectedProduct.id);
        setShowConfirmDialog(false);
        return;
      }
      
      if (orderId === 'order_exists') {
        setShowConfirmDialog(false);
        return;
      }
      
      if (orderId) {
        setCreatedOrderId(orderId);
        setShowConfirmDialog(false);
        setShowConfirmImagesDialog(true);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Произошла ошибка при создании заказа";
      setCreateOrderError(errorMsg);
      console.error("Error creating order:", error);
      // Ошибка уже обработана в хуке, но мы также сохраняем её локально
    }
  };

  const handleConfirmImagesComplete = () => {
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/admin/orders/${createdOrderId}`);
    }
  };

  const handleSkipConfirmImages = () => {
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/admin/orders/${createdOrderId}`);
    }
  };

  const handleCancelConfirmImages = () => {
    setShowConfirmImagesDialog(false);
  };

  const handleResetForm = () => {
    resetForm();
    setShowConfirmDialog(false);
    setShowConfirmImagesDialog(false);
    setCreatedOrderId(null);
    setCreateOrderError(null);
  };

  const handleStepNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next' && step < 3) {
      goToStep(step + 1);
    } else if (direction === 'prev' && step > 1) {
      goToStep(step - 1);
    }
  };

  return (
    <AdminLayout>
      <div className={`container mx-auto px-4 py-8 max-w-6xl ${isMobile ? 'pb-24' : ''}`}>
        {isMobile ? (
          <MobileOrderCreationHeader
            title="Создание заказа из товара"
            description="Выберите продавца, товар и покупателя"
          />
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Создание заказа из товара</h1>
            <p className="text-gray-600 mt-2">
              Выберите продавца, товар и покупателя для создания заказа
            </p>
          </div>
        )}

        {/* Error display */}
        {createOrderError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{createOrderError}</p>
          </div>
        )}

        {isMobile ? (
          <MobileOrderCreationSteps currentStep={step} steps={steps} />
        ) : (
          <OrderCreationProgress currentStep={step} />
        )}

        {step === 1 && (
          <>
            {isMobile ? (
              <MobileSellerSelection
                sellers={sellers}
                onSellerSelect={handleSellerSelectWithSeller}
                isLoading={isLoadingSellers}
              />
            ) : (
              <SellerSelectionStep
                sellers={sellers}
                onSellerSelect={handleSellerSelectWithSeller}
                isLoading={isLoadingSellers}
              />
            )}
            
            {isMobile && (
              <MobileStepNavigation
                currentStep={step}
                totalSteps={3}
                onNext={() => selectedSeller && handleStepNavigation('next')}
                nextDisabled={!selectedSeller}
                showNext={!!selectedSeller}
              />
            )}
          </>
        )}

        {step === 2 && selectedSeller && (
          <>
            <ProductSelectionStep
              selectedSeller={selectedSeller}
              products={products}
              filteredProducts={filteredProducts}
              isLoading={isLoading}
              onProductSelect={handleProductSelectWithCheck}
              onSearchChange={handleSearchChange}
              onClearFilters={handleClearFilters}
              onBackToSeller={() => goToStep(1)}
            />
            
            {isMobile && (
              <MobileStepNavigation
                currentStep={step}
                totalSteps={3}
                onPrevious={() => handleStepNavigation('prev')}
                onNext={() => selectedProduct && handleStepNavigation('next')}
                nextDisabled={!selectedProduct}
                showNext={!!selectedProduct}
              />
            )}
          </>
        )}

        {step === 3 && selectedProduct && (
          <>
            <BuyerSelectionStep
              selectedProduct={selectedProduct}
              buyers={buyers}
              onBuyerSelect={handleBuyerSelectWithCheck}
              onBackToProducts={() => goToStep(2)}
              isLoading={isLoadingBuyers}
            />
            
            {isMobile && (
              <MobileStepNavigation
                currentStep={step}
                totalSteps={3}
                onPrevious={() => handleStepNavigation('prev')}
                nextLabel="Создать заказ"
                showNext={false}
              />
            )}
          </>
        )}

        {showConfirmDialog && selectedSeller && selectedProduct && selectedBuyer && (
          <AdminOrderConfirmationDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
            onConfirm={handleCreateOrder}
            isSubmitting={isCreatingOrder}
            product={selectedProduct}
            seller={selectedSeller}
            buyer={selectedBuyer}
            onCancel={handleResetForm}
          />
        )}

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
