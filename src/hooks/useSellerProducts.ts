
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product, AdminSellerProfile } from '@/types/product';

export const useSellerProducts = (selectedSeller: AdminSellerProfile | null) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка товаров выбранного продавца
  useEffect(() => {
    if (selectedSeller) {
      const fetchProducts = async () => {
        setIsLoading(true);
        try {
          console.log('🔍 Fetching products for seller:', selectedSeller.id);
          
          const { data, error } = await supabase
            .from("products")
            .select(`
              *,
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
            console.log('✅ Products fetched successfully:', {
              count: data?.length || 0,
              sampleProduct: data?.[0] ? {
                id: data[0].id,
                title: data[0].title,
                images: data[0].product_images,
                cloudinaryData: {
                  publicId: data[0].cloudinary_public_id,
                  url: data[0].cloudinary_url
                }
              } : null
            });
            
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

    // Фильтр по названию
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
