
import { useState } from 'react';

export const useProductsSelection = () => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  return {
    selectedProducts,
    setSelectedProducts
  };
};
