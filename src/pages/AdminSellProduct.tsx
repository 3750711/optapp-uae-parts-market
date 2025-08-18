
import React, { useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminOrderCreation } from "@/hooks/useAdminOrderCreation";
import { useAdminSellProductState } from "@/hooks/useAdminSellProductState";
import { useRetryMechanism } from "@/hooks/useRetryMechanism";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useIsMobile } from "@/hooks/use-mobile";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SellProductProgress from "@/components/admin/sell-product/SellProductProgress";
import AdminSellProductHeader from "@/components/admin/sell-product/AdminSellProductHeader";
import ProductSelectionContainer from "@/components/admin/sell-product/ProductSelectionContainer";
import BuyerSelectionContainer from "@/components/admin/sell-product/BuyerSelectionContainer";
import OrderConfirmationStep from "@/components/admin/sell-product/OrderConfirmationStep";
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
  place_number?: number;
}

const AdminSellProduct = () => {
  const { 
    state, 
    updateState, 
    loadBuyers, 
    resetState, 
    restoreSavedState, 
    clearSavedData, 
    draftExists,
    saveNow 
  } = useAdminSellProductState();
  const isMobile = useIsMobile();
  
  // Simple page refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show warning if user has selected a product or is in progress
      if (state.selectedProduct && !state.createdOrder) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.selectedProduct, state.createdOrder]);
  const { createOrder, isCreatingOrder } = useAdminOrderCreation();
  const { executeWithRetry, isRetrying } = useRetryMechanism();
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit({
    windowMs: 60000, // 1 минута
    maxRequests: 5    // 5 заказов в минуту
  });

  // Restore saved state and load buyers on initialization
  useEffect(() => {
    let stateRestored = false;
    
    // Try to restore saved state first
    if (draftExists) {
      stateRestored = restoreSavedState();
    }
    
    // Load buyers if not already loaded
    if (state.buyers.length === 0) {
      executeWithRetry(() => loadBuyers(), {}, 'загрузка покупателей');
    }
  }, [draftExists, restoreSavedState, state.buyers.length, loadBuyers, executeWithRetry]);

  // Handle page visibility and form autosave for iOS/mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && (state.selectedProduct || state.selectedBuyer || state.step > 1)) {
        console.log('📱 Page hidden, saving sell product state immediately');
        saveNow();
      }
    };

    const handlePageHide = () => {
      if (state.selectedProduct || state.selectedBuyer || state.step > 1) {
        console.log('📱 Page hiding, saving sell product state immediately');
        saveNow();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [state.selectedProduct, state.selectedBuyer, state.step, saveNow]);

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
      step: 3
    });
  };

  const handleCreateOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
    editedData?: {
      title: string;
      brand: string;
      model: string;
      price: number;
      deliveryPrice: number;
      placeNumber: number;
      textOrder: string;
    };
  }) => {
    if (!state.selectedProduct || !state.selectedBuyer) return;
    
    
    // Проверяем rate limit
    if (!checkRateLimit('создание заказа')) {
      return;
    }

    console.log("📦 Creating order with comprehensive data:", {
      product: state.selectedProduct,
      buyer: state.selectedBuyer,
      orderData: orderData,
      editedData: orderData.editedData ? "✅ Present" : "❌ Missing",
      orderImages: orderData.orderImages ? orderData.orderImages.length : 0
    });

    // Получаем полные данные продавца из базы данных
    const { data: sellerProfile, error: sellerError } = await supabase
      .from('profiles')
      .select('id, full_name, opt_id, telegram')
      .eq('id', state.selectedProduct.seller_id)
      .single();

    if (sellerError || !sellerProfile) {
      console.error("❌ Failed to fetch seller profile:", sellerError);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные продавца",
        variant: "destructive",
      });
      return;
    }

    console.log("👤 Fetched seller profile:", sellerProfile);

    // Создаем объект продавца с корректными данными
    const seller = {
      id: sellerProfile.id,
      full_name: sellerProfile.full_name,
      opt_id: sellerProfile.opt_id || '',
      telegram: sellerProfile.telegram
    };

    // ✅ FIXED: Remove image combining logic here to prevent duplication
    // Image handling will be done properly in useAdminOrderCreation hook
    
    console.log("📸 Order images data:", {
      additionalImages: orderData.orderImages,
      additionalImagesCount: orderData.orderImages.length
    });

    // Используем стоимость доставки из формы или из товара
    const finalDeliveryPrice = orderData.deliveryPrice !== undefined 
      ? orderData.deliveryPrice 
      : state.selectedProduct.delivery_price;

    console.log("💰 Delivery price logic:", {
      fromForm: orderData.deliveryPrice,
      fromProduct: state.selectedProduct.delivery_price,
      final: finalDeliveryPrice
    });

    // Apply edited data to product if available
    let productToUse = state.selectedProduct!;
    if (orderData.editedData) {
      console.log("📝 DETAILED: Applying edited data to product:", {
        "Original Product Title": state.selectedProduct.title,
        "Edited Title": orderData.editedData.title,
        "Original Product Price": state.selectedProduct.price,
        "Edited Price": orderData.editedData.price,
        "Original Product Brand": state.selectedProduct.brand,
        "Edited Brand": orderData.editedData.brand,
        "Original Product Model": state.selectedProduct.model,
        "Edited Model": orderData.editedData.model,
        "Original Delivery Price": state.selectedProduct.delivery_price,
        "Edited Delivery Price": orderData.editedData.deliveryPrice,
        "Original Place Number": state.selectedProduct.place_number,
        "Edited Place Number": orderData.editedData.placeNumber,
        "Text Order": orderData.editedData.textOrder
      });
      
      productToUse = {
        ...state.selectedProduct!,
        title: orderData.editedData.title,
        brand: orderData.editedData.brand || '',
        model: orderData.editedData.model || '',
        price: orderData.editedData.price,
        delivery_price: orderData.editedData.deliveryPrice,
        place_number: orderData.editedData.placeNumber
      };
      
      console.log("✨ RESULT: Updated product with edited data:", {
        "Final Product": productToUse,
        "Changes Applied": {
          titleChanged: productToUse.title !== state.selectedProduct.title,
          priceChanged: productToUse.price !== state.selectedProduct.price,
          brandChanged: productToUse.brand !== state.selectedProduct.brand,
          modelChanged: productToUse.model !== state.selectedProduct.model,
          deliveryPriceChanged: productToUse.delivery_price !== state.selectedProduct.delivery_price,
          placeNumberChanged: productToUse.place_number !== state.selectedProduct.place_number
        }
      });
    } else {
      console.log("📝 No edited data provided, using original product data");
    }

    // ✅ FIXED: Use original orderImages (additional images only)
    const updatedOrderData = {
      ...orderData,
      deliveryPrice: finalDeliveryPrice,
      textOrder: orderData.editedData?.textOrder
    };

    const createOrderOperation = async () => {
      console.log("🚀 FINAL: Calling createOrder with complete data:", {
        seller: seller,
        product: productToUse,
        buyer: state.selectedBuyer,
        orderData: updatedOrderData,
        "EditedData Verification": {
          hasEditedData: !!orderData.editedData,
          editedFields: orderData.editedData ? Object.keys(orderData.editedData) : [],
          textOrderIncluded: !!updatedOrderData.textOrder
        }
      });
      
      const result = await createOrder(seller, productToUse, state.selectedBuyer!, updatedOrderData);
      
      if (result === 'product_unavailable') {
        updateState({
          step: 1,
          selectedProduct: null
        });
        return null;
      }
      
      if (result === 'order_exists') {
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
        // Clear autosaved data after successful order creation
        clearSavedData();
        
        updateState({
          createdOrder: result,
          createdOrderImages: result.images || [] // Use images from created order
        });
      }
    } catch (error) {
      // Ошибка уже обработана в хуке
      console.error('Order creation failed after retries:', error);
    }
  };

  // Completed refactoring - modal dialogs replaced with step-based UI

  const handleBackToBuyers = () => {
    updateState({
      step: 2,
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
      <div className={`container mx-auto px-4 py-8 ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
        <AdminSellProductHeader />
        
        <SellProductProgress 
          currentStep={state.step} 
          onStepClick={handleStepChange}
          canNavigateBack={true}
        />

        {/* Loading overlay */}
        {isLoadingAny && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg p-6 flex items-center space-x-3 ${isMobile ? 'mx-4' : ''}`}>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className={isMobile ? 'text-sm' : ''}>
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
            onBackToProducts={() => updateState({ step: 1, selectedProduct: null })}
          />
        )}

        {state.step === 3 && state.selectedProduct && state.selectedBuyer && (
          <OrderConfirmationStep
            product={state.selectedProduct}
            seller={{
              id: state.selectedProduct.seller_id,
              full_name: state.selectedProduct.seller_name,
              opt_id: ''
            }}
            buyer={state.selectedBuyer}
            onConfirm={handleCreateOrder}
            onBack={handleBackToBuyers}
            isSubmitting={isCreatingOrder}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSellProduct;
