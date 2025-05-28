
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import SmartFieldHints from '@/components/ui/SmartFieldHints';
import OptimizedSelect from '@/components/ui/OptimizedSelect';
import { supabase } from '@/integrations/supabase/client';
import { OrderFormData } from '@/hooks/useOrderForm';
import { debounce } from 'lodash';

interface PriceAndBuyerStepProps {
  formData: OrderFormData;
  touchedFields: Set<string>;
  onInputChange: (field: string, value: string) => void;
  isFieldValid: (field: string) => boolean;
  getFieldError: (field: string) => string | null;
  isMobile?: boolean;
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

  const debouncedSearchTerm = useMemo(
    () => debounce((term: string) => setProfileSearchTerm(term), 300),
    []
  );

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['buyer-profiles', profileSearchTerm],
    queryFn: async () => {
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
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: true,
  });

  const profileOptions = useMemo(() => 
    profiles.map(p => ({
      value: p.opt_id,
      label: `${p.opt_id}${p.full_name ? ` - ${p.full_name}` : ''}`,
      searchText: `${p.opt_id} ${p.full_name || ''}`
    })), 
    [profiles]
  );

  const getSmartHints = (fieldName: string, value: string) => {
    const hints = [];
    
    if (fieldName === 'price' && value) {
      const price = parseFloat(value);
      if (price > 1000) {
        hints.push({
          type: 'trend' as const,
          text: 'Высокая цена. Убедитесь, что она корректна'
        });
      }
    }
    
    return hints;
  };

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
            min="0"
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
            min="0"
            step="0.01"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buyerOptId" className={isMobile ? "text-base font-medium" : ""}>
          OPT_ID получателя *
        </Label>
        <OptimizedSelect
          options={profileOptions}
          value={formData.buyerOptId}
          onValueChange={(value) => onInputChange("buyerOptId", value)}
          placeholder={profilesLoading ? "Загрузка..." : "Выберите OPT_ID"}
          searchPlaceholder="Поиск по OPT_ID или имени..."
          disabled={profilesLoading}
          className={`w-full ${isMobile ? 'min-h-[44px]' : ''}`}
        />
        {profilesLoading && (
          <p className="text-sm text-muted-foreground">Загрузка профилей...</p>
        )}
      </div>
    </div>
  );
};

export default PriceAndBuyerStep;
