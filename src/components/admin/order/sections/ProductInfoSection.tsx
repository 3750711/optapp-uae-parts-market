
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductInfoSectionProps {
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: (title: string) => void;
  disabled?: boolean;
}

export const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
  title,
  onTitleChange,
  onTitleBlur,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title">Наименование *</Label>
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
