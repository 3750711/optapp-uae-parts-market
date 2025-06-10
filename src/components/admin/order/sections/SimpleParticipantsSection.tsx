
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileShort, SellerProfile } from "../types";

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
  // Sort buyers alphabetically by OPT_ID
  const sortedBuyers = React.useMemo(() => {
    return [...buyerProfiles].sort((a, b) => a.opt_id.localeCompare(b.opt_id));
  }, [buyerProfiles]);

  // Sort sellers alphabetically by name
  const sortedSellers = React.useMemo(() => {
    return [...sellerProfiles].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [sellerProfiles]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Участники заказа</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buyerOptId">OPT_ID покупателя *</Label>
          <Select
            value={buyerOptId}
            onValueChange={onBuyerOptIdChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите покупателя..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {sortedBuyers.map(buyer => (
                <SelectItem key={buyer.opt_id} value={buyer.opt_id}>
                  {buyer.full_name} ({buyer.opt_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!hideSeller && (
          <div>
            <Label htmlFor="sellerId">Продавец *</Label>
            <Select
              value={sellerId}
              onValueChange={onSellerIdChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите продавца..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {sortedSellers.map(seller => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.full_name} {seller.opt_id ? `(${seller.opt_id})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
