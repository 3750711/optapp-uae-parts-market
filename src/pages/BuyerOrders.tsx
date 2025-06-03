
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import OrdersSearchBar from '@/components/orders/OrdersSearchBar';
import OrdersList from '@/components/orders/OrdersList';
import { useOrdersSearch } from '@/hooks/useOrdersSearch';
import { useBuyerOrders } from '@/hooks/useBuyerOrders';

const BuyerOrders = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isSeller = profile?.user_type === 'seller';
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders, isLoading, error, refetch } = useBuyerOrders();
  const { filteredOrders, hasActiveSearch } = useOrdersSearch(orders || [], searchTerm);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  console.log('🔍 Query result:', {
    isLoading,
    error: error?.message,
    ordersCount: orders?.length,
    filteredCount: filteredOrders?.length,
    searchTerm,
    hasActiveSearch
  });

  if (isLoading) {
    console.log('⏳ Loading orders...');
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <svg className="h-8 w-8 animate-spin text-optapp-yellow" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.error('❌ Component error state:', error);
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Ошибка загрузки заказов: {error.message}</p>
            <Button
              onClick={() => refetch()}
              className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('✅ Rendering orders page with orders:', filteredOrders?.length || 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">
            {isSeller ? 'Заказы по моим объявлениям' : 'Мои заказы'}
          </h1>
        </div>

        <OrdersSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onClear={handleClearSearch}
        />

        {hasActiveSearch && (
          <div className="mb-4 text-sm text-gray-600">
            Найдено: {filteredOrders?.length || 0} из {orders?.length || 0} заказов
          </div>
        )}

        <OrdersList
          orders={filteredOrders || []}
          isSeller={isSeller}
          hasActiveSearch={hasActiveSearch}
          searchTerm={searchTerm}
          onClearSearch={handleClearSearch}
          onNavigateToCatalog={() => navigate('/catalog')}
        />
      </div>
    </Layout>
  );
};

export default BuyerOrders;
