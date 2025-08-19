
import { useState, useCallback } from 'react';
import { Product } from '@/types/product';

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

export const useOrderSteps = () => {
  const [step, setStep] = useState(1);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);

  const handleSellerSelect = useCallback((seller: SellerProfile) => {
    setSelectedSeller(seller);
    setSelectedProduct(null);
    setStep(2);
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setStep(3);
  }, []);

  const handleBuyerSelect = useCallback((buyer: BuyerProfile) => {
    setSelectedBuyer(buyer);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedSeller(null);
    setSelectedProduct(null);
    setSelectedBuyer(null);
    setStep(1);
  }, []);

  const goToStep = useCallback((stepNumber: number) => {
    setStep(stepNumber);
  }, []);

  return {
    step,
    selectedSeller,
    selectedProduct,
    selectedBuyer,
    handleSellerSelect,
    handleProductSelect,
    handleBuyerSelect,
    resetForm,
    goToStep
  };
};
