
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface OfferState {
  productId: string;
  hasActiveOffers: boolean;
  maxOfferPrice: number | null;
  offersCount: number;
  isOptimistic?: boolean;
}

interface OfferStateContextType {
  offerStates: Record<string, OfferState>;
  updateOfferState: (productId: string, state: Partial<OfferState>) => void;
  setOptimisticOffer: (productId: string, hasOffer: boolean, price?: number) => void;
  clearOptimisticState: (productId: string) => void;
  getOfferState: (productId: string) => OfferState | null;
}

const OfferStateContext = createContext<OfferStateContextType | undefined>(undefined);

export const useOfferState = () => {
  const context = useContext(OfferStateContext);
  if (!context) {
    throw new Error('useOfferState must be used within OfferStateProvider');
  }
  return context;
};

interface OfferStateProviderProps {
  children: ReactNode;
}

export const OfferStateProvider: React.FC<OfferStateProviderProps> = ({ children }) => {
  const [offerStates, setOfferStates] = useState<Record<string, OfferState>>({});

  const updateOfferState = useCallback((productId: string, newState: Partial<OfferState>) => {
    setOfferStates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        productId,
        hasActiveOffers: false,
        maxOfferPrice: null,
        offersCount: 0,
        ...newState
      }
    }));
  }, []);

  const setOptimisticOffer = useCallback((productId: string, hasOffer: boolean, price?: number) => {
    setOfferStates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        productId,
        hasActiveOffers: hasOffer,
        maxOfferPrice: price || prev[productId]?.maxOfferPrice || null,
        offersCount: (prev[productId]?.offersCount || 0) + (hasOffer ? 1 : 0),
        isOptimistic: true
      }
    }));
  }, []);

  const clearOptimisticState = useCallback((productId: string) => {
    setOfferStates(prev => {
      if (!prev[productId]?.isOptimistic) return prev;
      
      const { [productId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const getOfferState = useCallback((productId: string): OfferState | null => {
    return offerStates[productId] || null;
  }, [offerStates]);

  return (
    <OfferStateContext.Provider value={{
      offerStates,
      updateOfferState,
      setOptimisticOffer,
      clearOptimisticState,
      getOfferState
    }}>
      {children}
    </OfferStateContext.Provider>
  );
};
