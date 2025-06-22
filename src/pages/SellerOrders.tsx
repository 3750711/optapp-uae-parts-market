import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/SimpleAuthContext';
import SellerOrdersContent from '@/components/seller/SellerOrdersContent';

const SellerOrders = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Заказы продавца</h1>
        {user ? (
          <SellerOrdersContent />
        ) : (
          <p>Пожалуйста, войдите, чтобы просмотреть свои заказы.</p>
        )}
      </div>
    </Layout>
  );
};

export default SellerOrders;
