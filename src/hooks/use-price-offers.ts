import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PriceOffer, CreatePriceOfferData, UpdatePriceOfferData } from "@/types/price-offer";
import { toast } from "@/hooks/use-toast";

interface UpdateOfferPriceData {
  offered_price: number;
  message?: string;
}

// Fetch buyer's price offers
export const useBuyerPriceOffers = (enabled = true) => {
  return useQuery({
    queryKey: ["buyer-price-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_offers")
        .select(`
          *,
          product:products!inner(
            id,
            title,
            brand,
            model,
            status,
            seller_name,
            product_images(url, is_primary)
          ),
          seller_profile:profiles!price_offers_seller_id_fkey(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .eq("buyer_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PriceOffer[];
    },
    enabled,
  });
};

// Fetch seller's price offers
export const useSellerPriceOffers = (enabled = true) => {
  return useQuery({
    queryKey: ["seller-price-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_offers")
        .select(`
          *,
          product:products!inner(
            id,
            title,
            brand,
            model,
            status,
            seller_name,
            product_images(url, is_primary)
          ),
          buyer_profile:profiles!price_offers_buyer_id_fkey(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .eq("seller_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PriceOffer[];
    },
    enabled,
  });
};

// Fetch all price offers (admin)
export const useAdminPriceOffers = (enabled = true) => {
  return useQuery({
    queryKey: ["admin-price-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_offers")
        .select(`
          *,
          product:products!inner(
            id,
            title,
            brand,
            model,
            status,
            seller_name,
            product_images(url, is_primary)
          ),
          buyer_profile:profiles!price_offers_buyer_id_fkey(
            id,
            full_name,
            opt_id,
            telegram
          ),
          seller_profile:profiles!price_offers_seller_id_fkey(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PriceOffer[];
    },
    enabled,
  });
};

// Create price offer
export const useCreatePriceOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePriceOfferData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase
        .from("price_offers")
        .insert({
          ...data,
          buyer_id: user.data.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Предложение отправлено",
        description: "Ваше предложение цены отправлено продавцу.",
      });
      queryClient.invalidateQueries({ queryKey: ["buyer-price-offers"] });
      // Инвалидируем кеш для конкретного продукта, чтобы кнопка обновилась
      queryClient.invalidateQueries({ queryKey: ["pending-offer", result.product_id] });
    },
    onError: (error: any) => {
      console.error("Error creating price offer:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить предложение",
        variant: "destructive",
      });
    },
  });
};

// Update price offer
export const useUpdatePriceOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePriceOfferData }) => {
      const { data: result, error } = await supabase
        .from("price_offers")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (data, { data: updateData }) => {
      const message = 
        updateData.status === "accepted" ? "Предложение принято и заказ создан" :
        updateData.status === "rejected" ? "Предложение отклонено" :
        updateData.status === "cancelled" ? "Предложение отменено" :
        "Предложение обновлено";

      // Если предложение принято, создаем заказ
      if (updateData.status === "accepted") {
        try {
          // Получаем полные данные предложения
          const { data: fullOffer, error: fetchError } = await supabase
            .from("price_offers")
            .select(`
              *,
              product:products!inner(
                id,
                title,
                brand,
                model,
                seller_name,
                product_images(url)
              ),
              seller_profile:profiles!price_offers_seller_id_fkey(
                id,
                full_name,
                opt_id,
                telegram
              )
            `)
            .eq("id", data.id)
            .single();

          if (fetchError) throw fetchError;

          const { data: createOrderResult, error: orderError } = await supabase.rpc('create_user_order', {
            p_title: fullOffer.product.title,
            p_price: fullOffer.offered_price,
            p_place_number: 1,
            p_seller_id: fullOffer.seller_id,
            p_order_seller_name: fullOffer.product.seller_name,
            p_seller_opt_id: fullOffer.seller_profile?.opt_id || '',
            p_buyer_id: fullOffer.buyer_id,
            p_brand: fullOffer.product.brand,
            p_model: fullOffer.product.model || '',
            p_status: 'created',
            p_order_created_type: 'price_offer_order',
            p_telegram_url_order: fullOffer.seller_profile?.telegram || '',
            p_images: fullOffer.product.product_images?.map((img: any) => img.url) || [],
            p_product_id: fullOffer.product_id,
            p_delivery_method: 'self_pickup',
            p_text_order: updateData.seller_response || `Заказ создан из принятого предложения цены. Предложенная цена: ${fullOffer.offered_price}`,
            p_delivery_price_confirm: 0
          });

          if (orderError) {
            console.error('Error creating order:', orderError);
            toast({
              title: "Предложение принято, но ошибка создания заказа",
              description: "Обратитесь к администратору",
              variant: "destructive",
            });
          } else {
            // Обновляем предложение с ID заказа
            await supabase
              .from("price_offers")
              .update({ order_id: createOrderResult })
              .eq("id", data.id);

            toast({
              title: "Предложение принято и заказ создан",
              description: "Заказ автоматически создан из принятого предложения",
            });
          }
        } catch (error) {
          console.error('Error in order creation process:', error);
          toast({
            title: "Предложение принято, но ошибка создания заказа",
            description: "Обратитесь к администратору",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: message,
          description: "Статус предложения обновлен.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["buyer-price-offers"] });
      queryClient.invalidateQueries({ queryKey: ["seller-price-offers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-price-offers"] });
    },
    onError: (error: any) => {
      console.error("Error updating price offer:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить предложение",
        variant: "destructive",
      });
    },
  });
};

// Check if user has pending offer for product
export const useCheckPendingOffer = (productId: string, enabled = true) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["pending-offer", productId],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

      const { data, error } = await supabase
        .from("price_offers")
        .select("id, status, offered_price, expires_at, message")
        .eq("product_id", productId)
        .eq("buyer_id", user.data.user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!productId,
  });

  // Set up real-time subscription
  React.useEffect(() => {
    if (!enabled || !productId) return;

    const channel = supabase
      .channel('price-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          // Invalidate and refetch the query when changes occur
          queryClient.invalidateQueries({ 
            queryKey: ["pending-offer", productId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, productId, queryClient]);

  return query;
};

// Update offer price using UPSERT logic
export const useUpdateOfferPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      offerId, 
      newPrice,
      originalMessage 
    }: { 
      offerId: string; 
      newPrice: number;
      originalMessage?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      // Update existing offer with new price and reset expiry time
      const { data: result, error } = await supabase
        .from("price_offers")
        .update({ 
          offered_price: newPrice,
          expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // +6 hours
          updated_at: new Date().toISOString(),
          status: 'pending',
          message: originalMessage // Keep original message
        })
        .eq("id", offerId)
        .eq("buyer_id", user.data.user.id) // Additional safety check
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Предложение обновлено",
        description: "Ваше новое предложение отправлено продавцу.",
      });
      queryClient.invalidateQueries({ queryKey: ["buyer-price-offers"] });
      queryClient.invalidateQueries({ queryKey: ["pending-offer"] });
    },
    onError: (error: any) => {
      console.error("Error updating price offer:", error);
      
      let errorMessage = "Не удалось обновить предложение";
      if (error.message?.includes("duplicate key")) {
        errorMessage = "У вас уже есть активное предложение для этого товара";
      } else if (error.message?.includes("not found")) {
        errorMessage = "Предложение не найдено или уже обработано";
      }
      
      toast({
        title: "Ошибка обновления предложения",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};