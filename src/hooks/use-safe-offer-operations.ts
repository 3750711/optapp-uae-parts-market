
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreatePriceOfferData } from '@/types/price-offer';
import { useOfferValidation } from './use-offer-validation';

export const useSafeOfferOperations = () => {
  const queryClient = useQueryClient();
  const { validateOfferCreation, cancelExistingOffer } = useOfferValidation();

  const createOrUpdateOffer = useMutation({
    mutationFn: async (data: CreatePriceOfferData & { forceCreate?: boolean }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      const userId = user.data.user.id;

      // Валидация перед созданием
      if (!data.forceCreate) {
        const validation = await validateOfferCreation(data.product_id, userId);
        
        if (!validation.canCreateOffer && validation.existingOffer) {
          // Если есть существующее предложение, обновляем его
          const { data: result, error } = await supabase
            .from('price_offers')
            .update({
              offered_price: data.offered_price,
              message: data.message,
              expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // +6 часов
              updated_at: new Date().toISOString(),
              status: 'pending'
            })
            .eq('id', validation.existingOffer.id)
            .select()
            .single();

          if (error) throw error;
          
          toast({
            title: "Предложение обновлено",
            description: "Ваше предложение было успешно обновлено",
          });

          return { result, isUpdate: true };
        }

        if (!validation.canCreateOffer) {
          throw new Error(validation.validationMessage || "Не удается создать предложение");
        }
      }

      // Создаем новое предложение
      const { data: result, error } = await supabase
        .from('price_offers')
        .insert({
          ...data,
          buyer_id: userId,
        })
        .select()
        .single();

      if (error) {
        // Обработка специфичных ошибок
        if (error.message?.includes('duplicate key')) {
          throw new Error("У вас уже есть активное предложение для этого товара");
        }
        throw error;
      }

      toast({
        title: "Предложение отправлено",
        description: "Ваше предложение успешно отправлено продавцу",
      });

      return { result, isUpdate: false };
    },
    onSuccess: (data) => {
      // Инвалидируем все связанные кеши
      queryClient.invalidateQueries({ queryKey: ["buyer-price-offers"] });
      queryClient.invalidateQueries({ queryKey: ["pending-offer", data.result.product_id] });
      queryClient.invalidateQueries({ queryKey: ["competitive-offers", data.result.product_id] });
      queryClient.invalidateQueries({ queryKey: ["batch-offers"] });
    },
    onError: (error: any) => {
      console.error("Error in offer operation:", error);
      
      let errorMessage = "Не удалось отправить предложение";
      if (error.message?.includes("duplicate key")) {
        errorMessage = "У вас уже есть активное предложение для этого товара";
      } else if (error.message?.includes("not found")) {
        errorMessage = "Товар не найден или больше недоступен";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Ошибка создания предложения",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const cancelOfferAndCreate = useMutation({
    mutationFn: async (data: { existingOfferId: string; newOfferData: CreatePriceOfferData }) => {
      // Сначала отменяем существующее предложение
      const cancelled = await cancelExistingOffer(data.existingOfferId);
      if (!cancelled) {
        throw new Error("Не удалось отменить существующее предложение");
      }

      // Затем создаем новое с флагом принудительного создания
      return createOrUpdateOffer.mutateAsync({
        ...data.newOfferData,
        forceCreate: true
      });
    },
  });

  return {
    createOrUpdateOffer,
    cancelOfferAndCreate,
    isLoading: createOrUpdateOffer.isPending || cancelOfferAndCreate.isPending
  };
};
