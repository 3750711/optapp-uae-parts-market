
import React from "react";
import { Label } from "@/components/ui/label";
import OptimizedSelect from "@/components/ui/OptimizedSelect";
import { ProfileShort, SellerProfile } from "../types";

interface ParticipantsSectionProps {
  buyerOptId: string;
  sellerId: string;
  onBuyerOptIdChange: (value: string) => void;
  onSellerIdChange: (value: string) => void;
  buyerProfiles: ProfileShort[];
  sellerProfiles: SellerProfile[];
  disabled?: boolean;
  hideSeller?: boolean; // New prop to hide seller selection
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({
  buyerOptId,
  sellerId,
  onBuyerOptIdChange,
  onSellerIdChange,
  buyerProfiles,
  sellerProfiles,
  disabled = false,
  hideSeller = false,
}) => {
  const buyerOptions = React.useMemo(() => {
    return buyerProfiles.map(buyer => ({
      value: buyer.opt_id,
      label: `${buyer.full_name} (${buyer.opt_id})`,
      searchText: `${buyer.full_name} ${buyer.opt_id}`
    }));
  }, [buyerProfiles]);

  const sellerOptions = React.useMemo(() => {
    return sellerProfiles.map(seller => ({
      value: seller.id,
      label: seller.full_name,
      searchText: seller.full_name
    }));
  }, [sellerProfiles]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Участники заказа</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
};
