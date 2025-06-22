import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface Profile {
  id: string;
  full_name: string;
}

interface Product {
  id: string;
  title: string;
}

interface OrderInitializationResult {
  products: Product[];
  sellers: Profile[];
  buyers: Profile[];
  isLoadingProducts: boolean;
  isLoadingSellers: boolean;
  isLoadingBuyers: boolean;
  error: any;
}

const useAdminOrderInitialization = (): OrderInitializationResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [buyers, setBuyers] = useState<Profile[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingSellers, setIsLoadingSellers] = useState(true);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(true);
  const [error, setError] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title');
        if (error) {
          setError(error);
        } else {
          setProducts(data || []);
        }
      } finally {
        setIsLoadingProducts(false);
      }
    };

    const fetchSellers = async () => {
      setIsLoadingSellers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('user_type', 'seller');
        if (error) {
          setError(error);
        } else {
          setSellers(data || []);
        }
      } finally {
        setIsLoadingSellers(false);
      }
    };

    const fetchBuyers = async () => {
      setIsLoadingBuyers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('user_type', 'buyer');
        if (error) {
          setError(error);
        } else {
          setBuyers(data || []);
        }
      } finally {
        setIsLoadingBuyers(false);
      }
    };

    fetchProducts();
    fetchSellers();
    fetchBuyers();
  }, [user]);

  return {
    products,
    sellers,
    buyers,
    isLoadingProducts,
    isLoadingSellers,
    isLoadingBuyers,
    error,
  };
};

export default useAdminOrderInitialization;
