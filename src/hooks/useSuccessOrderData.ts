
import { useState } from 'react';

interface OrderInfo {
  orderNumber: number;
  title: string;
  brand?: string;
  model?: string;
  price: number;
  deliveryMethod: string;
}

interface SellerInfo {
  name: string;
  optId?: string;
  telegram?: string;
}

interface SuccessOrderData {
  orderInfo: OrderInfo | null;
  sellerInfo: SellerInfo | null;
  isDialogOpen: boolean;
}

export const useSuccessOrderData = () => {
  const [successData, setSuccessData] = useState<SuccessOrderData>({
    orderInfo: null,
    sellerInfo: null,
    isDialogOpen: false,
  });

  const showSuccessDialog = (orderInfo: OrderInfo, sellerInfo: SellerInfo) => {
    setSuccessData({
      orderInfo,
      sellerInfo,
      isDialogOpen: true,
    });
  };

  const hideSuccessDialog = () => {
    setSuccessData(prev => ({
      ...prev,
      isDialogOpen: false,
    }));
  };

  const clearSuccessData = () => {
    setSuccessData({
      orderInfo: null,
      sellerInfo: null,
      isDialogOpen: false,
    });
  };

  return {
    successData,
    showSuccessDialog,
    hideSuccessDialog,
    clearSuccessData,
  };
};
