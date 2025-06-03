
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SellerProfile } from "../types";

interface SellerInfoSectionProps {
  selectedSeller: SellerProfile | null;
}

export const SellerInfoSection: React.FC<SellerInfoSectionProps> = ({
  selectedSeller,
}) => {
  if (!selectedSeller) return null;

  return (
    <>
      <div className="space-y-2">
        <Label>Имя продавца</Label>
        <Input 
          value={selectedSeller.full_name || 'Неизвестный продавец'} 
          readOnly 
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label>OPT_ID продавца</Label>
        <Input 
          value={selectedSeller.opt_id || ''} 
          readOnly 
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label>Телеграм продавца</Label>
        <Input 
          value={selectedSeller.telegram || ''} 
          readOnly 
          className="bg-gray-100"
        />
      </div>
    </>
  );
};
