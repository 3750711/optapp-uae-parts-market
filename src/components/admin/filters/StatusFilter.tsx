
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface StatusFilterProps {
  statusFilter: string | null;
  onChange: (value: string | null) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ statusFilter, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm">Статус товара</label>
      <Select
        value={statusFilter || ""}
        onValueChange={(value) => onChange(value || null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Все статусы</SelectItem>
          <SelectItem value="pending">Ожидает проверки</SelectItem>
          <SelectItem value="active">Опубликован</SelectItem>
          <SelectItem value="sold">Продан</SelectItem>
          <SelectItem value="archived">Архив</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusFilter;
