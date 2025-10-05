import { useState } from 'react';

export interface ActivityFilters {
  eventType?: string;
  userId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
}

export function useActivityFilters() {
  const [filters, setFilters] = useState<ActivityFilters>({
    eventType: 'all',
    userId: 'all',
    dateRange: undefined,
    search: '',
  });

  const resetFilters = () => {
    setFilters({
      eventType: 'all',
      userId: 'all',
      dateRange: undefined,
      search: '',
    });
  };

  const updateFilter = (key: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    filters,
    setFilters,
    resetFilters,
    updateFilter,
  };
}
