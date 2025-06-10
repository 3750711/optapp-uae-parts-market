
import React, { useState, useMemo } from 'react';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';

const AdminCarCatalog = () => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  
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

  const handleAddBrand = () => {
    if (newBrandName.trim()) {
      // Add brand logic here
      console.log('Adding brand:', newBrandName);
      setNewBrandName('');
    }
  };

  const handleAddModel = () => {
    if (newModelName.trim() && selectedBrandId) {
      // Add model logic here
      console.log('Adding model:', newModelName, 'to brand:', selectedBrandId);
      setNewModelName('');
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Каталог автомобилей</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Brands Section */}
          <Card>
            <CardHeader>
              <CardTitle>Марки автомобилей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Название новой марки"
                />
                <Button onClick={handleAddBrand} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {loadingBrands ? (
                <p>Загрузка...</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {brands.map(brand => (
                    <div
                      key={brand.id}
                      className={`flex items-center justify-between p-3 border rounded cursor-pointer ${
                        selectedBrandId === brand.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleBrandSelect(brand.id)}
                    >
                      <span className="font-medium">{brand.name}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Models Section */}
          <Card>
            <CardHeader>
              <CardTitle>Модели автомобилей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedBrandId ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="Название новой модели"
                    />
                    <Button onClick={handleAddModel} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {brandModels.map(model => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                      >
                        <span>{model.name}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Выберите марку для просмотра и управления моделями
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCarCatalog;
