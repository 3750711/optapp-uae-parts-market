import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import SmartFieldHints from '@/components/ui/SmartFieldHints';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderFormData } from '@/hooks/useOrderForm';
import debounce from 'lodash/debounce';

interface PriceAndBuyerStepProps {
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

const PriceAndBuyerStep: React.FC<PriceAndBuyerStepProps> = ({
  formData,
  touchedFields,
  onInputChange,
  isFieldValid,
  getFieldError,
  isMobile = false
}) => {
  const [profileSearchTerm, setProfileSearchTerm] = React.useState("");
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const debouncedSearchTerm = useMemo(
    () => debounce((term: string) => setProfileSearchTerm(term), 300),
    []
  );

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
        console.error("Error details:", {
          message: error.message,
          details: (error as SupabaseError).details,
          hint: (error as SupabaseError).hint,
          code: (error as SupabaseError).code
        });
        throw error;
      }
      
      console.log('Loaded buyer profiles:', data?.length || 0, 'profiles');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: true,
    retry: (failureCount, error) => {
      console.log('Query retry attempt:', failureCount, 'Error:', error);
      return failureCount < 2;
    }
  });

  // Sort profiles by opt_id alphabetically
  const sortedProfiles = useMemo(() => 
    [...profiles].sort((a, b) => {
      const optIdA = a.opt_id || '';
      const optIdB = b.opt_id || '';
      return optIdA.localeCompare(optIdB);
    }), 
    [profiles]
  );

  // Filter profiles based on search term
  const filteredProfiles = useMemo(() => {
    if (!profileSearchTerm) return sortedProfiles;
    return sortedProfiles.filter(profile => 
      profile.opt_id?.toLowerCase().includes(profileSearchTerm.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(profileSearchTerm.toLowerCase())
    );
  }, [sortedProfiles, profileSearchTerm]);

  const getSmartHints = (fieldName: string, value: string) => {
    const hints = [];
    
    if (fieldName === 'price' && value) {
      const price = parseFloat(value);
      if (price > 1000) {
        hints.push({
          type: 'trend' as const,
          text: 'Высокая цена. Убедитесь, что она корректна'
        });
      } else if (price === 0) {
        hints.push({
          type: 'info' as const,
          text: 'Цена равна нулю - подходит для бесплатных товаров'
        });
      } else if (price < 0) {
        hints.push({
          type: 'warning' as const,
          text: 'Отрицательная цена - используйте для корректировок'
        });
      }
    }
    
    return hints;
  };

  const handleSearchChange = (value: string) => {
    setProfileSearchTerm(value);
    debouncedSearchTerm(value);
  };

  const resetSearch = () => {
    setProfileSearchTerm("");
  };

  // Debug информация
  useEffect(() => {
    if (profilesError) {
      console.error('Profiles query error:', profilesError);
    }
  }, [profilesError]);

  return (
    <div className="space-y-6">
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
          <SmartFieldHints 
            fieldName="price"
            value={formData.price}
            suggestions={getSmartHints('price', formData.price)}
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
            setIsSelectOpen(open);
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
          <SelectContent 
            className="bg-white border border-gray-200 shadow-md max-h-60"
          >
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
        {profiles.length > 0 && (
          <p className="text-xs text-gray-500">
            Найдено покупателей: {profiles.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default PriceAndBuyerStep;
