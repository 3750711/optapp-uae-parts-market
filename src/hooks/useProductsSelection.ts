
import { useState, useCallback } from 'react';

export const useProductsSelection = () => {
  const [selectedProducts, setSelectedProductsState] = useState<string[]>([]);

  const setSelectedProducts = useCallback((products: string[] | ((prev: string[]) => string[])) => {
    if (typeof products === 'function') {
      setSelectedProductsState(prev => products(prev));
    } else {
      setSelectedProductsState(products);
    }
  }, []);

  return {
    selectedProducts,
    setSelectedProducts
  };
};
