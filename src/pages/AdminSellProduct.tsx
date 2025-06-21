
import React, { useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminOrderCreation } from "@/hooks/useAdminOrderCreation";
import { useAdminSellProductState } from "@/hooks/useAdminSellProductState";
import { useRetryMechanism } from "@/hooks/useRetryMechanism";
import { useRateLimit } from "@/hooks/useRateLimit";
import SellProductProgress from "@/components/admin/sell-product/SellProductProgress";
import AdminSellProductHeader from "@/components/admin/sell-product/AdminSellProductHeader";
import ProductSelectionContainer from "@/components/admin/sell-product/ProductSelectionContainer";
import BuyerSelectionContainer from "@/components/admin/sell-product/BuyerSelectionContainer";
import OrderConfirmationContainer from "@/components/admin/sell-product/OrderConfirmationContainer";
import { CreatedOrderView } from "@/components/admin/order/CreatedOrderView";

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
  seller_id: string;
  seller_name: string;
}

const AdminSellProduct = () => {
  const { state, updateState, loadBuyers, resetState } = useAdminSellProductState();
  const { createOrder, isCreatingOrder } = useAdminOrderCreation();
  const { executeWithRetry, isRetrying } = useRetryMechanism();
  const { checkRateLimit } = useRateLimit({
    windowMs: 60000, // 1 минута
    maxRequests: 5    // 5 заказов в минуту
  });

  // Загрузка покупателей при инициализации
  useEffect(() => {
    if (state.buyers.length === 0) {
      executeWithRetry(() => loadBuyers(), {}, 'загрузка покупателей');
    }
  }, [state.buyers.length, loadBuyers, executeWithRetry]);

  const handleProductSelect = (product: Product) => {
    updateState({
      selectedProduct: product,
      step: 2
    });
  };

  const handleBuyerSelect = (buyerId: string) => {
    const buyer = state.buyers.find(b => b.id === buyerId);
    if (!buyer) return;
    
    updateState({
      selectedBuyer: buyer,
      showConfirmDialog: true
    });
  };

  const handleCreateOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
  }) => {
    if (!state.selectedProduct || !state.selectedBuyer) return;
    
    // Проверяем rate limit
    if (!checkRateLimit('создание заказа')) {
      return;
    }

    // Создаем объект продавца из данных товара
    const seller = {
      id: state.selectedProduct.seller_id,
      full_name: state.selectedProduct.seller_name,
      opt_id: '',
    };

    const createOrderOperation = async () => {
      const result = await createOrder(seller, state.selectedProduct!, state.selectedBuyer!, orderData);
      
      if (result === 'product_unavailable') {
        updateState({
          step: 1,
          selectedProduct: null,
          showConfirmDialog: false
        });
        return null;
      }
      
      if (result === 'order_exists') {
        updateState({ showConfirmDialog: false });
        return null;
      }
      
      return result;
    };

    try {
      const result = await executeWithRetry(
        createOrderOperation,
        { maxRetries: 2 },
        'создание заказа'
      );
      
      if (result && typeof result === 'object') {
        updateState({
          createdOrder: result,
          createdOrderImages: orderData.orderImages,
          showConfirmDialog: false
        });
      }
    } catch (error) {
      // Ошибка уже обработана в хуке
      console.error('Order creation failed after retries:', error);
    }
  };

  const handleConfirmImagesComplete = () => {
    updateState({ showConfirmImagesDialog: false });
  };

  const handleSkipConfirmImages = () => {
    updateState({ showConfirmImagesDialog: false });
  };

  const handleCancelConfirmImages = () => {
    updateState({ showConfirmImagesDialog: false });
  };

  const handleBackToProducts = () => {
    updateState({
      step: 1,
      selectedBuyer: null
    });
  };

  const handleNewOrder = () => {
    resetState();
  };

  const handleCancel = () => {
    resetState();
  };

  const handleStepChange = (newStep: number) => {
    if (newStep < state.step) {
      // Разрешаем переход на предыдущие шаги
      if (newStep === 1) {
        updateState({
          step: 1,
          selectedProduct: null,
          selectedBuyer: null
        });
      } else if (newStep === 2 && state.selectedProduct) {
        updateState({
          step: 2,
          selectedBuyer: null
        });
      }
    }
  };

  // Если заказ создан, показываем CreatedOrderView
  if (state.createdOrder) {
    return (
      <AdminLayout>
        <CreatedOrderView
          order={state.createdOrder}
          images={state.createdOrderImages}
          onNewOrder={handleNewOrder}
          buyerProfile={state.selectedBuyer}
        />
      </AdminLayout>
    );
  }

  const isLoadingAny = state.isLoading || isCreatingOrder || isRetrying;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <AdminSellProductHeader />
        
        <SellProductProgress 
          currentStep={state.step} 
          onStepClick={handleStepChange}
          canNavigateBack={true}
        />

        {/* Loading overlay */}
        {isLoadingAny && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>
                {isRetrying ? 'Повторная попытка...' : 
                 isCreatingOrder ? 'Создание заказа...' : 
                 'Загрузка...'}
              </span>
            </div>
          </div>
        )}

        {state.step === 1 && (
          <ProductSelectionContainer
            onProductSelect={handleProductSelect}
          />
        )}

        {state.step === 2 && state.selectedProduct && (
          <BuyerSelectionContainer
            selectedProduct={state.selectedProduct}
            buyers={state.buyers}
            isLoading={state.isLoading}
            onBuyerSelect={handleBuyerSelect}
            onBackToProducts={handleBackToProducts}
          />
        )}

        <OrderConfirmationContainer
          showConfirmDialog={state.showConfirmDialog}
          showConfirmImagesDialog={state.showConfirmImagesDialog}
          selectedProduct={state.selectedProduct}
          selectedBuyer={state.selectedBuyer}
          createdOrder={state.createdOrder}
          isCreatingOrder={isCreatingOrder}
          onConfirmDialogChange={(open) => updateState({ showConfirmDialog: open })}
          onConfirmImagesDialogChange={(open) => updateState({ showConfirmImagesDialog: open })}
          onCreateOrder={handleCreateOrder}
          onConfirmImagesComplete={handleConfirmImagesComplete}
          onConfirmImagesSkip={handleSkipConfirmImages}
          onConfirmImagesCancel={handleCancelConfirmImages}
          onCancel={handleCancel}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminSellProduct;
