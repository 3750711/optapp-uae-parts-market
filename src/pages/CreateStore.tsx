
import React from 'react';
import Layout from '@/components/layout/Layout';
import StoreForm from '@/components/store/StoreForm';
import { useNavigate } from 'react-router-dom';

const CreateStore: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (storeId: string) => {
    navigate(`/stores/${storeId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Создать магазин</h1>
        <StoreForm onSuccess={handleSuccess} />
      </div>
    </Layout>
  );
};

export default CreateStore;
