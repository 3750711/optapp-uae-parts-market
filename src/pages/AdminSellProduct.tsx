
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import AdminOrderConfirmationDialog from "@/components/admin/AdminOrderConfirmationDialog";
import { ConfirmationImagesUploadDialog } from "@/components/admin/ConfirmationImagesUploadDialog";
import { useAdminOrderCreation } from "@/hooks/useAdminOrderCreation";
import { checkProductStatus } from "@/utils/productStatusChecker";
import GlobalProductSelectionStep from "@/components/admin/sell-product/GlobalProductSelectionStep";
import BuyerSelectionStep from "@/components/admin/order/BuyerSelectionStep";
import SellProductProgress from "@/components/admin/sell-product/SellProductProgress";
import AdminSellProductHeader from "@/components/admin/sell-product/AdminSellProductHeader";

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
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Товар, 2: Покупатель
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConfirmImagesDialog, setShowConfirmImagesDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const { createOrder, isCreatingOrder } = useAdminOrderCreation();

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

  const handleProductSelect = async (product: Product) => {
    console.log("Checking product status before selection:", product.id);
    
    try {
      const { isAvailable, status } = await checkProductStatus(product.id);
      
      if (!isAvailable) {
        toast({
          title: "Товар недоступен",
          description: `Этот товар уже продан или недоступен. Текущий статус: ${status}`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedProduct(product);
      setStep(2);
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
    if (!buyer) return;
    
    setSelectedBuyer(buyer);
    
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
          setStep(1);
          setSelectedProduct(null);
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

  const handleCreateOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
  }) => {
    if (!selectedProduct || !selectedBuyer) {
      toast({
        title: "Ошибка",
        description: "Не все данные заполнены",
        variant: "destructive",
      });
      return;
    }

    // Создаем объект продавца из данных товара
    const seller = {
      id: selectedProduct.seller_id,
      full_name: selectedProduct.seller_name,
      opt_id: '', // Получим из профиля при необходимости
    };

    try {
      const orderId = await createOrder(seller, selectedProduct, selectedBuyer, orderData);
      
      if (orderId === 'product_unavailable') {
        setStep(1);
        setSelectedProduct(null);
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
      // Ошибка уже обработана в хуке
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
    setStep(1);
    setSelectedProduct(null);
    setSelectedBuyer(null);
    setShowConfirmDialog(false);
    setShowConfirmImagesDialog(false);
    setCreatedOrderId(null);
  };

  const handleBackToProducts = () => {
    setStep(1);
    setSelectedBuyer(null);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <AdminSellProductHeader />
        
        <SellProductProgress currentStep={step} />

        {step === 1 && (
          <GlobalProductSelectionStep
            onProductSelect={handleProductSelect}
          />
        )}

        {step === 2 && selectedProduct && (
          <BuyerSelectionStep
            selectedProduct={selectedProduct}
            buyers={buyers}
            onBuyerSelect={handleBuyerSelect}
            onBackToProducts={handleBackToProducts}
          />
        )}

        {showConfirmDialog && selectedProduct && selectedBuyer && (
          <AdminOrderConfirmationDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
            onConfirm={handleCreateOrder}
            isSubmitting={isCreatingOrder}
            product={selectedProduct}
            seller={{ 
              id: selectedProduct.seller_id, 
              full_name: selectedProduct.seller_name, 
              opt_id: '' 
            }}
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

export default AdminSellProduct;
