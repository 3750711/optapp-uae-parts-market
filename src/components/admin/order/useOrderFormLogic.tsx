
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useDebounceValue } from '@/hooks/useDebounceValue';

interface OrderFormLogicProps {
  orderId?: string;
  initialData?: any;
  isAdmin?: boolean;
  isSeller?: boolean;
  onSaveSuccess?: (data: any) => void;
}

interface Profile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram: string;
  user_type: string;
}

interface Product {
  id: string;
  title: string;
}

function useOrderFormLogic({ 
  orderId,
  initialData,
  isAdmin = false,
  isSeller = false,
  onSaveSuccess
}: OrderFormLogicProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin: hasAdminAccess } = useAdminAccess();

  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [buyers, setBuyers] = useState<Profile[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(initialData?.seller_id || null);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(initialData?.buyer_id || null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(initialData?.products || []);
  const [orderData, setOrderData] = useState({
    status: initialData?.status || 'admin_confirmed',
    delivery_address: initialData?.delivery_address || '',
    delivery_price: initialData?.delivery_price || 0,
    total_price: initialData?.total_price || 0,
    notes: initialData?.notes || '',
  });

  // Дебаунсированный поиск по Telegram
  const [telegramSearchTerm, setTelegramSearchTerm] = useState('');
  const debouncedTelegramSearch = useDebounceValue(telegramSearchTerm, 300);

  // Дебаунсированный поиск по ФИО
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const debouncedNameSearch = useDebounceValue(nameSearchTerm, 300);

  // Дебаунсированный поиск по OPT ID
  const [optIdSearchTerm, setOptIdSearchTerm] = useState('');
  const debouncedOptIdSearch = useDebounceValue(optIdSearchTerm, 300);

  const statuses = useMemo(() => {
    if (isAdmin || hasAdminAccess) {
      return ['created', 'seller_confirmed', 'admin_confirmed', 'processed', 'shipped', 'delivered', 'cancelled'];
    } else if (isSeller) {
      return ['created', 'seller_confirmed', 'processed', 'shipped', 'cancelled'];
    } else {
      return ['created', 'seller_confirmed', 'processed', 'shipped', 'delivered', 'cancelled'];
    }
  }, [isAdmin, isSeller, hasAdminAccess]);

  useEffect(() => {
    if (initialData) {
      setOrderData({
        status: initialData?.status || 'admin_confirmed',
        delivery_address: initialData?.delivery_address || '',
        delivery_price: initialData?.delivery_price || 0,
        total_price: initialData?.total_price || 0,
        notes: initialData?.notes || '',
      });
      setSelectedSellerId(initialData?.seller_id || null);
      setSelectedBuyerId(initialData?.buyer_id || null);
      setSelectedProducts(initialData?.products || []);
    }
  }, [initialData]);

  // Оптимизированный поиск продавцов
  const searchSellers = useCallback(async () => {
    setIsLoadingSellers(true);

    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram, user_type')
        .eq('user_type', 'seller')
        .limit(20);
      
      if (debouncedTelegramSearch) {
        query = query.ilike('telegram', `%${debouncedTelegramSearch}%`);
      }
      
      if (debouncedNameSearch) {
        query = query.ilike('full_name', `%${debouncedNameSearch}%`);
      }
      
      if (debouncedOptIdSearch) {
        query = query.ilike('opt_id', `%${debouncedOptIdSearch}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching sellers:', error);
        return;
      }
      
      setSellers(data || []);
    } finally {
      setIsLoadingSellers(false);
    }
  }, [debouncedNameSearch, debouncedOptIdSearch, debouncedTelegramSearch]);

  // Оптимизированный поиск покупателей
  const searchBuyers = useCallback(async () => {
    setIsLoadingBuyers(true);

    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, opt_id, user_type, telegram')
        .eq('user_type', 'buyer')
        .limit(20);
      
      if (debouncedTelegramSearch) {
        query = query.ilike('telegram', `%${debouncedTelegramSearch}%`);
      }
      
      if (debouncedNameSearch) {
        query = query.ilike('full_name', `%${debouncedNameSearch}%`);
      }
      
      if (debouncedOptIdSearch) {
        query = query.ilike('opt_id', `%${debouncedOptIdSearch}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching buyers:', error);
        return;
      }
      
      setBuyers(data || []);
    } finally {
      setIsLoadingBuyers(false);
    }
  }, [debouncedNameSearch, debouncedOptIdSearch, debouncedTelegramSearch]);

  const searchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title')
        .limit(20);

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  // Обновляем поиск при изменении дебаунсированных значений
  useEffect(() => {
    if (activeStep === 0) {
      searchSellers();
    } else if (activeStep === 1) {
      searchBuyers();
    }
  }, [activeStep, debouncedNameSearch, debouncedOptIdSearch, debouncedTelegramSearch, searchBuyers, searchSellers]);

  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSellerSelect = (sellerId: string) => {
    setSelectedSellerId(sellerId);
  };

  const handleBuyerSelect = (buyerId: string) => {
    setSelectedBuyerId(buyerId);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prevProducts) => {
      if (prevProducts.includes(productId)) {
        return prevProducts.filter((id) => id !== productId);
      } else {
        return [...prevProducts, productId];
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveOrder = async () => {
    if (!selectedSellerId || !selectedBuyerId || selectedProducts.length === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const order = {
        seller_id: selectedSellerId,
        buyer_id: selectedBuyerId,
        products: selectedProducts,
        status: orderData.status,
        delivery_address: orderData.delivery_address,
        delivery_price: orderData.delivery_price,
        total_price: orderData.total_price,
        notes: orderData.notes,
        created_by: user?.id,
      };

      if (orderId) {
        const { data, error } = await supabase
          .from('orders')
          .update(order)
          .eq('id', orderId)
          .select()

        if (error) {
          console.error("Error updating order:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось обновить заказ.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Успех",
          description: "Заказ успешно обновлен.",
        });

        if (onSaveSuccess) {
          onSaveSuccess(data);
        }

      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert([order])
          .select()

        if (error) {
          console.error("Error creating order:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось создать заказ.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Успех",
          description: "Заказ успешно создан.",
        });

        if (onSaveSuccess) {
          onSaveSuccess(data);
        }
      }
      
      navigate('/admin/orders');
    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении заказа.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    activeStep,
    isSaving,
    isLoading,
    isLoadingProducts,
    isLoadingSellers,
    isLoadingBuyers,
    products,
    sellers,
    buyers,
    selectedSellerId,
    selectedBuyerId,
    selectedProducts,
    orderData,
    statuses,
    setActiveStep,
    setIsSaving,
    setIsLoading,
    setIsLoadingProducts,
    setIsLoadingSellers,
    setIsLoadingBuyers,
    setProducts,
    setSellers,
    setBuyers,
    setSelectedSellerId,
    setSelectedBuyerId,
    setSelectedProducts,
    setOrderData,
    handleNextStep,
    handlePrevStep,
    handleSellerSelect,
    handleBuyerSelect,
    handleProductSelect,
    handleInputChange,
    handleSaveOrder,
    telegramSearchTerm,
    setTelegramSearchTerm,
    nameSearchTerm,
    setNameSearchTerm,
    optIdSearchTerm,
    setOptIdSearchTerm,
  };
}

export { useOrderFormLogic };
