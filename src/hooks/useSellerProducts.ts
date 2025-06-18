
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SearchFilters } from '@/components/admin/SimpleProductSearchFilters';

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
  lot_number: number;
}

export const useSellerProducts = (selectedSeller: SellerProfile | null) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка товаров выбранного продавца
  useEffect(() => {
    if (selectedSeller) {
      const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
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
        setIsLoading(false);
      };

      fetchProducts();
    }
  }, [selectedSeller, toast]);

  const handleSearchChange = useCallback((filters: SearchFilters) => {
    let filtered = [...products];

    // Фильтр по названию
    if (filters.searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Фильтр по номеру лота
    if (filters.lotNumber.trim()) {
      filtered = filtered.filter(product =>
        product.lot_number.toString().includes(filters.lotNumber)
      );
    }

    // Фильтр по цене от
    if (filters.priceFrom.trim()) {
      const priceFrom = parseFloat(filters.priceFrom);
      if (!isNaN(priceFrom)) {
        filtered = filtered.filter(product => product.price >= priceFrom);
      }
    }

    // Фильтр по цене до
    if (filters.priceTo.trim()) {
      const priceTo = parseFloat(filters.priceTo);
      if (!isNaN(priceTo)) {
        filtered = filtered.filter(product => product.price <= priceTo);
      }
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
