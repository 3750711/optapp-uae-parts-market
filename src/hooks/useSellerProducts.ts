
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import { SellerProfile } from '@/types/order';

export const useSellerProducts = (selectedSeller: SellerProfile | null) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load products for selected seller
  useEffect(() => {
    if (selectedSeller) {
      const fetchProducts = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("products")
            .select(`
              id,
              title,
              price,
              condition,
              brand,
              model,
              description,
              seller_id,
              seller_name,
              status,
              created_at,
              updated_at,
              place_number,
              delivery_price,
              telegram_url,
              phone_url,
              product_url,
              optid_created,
              product_location,
              rating_seller,
              lot_number,
              location,
              last_notification_sent_at,
              cloudinary_public_id,
              cloudinary_url,
              product_images(*)
            `)
            .eq("seller_id", selectedSeller.id)
            .eq("status", "active")
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching products:", error);
            toast({
              title: "Ошибка",
              description: "Не удалось загрузить товары продавца",
              variant: "destructive",
            });
          } else {
            setProducts(data || []);
            setFilteredProducts(data || []);
          }
        } catch (error) {
          console.error("Unexpected error fetching products:", error);
          toast({
            title: "Ошибка",
            description: "Произошла неожиданная ошибка при загрузке товаров",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchProducts();
    }
  }, [selectedSeller, toast]);

  const handleSearchChange = useCallback((searchTerm: string) => {
    let filtered = [...products];

    // Filter by title
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products]);

  const handleClearFilters = useCallback(() => {
    setFilteredProducts(products);
  }, [products]);

  const removeProductFromList = useCallback((productId: string) => {
    setFilteredProducts(prev => prev.filter(p => p.id !== productId));
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  return {
    products,
    filteredProducts,
    isLoading,
    handleSearchChange,
    handleClearFilters,
    removeProductFromList
  };
};
