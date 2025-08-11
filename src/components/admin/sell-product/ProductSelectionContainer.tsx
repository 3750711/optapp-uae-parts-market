
import React from 'react';
import GlobalProductSelectionStep from './GlobalProductSelectionStep';
import { checkProductStatus } from '@/utils/productStatusChecker';
import { useToast } from '@/hooks/use-toast';

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
