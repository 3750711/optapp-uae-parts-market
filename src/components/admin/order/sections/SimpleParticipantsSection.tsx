
import React from "react";
import { Label } from "@/components/ui/label";
import OptimizedSelect from "@/components/ui/OptimizedSelect";
import { ProfileShort, SellerProfile } from "@/types/order";

interface SimpleParticipantsSectionProps {
  buyerOptId: string;
  sellerId: string;
  onBuyerOptIdChange: (value: string) => void;
  onSellerIdChange: (value: string) => void;
  buyerProfiles: ProfileShort[];
  sellerProfiles: SellerProfile[];
  disabled?: boolean;
  hideSeller?: boolean;
}

export const SimpleParticipantsSection: React.FC<SimpleParticipantsSectionProps> = ({
  buyerOptId,
  sellerId,
  onBuyerOptIdChange,
  onSellerIdChange,
  buyerProfiles,
  sellerProfiles,
  disabled = false,
  hideSeller = false,
}) => {
  // Prepare buyer options for OptimizedSelect
  const buyerOptions = React.useMemo(() => {
    return buyerProfiles
      .filter(buyer => buyer.opt_id) // Только профили с OPT_ID
      .sort((a, b) => a.opt_id.localeCompare(b.opt_id))
      .map(buyer => ({
        value: buyer.opt_id, // Используем opt_id как value
        label: `${buyer.full_name} (${buyer.opt_id})`,
        searchText: `${buyer.full_name} ${buyer.opt_id}`
      }));
  }, [buyerProfiles]);

  // Prepare seller options for OptimizedSelect
  const sellerOptions = React.useMemo(() => {
    return sellerProfiles
      .sort((a, b) => {
        const aOptId = a.opt_id || '';
        const bOptId = b.opt_id || '';
        return aOptId.localeCompare(bOptId);
      })
      .map(seller => ({
        value: seller.id, // Используем ID как value для продавцов
        label: seller.opt_id ? `${seller.full_name} (${seller.opt_id})` : seller.full_name,
        searchText: `${seller.full_name} ${seller.opt_id || ''}`
      }));
  }, [sellerProfiles]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Участники заказа</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buyerOptId">OPT_ID покупателя *</Label>
          <OptimizedSelect
            options={buyerOptions}
            value={buyerOptId}
            onValueChange={onBuyerOptIdChange}
            placeholder="Выберите покупателя..."
            searchPlaceholder="Поиск по имени или OPT_ID..."
            disabled={disabled}
          />
        </div>

        {!hideSeller && (
          <div>
            <Label htmlFor="sellerId">Продавец *</Label>
            <OptimizedSelect
              options={sellerOptions}
              value={sellerId}
              onValueChange={onSellerIdChange}
              placeholder="Выберите продавца..."
              searchPlaceholder="Поиск продавца..."
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};
