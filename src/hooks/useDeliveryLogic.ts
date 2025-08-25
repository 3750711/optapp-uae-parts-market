import { useMemo } from 'react';

interface DeliveryLogicParams {
  deliveryPrice?: number | null;
  deliveryMethod?: string;
}

interface DeliveryLogicResult {
  shouldShowDeliveryPrice: boolean;
  formatDeliveryPrice: (price?: number | null) => string;
  calculateTotalPrice: (basePrice: number, deliveryPrice?: number | null) => number;
}

/**
 * Centralized hook for delivery logic
 * Shows delivery prices to ALL users for ALL delivery methods
 */
export const useDeliveryLogic = (params: DeliveryLogicParams): DeliveryLogicResult => {
  const { deliveryPrice, deliveryMethod } = params;

  const shouldShowDeliveryPrice = useMemo(() => {
    // Show delivery price to ALL users if it exists and is greater than 0
    return Boolean(deliveryPrice && deliveryPrice > 0);
  }, [deliveryPrice]);

  const formatDeliveryPrice = useMemo(() => {
    return (price?: number | null): string => {
      if (!price || price <= 0) return '0';
      return `${price}`;
    };
  }, []);

  const calculateTotalPrice = useMemo(() => {
    return (basePrice: number, deliveryPrice?: number | null): number => {
      const delivery = shouldShowDeliveryPrice && deliveryPrice ? deliveryPrice : 0;
      return basePrice + delivery;
    };
  }, [shouldShowDeliveryPrice]);

  return {
    shouldShowDeliveryPrice,
    formatDeliveryPrice,
    calculateTotalPrice,
  };
};