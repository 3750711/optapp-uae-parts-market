
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает проверки' },
  { value: 'active', label: 'Опубликован' },
  { value: 'sold', label: 'Продан' },
  { value: 'archived', label: 'Архив' },
];

const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="status-filter">Статус товара</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="status-filter">
          <SelectValue placeholder="Выберите статус" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusFilter;
