
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, XCircle, CheckCircle, Filter } from 'lucide-react';

interface OfferStatusFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    active: number;
    cancelled: number;
    completed: number;
    total: number;
  };
}

export const OfferStatusFilter: React.FC<OfferStatusFilterProps> = ({
  activeFilter,
  onFilterChange,
  counts
}) => {
  const filters = [
    {
      key: 'all',
      label: 'All',
      count: counts.total,
      icon: Filter,
      color: 'default' as const
    },
    {
      key: 'active',
      label: 'Active',
      count: counts.active,
      icon: Clock,
      color: 'default' as const
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: counts.cancelled,
      icon: XCircle,
      color: 'secondary' as const
    },
    {
      key: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle,
      color: 'outline' as const
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.key;
        
        return (
          <Button
            key={filter.key}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.key)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{filter.label}</span>
            <Badge variant={isActive ? 'secondary' : filter.color} className="ml-1">
              {filter.count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
};
