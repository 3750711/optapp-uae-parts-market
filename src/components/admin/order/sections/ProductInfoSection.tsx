
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { SellerProfile } from "@/types/order";

interface ProductInfoSectionProps {
  title: string;
  onTitleChange: (value: string) => void;
  selectedSeller: SellerProfile | null;
  onAddDataFromProduct: () => void;
  onTitleBlur: (title: string) => void;
  disabled?: boolean;
}

export const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
  title,
  onTitleChange,
  selectedSeller,
  onAddDataFromProduct,
  onTitleBlur,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="title">Наименование *</Label>
        {selectedSeller && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddDataFromProduct}
            className="flex items-center gap-2"
            disabled={disabled}
          >
            <Package className="h-4 w-4" />
            Добавить данные из объявления
          </Button>
        )}
      </div>
      <Input 
        id="title" 
        value={title}
        onChange={(e) => {
          onTitleChange(e.target.value);
          onTitleBlur(e.target.value);
        }}
        required 
        placeholder="Введите наименование"
        disabled={disabled}
      />
    </div>
  );
};
