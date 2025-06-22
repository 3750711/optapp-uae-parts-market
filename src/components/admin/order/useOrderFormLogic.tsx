import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  seller_id: string;
}

interface Profile {
  id: string;
  full_name: string;
}

export const useOrderFormLogic = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [buyers, setBuyers] = useState<Profile[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [selectedBuyer, setSelectedBuyer] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPrice, setDeliveryPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memoizedProducts = useMemo(() => {
    return products.filter(product => 
      selectedSeller ? product.seller_id === selectedSeller : true
    );
  }, [products, selectedSeller]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, seller_id');
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('user_type', 'seller');
        if (error) throw error;
        setSellers(data || []);
      } catch (error) {
        console.error('Error fetching sellers:', error);
      }
    };

    fetchSellers();
  }, []);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('user_type', 'buyer');
        if (error) throw error;
        setBuyers(data || []);
      } catch (error) {
        console.error('Error fetching buyers:', error);
      }
    };

    fetchBuyers();
  }, []);

  const handleSubmit = async () => {
    if (!selectedProduct || !selectedSeller || !selectedBuyer || !deliveryAddress) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          products: [selectedProduct],
          seller_id: selectedSeller,
          buyer_id: selectedBuyer,
          delivery_address: deliveryAddress,
          delivery_price: parseFloat(deliveryPrice) || 0,
          total_price: parseFloat(totalPrice) || 0,
          status: 'created'
        });

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Заказ успешно создан",
      });

      // Reset form
      setSelectedProduct('');
      setSelectedSeller('');
      setSelectedBuyer('');
      setDeliveryAddress('');
      setDeliveryPrice('');
      setTotalPrice('');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать заказ",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    products: memoizedProducts,
    sellers,
    buyers,
    selectedProduct,
    selectedSeller,
    selectedBuyer,
    deliveryAddress,
    deliveryPrice,
    totalPrice,
    isSubmitting,
    setSelectedProduct,
    setSelectedSeller,
    setSelectedBuyer,
    setDeliveryAddress,
    setDeliveryPrice,
    setTotalPrice,
    handleSubmit
  };
};
