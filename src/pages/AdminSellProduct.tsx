
import React, { useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminOrderCreation } from "@/hooks/useAdminOrderCreation";
import { useAdminSellProductState } from "@/hooks/useAdminSellProductState";
import { useRetryMechanism } from "@/hooks/useRetryMechanism";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useEnhancedMobileAutosave } from "@/hooks/useEnhancedMobileAutosave";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  place_number?: number;
}

const AdminSellProduct = () => {
  const { state, updateState, loadBuyers, resetState } = useAdminSellProductState();
  
  // Extended state for edited data and additional images
  const [currentEditedData, setCurrentEditedData] = React.useState<any>(null);
  const [savedEditedData, setSavedEditedData] = React.useState<any>(null);
  const [orderImages, setOrderImages] = React.useState<string[]>([]);

  // Enhanced mobile autosave for comprehensive state management
  const { loadSavedData, clearSavedData, saveNow, saveStatus, isMobile } = useEnhancedMobileAutosave({
    key: 'admin_sell_product_v2',
    data: {
      step: state.step,
      selectedProduct: state.selectedProduct,
      selectedBuyer: state.selectedBuyer,
      showConfirmDialog: state.showConfirmDialog,
      showConfirmImagesDialog: state.showConfirmImagesDialog,
      currentEditedData,
      savedEditedData,
      orderImages,
      // Mobile-specific metadata
      lastActivity: Date.now(),
      scrollPosition: typeof window !== 'undefined' ? window.scrollY : 0,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now()
    },
    delay: 1500,
    enabled: true,
    excludeFields: [],
    mobileOptimized: true
  });

  // Comprehensive state restoration on component mount with mobile timeout
  useEffect(() => {
    const restoreState = async () => {
      try {
        // Increase timeout for mobile devices
        const timeout = isMobile ? 500 : 100;
        
        await new Promise(resolve => setTimeout(resolve, timeout));
        
        const saved = await loadSavedData();
        if (saved) {
        console.log('✅ Comprehensive restoration of sell product state:', saved);
        
        // Restore main state
        const restoredState = { ...state };
        if (saved.step && saved.step !== 1) {
          restoredState.step = saved.step;
        }
        if (saved.selectedProduct) {
          restoredState.selectedProduct = saved.selectedProduct;
        }
        if (saved.selectedBuyer) {
          restoredState.selectedBuyer = saved.selectedBuyer;
        }
        if (saved.showConfirmDialog !== undefined) {
          restoredState.showConfirmDialog = saved.showConfirmDialog;
        }
        if (saved.showConfirmImagesDialog !== undefined) {
          restoredState.showConfirmImagesDialog = saved.showConfirmImagesDialog;
        }
        
        // Restore extended state
        if (saved.currentEditedData) {
          setCurrentEditedData(saved.currentEditedData);
        }
        if (saved.savedEditedData) {
          setSavedEditedData(saved.savedEditedData);
        }
        if (saved.orderImages && Array.isArray(saved.orderImages)) {
          setOrderImages(saved.orderImages);
        }
        
        updateState(restoredState);
        
        // Restore scroll position for mobile
        if (saved.scrollPosition && typeof window !== 'undefined') {
          setTimeout(() => {
            window.scrollTo(0, saved.scrollPosition);
          }, 100);
        }
        
          console.log('✅ Comprehensive state restoration completed');
        }
      } catch (error) {
        console.error('❌ Error during state restoration:', error);
      }
    };
    
    restoreState();
  }, [loadSavedData, isMobile]);

  // Enhanced mobile compatibility - removed redundant handlers since useEnhancedMobileAutosave handles all mobile events

  // Clear autosave on successful order creation
  useEffect(() => {
    if (state.createdOrder) {
      clearSavedData();
    }
  }, [state.createdOrder, clearSavedData]);
  const { createOrder, isCreatingOrder } = useAdminOrderCreation();
  const { executeWithRetry, isRetrying } = useRetryMechanism();
  const { toast } = useToast();
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
    
    // Store edited data for autosave persistence
    if (orderData.editedData) {
      console.log("💾 Storing edited data for autosave:", orderData.editedData);
      setCurrentEditedData(orderData.editedData);
      setSavedEditedData(orderData.editedData);
    }
    
    // Store order images for autosave
    if (orderData.orderImages && orderData.orderImages.length > 0) {
      console.log("📸 Storing order images for autosave:", orderData.orderImages);
      setOrderImages(orderData.orderImages);
    }
    
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

    // Комбинируем изображения товара с дополнительными изображениями
    const productImages = state.selectedProduct.product_images?.map(img => img.url) || [];
    const combinedImages = [...productImages, ...orderData.orderImages];
    
    console.log("📸 Image combination:", {
      productImages: productImages,
      additionalImages: orderData.orderImages,
      combinedImages: combinedImages
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

    // Обновляем orderData с правильными изображениями и стоимостью доставки
    const updatedOrderData = {
      ...orderData,
      orderImages: combinedImages,
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
          createdOrderImages: updatedOrderData.orderImages,
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
    // Clear all edited data and order images
    setCurrentEditedData(null);
    setSavedEditedData(null);
    setOrderImages([]);
    resetState();
    clearSavedData(); // Clear autosave when starting new order
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
        
        {/* Save status indicator for mobile */}
        {isMobile && saveStatus !== 'idle' && (
          <div className="fixed top-4 right-4 z-40">
            <div className={`
              px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300
              ${saveStatus === 'saving' ? 'bg-blue-500 text-white' : 
                saveStatus === 'saved' ? 'bg-green-500 text-white' : 
                saveStatus === 'error' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}
            `}>
              {saveStatus === 'saving' && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Сохранение...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center space-x-2">
                  <span>✅</span>
                  <span>Сохранено</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Ошибка</span>
                </div>
              )}
            </div>
          </div>
        )}
        
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
