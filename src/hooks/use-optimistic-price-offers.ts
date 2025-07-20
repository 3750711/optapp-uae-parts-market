import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OptimisticOfferState {
  isOptimistic: boolean;
  offeredPrice?: number;
  status: 'pending' | 'sending' | 'error';
}

export const useOptimisticPriceOffers = () => {
  const [optimisticStates, setOptimisticStates] = useState<Record<string, OptimisticOfferState>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const setOptimisticOffer = useCallback((productId: string, offeredPrice: number) => {
    setOptimisticStates(prev => ({
      ...prev,
      [productId]: {
        isOptimistic: true,
        offeredPrice,
        status: 'sending'
      }
    }));

    // Optimistically update batch offer data
    queryClient.setQueryData(['batch-offers'], (oldData: any) => {
      if (!oldData) return oldData;
      
      const updatedData = oldData.map((item: any) => {
        if (item.product_id === productId) {
          return {
            ...item,
            current_user_offer_price: offeredPrice,
            has_pending_offer: true,
            current_user_is_max: true, // Optimistically assume we're leading
            total_offers_count: item.total_offers_count + (item.has_pending_offer ? 0 : 1)
          };
        }
        return item;
      });
      
      return updatedData;
    });
  }, [queryClient]);

  const updateOptimisticOffer = useCallback((productId: string, newPrice: number) => {
    setOptimisticStates(prev => ({
      ...prev,
      [productId]: {
        isOptimistic: true,
        offeredPrice: newPrice,
        status: 'sending'
      }
    }));

    // Update batch data optimistically
    queryClient.setQueryData(['batch-offers'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((item: any) => {
        if (item.product_id === productId) {
          return {
            ...item,
            current_user_offer_price: newPrice,
            current_user_is_max: true // Optimistically assume we're leading
          };
        }
        return item;
      });
    });
  }, [queryClient]);

  const confirmOptimisticOffer = useCallback((productId: string) => {
    setOptimisticStates(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });

    // Invalidate to get real data
    queryClient.invalidateQueries({ queryKey: ['batch-offers'] });
    queryClient.invalidateQueries({ queryKey: ['price-offers', productId] });
  }, [queryClient]);

  const rejectOptimisticOffer = useCallback((productId: string, error?: string) => {
    setOptimisticStates(prev => ({
      ...prev,
      [productId]: {
        isOptimistic: true,
        status: 'error'
      }
    }));

    // Revert optimistic changes
    queryClient.invalidateQueries({ queryKey: ['batch-offers'] });
    queryClient.invalidateQueries({ queryKey: ['price-offers', productId] });

    if (error) {
      toast({
        title: "Ошибка предложения",
        description: error,
        variant: "destructive",
      });
    }

    // Clear error state after 3 seconds
    setTimeout(() => {
      setOptimisticStates(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
    }, 3000);
  }, [queryClient, toast]);

  const getOptimisticState = useCallback((productId: string): OptimisticOfferState | null => {
    return optimisticStates[productId] || null;
  }, [optimisticStates]);

  return {
    setOptimisticOffer,
    updateOptimisticOffer,
    confirmOptimisticOffer,
    rejectOptimisticOffer,
    getOptimisticState
  };
};