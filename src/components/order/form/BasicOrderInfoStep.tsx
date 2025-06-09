
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderFormData } from '@/hooks/useOrderForm';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { debounce } from 'lodash';

interface BasicOrderInfoStepProps {
  formData: OrderFormData;
  touchedFields: Set<string>;
  onInputChange: (field: string, value: string) => void;
  isFieldValid: (field: string) => boolean;
  getFieldError: (field: string) => string | null;
  isMobile?: boolean;
}

// Type for Supabase errors
interface SupabaseError extends Error {
  details?: string;
  hint?: string;
  code?: string;
}

const BasicOrderInfoStep: React.FC<BasicOrderInfoStepProps> = ({
  formData,
  touchedFields,
  onInputChange,
  isFieldValid,
  getFieldError,
  isMobile = false
}) => {
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [profileSearchTerm, setProfileSearchTerm] = useState("");

  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading: isLoadingCarData,
  } = useCarBrandsAndModels();

  const debouncedSearchTerm = useMemo(
    () => debounce((term: string) => setProfileSearchTerm(term), 300),
    []
  );

  // Buyer profiles query
  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['buyer-profiles', profileSearchTerm],
    queryFn: async () => {
      console.log('Fetching buyer profiles with search term:', profileSearchTerm);
      
      let query = supabase
        .from("profiles")
        .select("id, opt_id, full_name")
        .eq("user_type", "buyer")
        .not("opt_id", "is", null);

      if (profileSearchTerm) {
        query = query.or(`opt_id.ilike.%${profileSearchTerm}%,full_name.ilike.%${profileSearchTerm}%`);
      }

      const { data, error } = await query
        .order('opt_id')
        .limit(100);

      if (error) {
        console.error("Ошибка загрузки списка OPT_ID:", error);
        throw error;
      }
      
      console.log('Loaded buyer profiles:', data?.length || 0, 'profiles');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: true,
  });

  // Sort and filter profiles
  const sortedProfiles = useMemo(() => 
    [...profiles].sort((a, b) => {
      const optIdA = a.opt_id || '';
      const optIdB = b.opt_id || '';
      return optIdA.localeCompare(optIdB);
    }), 
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    if (!profileSearchTerm) return sortedProfiles;
    return sortedProfiles.filter(profile => 
      profile.opt_id?.toLowerCase().includes(profileSearchTerm.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(profileSearchTerm.toLowerCase())
    );
  }, [sortedProfiles, profileSearchTerm]);

  // Фильтрация брендов и моделей
  const filteredBrands = useMemo(() => {
    if (!searchBrandTerm) return brands;
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
    );
  }, [brands, searchBrandTerm]);

  const filteredModels = useMemo(() => {
    if (!searchModelTerm) return brandModels;
    return brandModels.filter(model => 
      model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
    );
  }, [brandModels, searchModelTerm]);

  // Handlers
  const handleBrandChange = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      onInputChange('brandId', brandId);
      onInputChange('brand', brand.name);
      selectBrand(brandId);
      onInputChange('modelId', '');
      onInputChange('model', '');
    }
  };

  const handleModelChange = (modelId: string) => {
    const model = brandModels.find(m => m.id === modelId);
    if (model) {
      onInputChange('modelId', modelId);
      onInputChange('model', model.name);
    }
  };

  const handleSearchChange = (value: string) => {
    setProfileSearchTerm(value);
    debouncedSearchTerm(value);
  };

  const resetSearch = () => {
    setProfileSearchTerm("");
  };

  // Sync selected brand with form
  React.useEffect(() => {
    if (formData.brandId && formData.brandId !== selectedBrand) {
      selectBrand(formData.brandId);
    }
  }, [formData.brandId, selectedBrand, selectBrand]);

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Основная информация</h3>
        
        <div className="space-y-2">
          <Label htmlFor="title" className={isMobile ? "text-base font-medium" : ""}>
            Наименование *
          </Label>
          <TouchOptimizedInput 
            id="title" 
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            required 
            placeholder="Введите наименование"
            touched={touchedFields.has('title')}
            error={getFieldError('title')}
            success={touchedFields.has('title') && isFieldValid('title')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
              Бренд
            </Label>
            <Select
              value={formData.brandId}
              onValueChange={handleBrandChange}
              disabled={isLoadingCarData}
            >
              <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                <SelectValue placeholder="Выберите бренд" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
                {filteredBrands.map((brand) => (
                  <SelectItem 
                    key={brand.id} 
                    value={brand.id}
                    className={isMobile ? "py-3 text-base" : ""}
                  >
                    {brand.name}
                  </SelectItem>
                ))}
                {filteredBrands.length === 0 && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Бренд не найден
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
              Модель
            </Label>
            <Select
              value={formData.modelId}
              onValueChange={handleModelChange}
              disabled={isLoadingCarData || !formData.brandId}
            >
              <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                <SelectValue placeholder={formData.brandId ? "Выберите модель" : "Сначала выберите бренд"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
                {filteredModels.map((model) => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    className={isMobile ? "py-3 text-base" : ""}
                  >
                    {model.name}
                  </SelectItem>
                ))}
                {filteredModels.length === 0 && formData.brandId && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Модель не найдена
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Цена и доставка */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Цена и доставка</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className={isMobile ? "text-base font-medium" : ""}>
              Цена ($) *
            </Label>
            <TouchOptimizedInput 
              id="price" 
              type="number" 
              value={formData.price}
              onChange={(e) => onInputChange('price', e.target.value)}
              required 
              placeholder="0.00"
              step="0.01"
              inputMode="decimal"
              touched={touchedFields.has('price')}
              error={getFieldError('price')}
              success={touchedFields.has('price') && isFieldValid('price')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery_price" className={isMobile ? "text-base font-medium" : ""}>
              Стоимость доставки ($)
            </Label>
            <TouchOptimizedInput 
              id="delivery_price"
              type="number"
              value={formData.delivery_price}
              onChange={(e) => onInputChange('delivery_price', e.target.value)}
              placeholder="0.00"
              step="0.01"
              inputMode="decimal"
            />
          </div>
        </div>
      </div>

      {/* Покупатель */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Покупатель</h3>
        
        <div className="space-y-2">
          <Label htmlFor="buyerOptId" className={isMobile ? "text-base font-medium" : ""}>
            OPT_ID получателя *
          </Label>
          {profilesError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Ошибка загрузки списка покупателей: {profilesError.message}
              {(profilesError as SupabaseError).details && (
                <div className="mt-1 text-xs">{(profilesError as SupabaseError).details}</div>
              )}
            </div>
          )}
          <Select
            value={formData.buyerOptId}
            onValueChange={(value) => onInputChange("buyerOptId", value)}
            disabled={profilesLoading}
            onOpenChange={(open) => {
              if (!open) resetSearch();
            }}
          >
            <SelectTrigger className={`w-full ${isMobile ? 'min-h-[44px]' : ''}`}>
              <SelectValue placeholder={
                profilesLoading ? "Загрузка..." : 
                profilesError ? "Ошибка загрузки" :
                "Выберите OPT_ID"
              } />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
              <div className="sticky top-0 px-1 pt-1 pb-0 z-10 bg-white border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Поиск по OPT_ID или имени..."
                    className={`pl-8 ${isMobile ? "text-base py-2.5" : ""}`}
                    value={profileSearchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              {profilesLoading ? (
                <div className="py-2 px-3 text-sm text-gray-500">
                  Загрузка...
                </div>
              ) : profilesError ? (
                <div className="py-2 px-3 text-sm text-red-500">
                  Ошибка загрузки данных
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="py-2 px-3 text-sm text-gray-500">
                  {profileSearchTerm ? "Не найдено" : "Нет данных"}
                </div>
              ) : (
                filteredProfiles.map((profile) => (
                  <SelectItem 
                    key={profile.id} 
                    value={profile.opt_id || ''}
                    className={isMobile ? "py-3 text-base" : ""}
                  >
                    {profile.opt_id}{profile.full_name ? ` - ${profile.full_name}` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {getFieldError('buyerOptId') && (
            <p className="text-sm text-red-500">{getFieldError('buyerOptId')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicOrderInfoStep;
