
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import StoreForm from '@/components/store/StoreForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const StoreCreate = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4" 
            onClick={() => navigate('/stores')}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">Добавить магазин</h1>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <StoreForm onSuccess={(id) => navigate(`/store/${id}`)} />
        </div>
      </div>
    </Layout>
  );
};

export default StoreCreate;
