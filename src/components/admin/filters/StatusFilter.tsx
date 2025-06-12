
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm">Статус товара</label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          <SelectItem value="pending">Ожидает проверки</SelectItem>
          <SelectItem value="sold">Продан</SelectItem>
          <SelectItem value="active">Опубликован</SelectItem>
          <SelectItem value="archived">Архив</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusFilter;
