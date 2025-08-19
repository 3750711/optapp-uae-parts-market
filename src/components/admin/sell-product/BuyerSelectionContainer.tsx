
import React from 'react';
import BuyerSelectionStep from '../order/BuyerSelectionStep';
import { checkProductStatus } from '@/utils/productStatusChecker';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface BuyerSelectionContainerProps {
  selectedProduct: Product;
  buyers: BuyerProfile[];
  isLoading: boolean;
  onBuyerSelect: (buyerId: string) => void;
  onBackToProducts: () => void;
}

const BuyerSelectionContainer: React.FC<BuyerSelectionContainerProps> = ({
  selectedProduct,
  buyers,
  isLoading,
  onBuyerSelect,
  onBackToProducts
}) => {
  const { toast } = useToast();

  const handleBuyerSelect = async (buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    if (!buyer) return;
    
    // Финальная проверка статуса товара перед показом диалога подтверждения
    console.log("Final product status check before confirmation dialog:", selectedProduct.id);
    
    try {
      const { isAvailable, status } = await checkProductStatus(selectedProduct.id);
      
      if (!isAvailable) {
        toast({
          title: "Товар недоступен",
          description: `Этот товар уже продан или недоступен. Статус: ${status}`,
          variant: "destructive",
        });
        onBackToProducts();
        return;
      }
      
      onBuyerSelect(buyerId);
    } catch (error) {
      console.error('Unexpected error in final product check:', error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Загрузка покупателей...</span>
      </div>
    );
  }

  return (
    <BuyerSelectionStep
      selectedProduct={selectedProduct}
      buyers={buyers}
      onBuyerSelect={handleBuyerSelect}
      onBackToProducts={onBackToProducts}
    />
  );
};

export default BuyerSelectionContainer;
