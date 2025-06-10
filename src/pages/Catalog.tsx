
import React, { useState, useMemo } from 'react';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';

const Catalog = () => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  
  const { 
    brands,
    allModels,
    isLoading: loadingBrands
  } = useCarBrandsAndModels();

  // Get models for currently selected brand
  const brandModels = useMemo(() => {
    if (!selectedBrandId || !allModels) return [];
    return allModels.filter(model => model.brand_id === selectedBrandId);
  }, [selectedBrandId, allModels]);

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Каталог</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Марки автомобилей</h2>
          {loadingBrands ? (
            <p>Загрузка...</p>
          ) : (
            <div className="space-y-2">
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand.id)}
                  className={`block w-full text-left p-2 rounded ${
                    selectedBrandId === brand.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Модели</h2>
          {selectedBrandId ? (
            <div className="space-y-2">
              {brandModels.map(model => (
                <div key={model.id} className="p-2 border rounded">
                  {model.name}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Выберите марку для просмотра моделей</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
