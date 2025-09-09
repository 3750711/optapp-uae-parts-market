import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's favorites
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('product_id')
          .eq('user_id', user.id);
        
        if (error) throw error;
        return data.map(fav => fav.product_id);
      } catch (error) {
        console.warn('[useFavorites] network/CORS?', error);
        return []; // Critical: return empty array, don't crash UI
      }
    },
    enabled: !!user,
  });

  // Add to favorites
  const addToFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, product_id: productId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast({
        title: "Добавлено в избранное",
        description: "Товар добавлен в ваш список избранного",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в избранное",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast({
        title: "Удалено из избранного",
        description: "Товар удален из вашего списка избранного",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар из избранного",
        variant: "destructive",
      });
    },
  });

  const isFavorite = (productId: string) => favorites.includes(productId);
  
  const toggleFavorite = (productId: string) => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт, чтобы добавлять товары в избранное",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite(productId)) {
      removeFromFavoritesMutation.mutate(productId);
    } else {
      addToFavoritesMutation.mutate(productId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    isUpdating: addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending,
  };
};