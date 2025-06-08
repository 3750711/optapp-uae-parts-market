
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliveryMethod } from "../types";

interface OrderDetailsSectionProps {
  deliveryMethod: DeliveryMethod;
  placeNumber: string;
  textOrder: string;
  onDeliveryMethodChange: (value: DeliveryMethod) => void;
  onPlaceNumberChange: (value: string) => void;
  onTextOrderChange: (value: string) => void;
  disabled?: boolean;
}

export const OrderDetailsSection: React.FC<OrderDetailsSectionProps> = ({
  deliveryMethod,
  placeNumber,
  textOrder,
  onDeliveryMethodChange,
  onPlaceNumberChange,
  onTextOrderChange,
  disabled = false,
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Способ доставки</Label>
        <Select
          value={deliveryMethod}
          onValueChange={onDeliveryMethodChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите способ доставки" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self_pickup">Самовывоз</SelectItem>
            <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
            <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="place_number">Количество мест для отправки</Label>
        <Input 
          id="place_number" 
          type="number"
          value={placeNumber}
          onChange={(e) => onPlaceNumberChange(e.target.value)}
          required 
          min="1"
          placeholder="Укажите количество мест"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Дополнительная информация</Label>
        <Textarea 
          placeholder="Укажите дополнительную информацию по заказу (необязательно)"
          className="resize-none"
          rows={3}
          value={textOrder}
          onChange={(e) => onTextOrderChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </>
  );
};
