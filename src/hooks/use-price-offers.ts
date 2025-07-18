import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PriceOffer, CreatePriceOfferData, UpdatePriceOfferData } from "@/types/price-offer";
import { toast } from "@/hooks/use-toast";

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
    onSuccess: () => {
      toast({
        title: "Предложение отправлено",
        description: "Ваше предложение цены отправлено продавцу.",
      });
      queryClient.invalidateQueries({ queryKey: ["buyer-price-offers"] });
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
    onSuccess: (data, { data: updateData }) => {
      const message = 
        updateData.status === "accepted" ? "Предложение принято" :
        updateData.status === "rejected" ? "Предложение отклонено" :
        updateData.status === "cancelled" ? "Предложение отменено" :
        "Предложение обновлено";

      toast({
        title: message,
        description: "Статус предложения обновлен.",
      });

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
  return useQuery({
    queryKey: ["pending-offer", productId],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

      const { data, error } = await supabase
        .from("price_offers")
        .select("id, status, offered_price, expires_at")
        .eq("product_id", productId)
        .eq("buyer_id", user.data.user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!productId,
  });
};