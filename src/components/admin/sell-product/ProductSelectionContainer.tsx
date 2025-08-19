
import React from 'react';
import GlobalProductSelectionStep from './GlobalProductSelectionStep';
import { checkProductStatus } from '@/utils/productStatusChecker';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';

interface ProductSelectionContainerProps {
  onProductSelect: (product: Product) => void;
}

const ProductSelectionContainer: React.FC<ProductSelectionContainerProps> = ({
  onProductSelect
}) => {
  const { toast } = useToast();

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
      
      onProductSelect(product);
    } catch (error) {
      console.error('Unexpected error checking product status:', error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка при проверке товара",
        variant: "destructive",
      });
    }
  };

  return (
    <GlobalProductSelectionStep
      onProductSelect={handleProductSelect}
    />
  );
};

export default ProductSelectionContainer;
