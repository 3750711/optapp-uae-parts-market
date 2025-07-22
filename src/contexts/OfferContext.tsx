import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface OfferState {
  [productId: string]: {
    hasActiveOffers: boolean;
    isProcessing: boolean;
    lastUpdated: number;
  };
}

interface OfferContextType {
  getOfferState: (productId: string) => { hasActiveOffers: boolean; isProcessing: boolean };
  setOfferState: (productId: string, hasActiveOffers: boolean, isProcessing?: boolean) => void;
  setProcessing: (productId: string, isProcessing: boolean) => void;
  forceRefresh: (productId: string) => void;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export const useOfferContext = () => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOfferContext must be used within an OfferProvider');
  }
  return context;
};

interface OfferProviderProps {
  children: ReactNode;
}

export const OfferProvider: React.FC<OfferProviderProps> = ({ children }) => {
  const [offerStates, setOfferStates] = useState<OfferState>({});
  const queryClient = useQueryClient();

  const getOfferState = useCallback((productId: string) => {
    const state = offerStates[productId];
    return {
      hasActiveOffers: state?.hasActiveOffers || false,
      isProcessing: state?.isProcessing || false,
    };
  }, [offerStates]);

  const setOfferState = useCallback((productId: string, hasActiveOffers: boolean, isProcessing = false) => {
    setOfferStates(prev => ({
      ...prev,
      [productId]: {
        hasActiveOffers,
        isProcessing,
        lastUpdated: Date.now(),
      },
    }));
  }, []);

  const setProcessing = useCallback((productId: string, isProcessing: boolean) => {
    setOfferStates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        isProcessing,
        lastUpdated: Date.now(),
      },
    }));
  }, []);

  const forceRefresh = useCallback((productId: string) => {
    // Invalidate all related queries for this product
    queryClient.invalidateQueries({ queryKey: ['pending-offer', productId] });
    queryClient.invalidateQueries({ queryKey: ['competitive-offers', productId] });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products-infinite-optimized'] });
    queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
    
    // Force refresh of product data with shorter cache time
    queryClient.refetchQueries({ 
      queryKey: ['product-detail', productId],
      type: 'active'
    });
  }, [queryClient]);

  const contextValue = {
    getOfferState,
    setOfferState,
    setProcessing,
    forceRefresh,
  };

  return (
    <OfferContext.Provider value={contextValue}>
      {children}
    </OfferContext.Provider>
  );
};