
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileShort, SellerProfile } from "../types";

interface ParticipantsSectionProps {
  buyerOptId: string;
  sellerId: string;
  onBuyerOptIdChange: (value: string) => void;
  onSellerIdChange: (value: string) => void;
  buyerProfiles: ProfileShort[];
  sellerProfiles: SellerProfile[];
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({
  buyerOptId,
  sellerId,
  onBuyerOptIdChange,
  onSellerIdChange,
  buyerProfiles,
  sellerProfiles,
}) => {
  // Sort buyer profiles by opt_id alphabetically
  const sortedBuyerProfiles = [...buyerProfiles].sort((a, b) => {
    const optIdA = a.opt_id || '';
    const optIdB = b.opt_id || '';
    return optIdA.localeCompare(optIdB);
  });

  // Sort seller profiles by opt_id alphabetically
  const sortedSellerProfiles = [...sellerProfiles].sort((a, b) => {
    const optIdA = a.opt_id || '';
    const optIdB = b.opt_id || '';
    return optIdA.localeCompare(optIdB);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="buyerOptId">OPT_ID получателя *</Label>
        <Select
          value={buyerOptId}
          onValueChange={onBuyerOptIdChange}
          required
        >
          <SelectTrigger id="buyerOptId" className="bg-white">
            <SelectValue placeholder="Выберите OPT_ID покупателя" />
          </SelectTrigger>
          <SelectContent>
            {sortedBuyerProfiles.length === 0 ? (
              <SelectItem value="no_data">Нет данных</SelectItem>
            ) : (
              sortedBuyerProfiles.map((p) => (
                <SelectItem key={p.opt_id} value={p.opt_id}>
                  {p.opt_id} {p.full_name ? `- ${p.full_name}` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sellerId">Продавец *</Label>
        <Select
          value={sellerId}
          onValueChange={onSellerIdChange}
          required
        >
          <SelectTrigger id="sellerId" className="bg-white">
            <SelectValue placeholder="Выберите продавца" />
          </SelectTrigger>
          <SelectContent>
            {sortedSellerProfiles.length === 0 ? (
              <SelectItem value="no_data">Нет данных</SelectItem>
            ) : (
              sortedSellerProfiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.opt_id || "Без OPT_ID"} {p.full_name ? `- ${p.full_name}` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
