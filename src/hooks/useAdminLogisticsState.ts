import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorageSettings } from "@/hooks/useLocalStorageSettings";
import { LogisticsFilters } from "@/types/logisticsFilters";
import { Order } from "@/hooks/useServerFilteredOrders";

type SortLevel = {
  field: keyof Order;
  direction: 'asc' | 'desc';
};

type SortConfig = {
  levels: SortLevel[];
};

export type { SortLevel, SortConfig };

interface LogisticsSettings {
  appliedFilters: LogisticsFilters;
  sortConfig: SortConfig;
  loadedPagesCount: number;
}

const defaultSettings: LogisticsSettings = {
  appliedFilters: {
    sellerIds: [],
    buyerIds: [],
    containerNumbers: [],
    shipmentStatuses: [],
    containerStatuses: [],
    orderStatuses: [],
    searchTerm: '',
    readyForShipment: null
  },
  sortConfig: {
    levels: []
  },
  loadedPagesCount: 1
};

export const useAdminLogisticsState = () => {
  const { settings, updateSettings } = useLocalStorageSettings<LogisticsSettings>(
    'admin-logistics-settings',
    defaultSettings
  );

  const [pendingFilters, setPendingFilters] = useState<LogisticsFilters>(
    settings.appliedFilters
  );
  
  const [appliedFilters, setAppliedFilters] = useState<LogisticsFilters>(
    settings.appliedFilters
  );

  const [sortConfig, setSortConfig] = useState<SortConfig>(
    settings.sortConfig
  );

  // Sync filters with settings from localStorage
  useEffect(() => {
    if (JSON.stringify(settings.appliedFilters) !== JSON.stringify(appliedFilters)) {
      console.log('🔄 [Filters Sync] Restoring filters from localStorage:', settings.appliedFilters);
      setPendingFilters(settings.appliedFilters);
      setAppliedFilters(settings.appliedFilters);
    }
  }, [settings.appliedFilters]);

  // Sync sort config with settings from localStorage
  useEffect(() => {
    if (JSON.stringify(settings.sortConfig) !== JSON.stringify(sortConfig)) {
      console.log('🔄 [Sort Sync] Restoring sort config from localStorage:', settings.sortConfig);
      setSortConfig(settings.sortConfig);
    }
  }, [settings.sortConfig]);

  // Apply filters and save to localStorage
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...pendingFilters });
    updateSettings({ appliedFilters: { ...pendingFilters } });
  }, [pendingFilters, updateSettings]);

  // Apply only search term
  const handleApplySearch = useCallback(() => {
    console.log('🔍 [Search] Applying search term:', pendingFilters.searchTerm);
    const updated = { ...appliedFilters, searchTerm: pendingFilters.searchTerm };
    setAppliedFilters(updated);
    updateSettings({ appliedFilters: updated });
    console.log('✅ [Search] Applied filters updated');
  }, [pendingFilters.searchTerm, appliedFilters, updateSettings]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    console.log('🧹 [Search] Clearing search');
    const updated = { ...pendingFilters, searchTerm: '' };
    setPendingFilters(updated);
    const appliedUpdated = { ...appliedFilters, searchTerm: '' };
    setAppliedFilters(appliedUpdated);
    updateSettings({ appliedFilters: appliedUpdated });
    console.log('✅ [Search] Search cleared');
  }, [pendingFilters, appliedFilters, updateSettings]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const emptyFilters = defaultSettings.appliedFilters;
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    updateSettings({ appliedFilters: emptyFilters });
  }, [updateSettings]);

  // Remove specific filter
  const handleRemoveFilter = useCallback((key: keyof LogisticsFilters, value: string) => {
    const currentValues = appliedFilters[key] as string[];
    const newValues = currentValues.filter(v => v !== value);
    const newFilters = { ...appliedFilters, [key]: newValues };
    
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    updateSettings({ appliedFilters: newFilters });
  }, [appliedFilters, updateSettings]);

  // Update sort configuration (multi-level support)
  const handleSortChange = useCallback((
    field: keyof Order, 
    direction: 'asc' | 'desc',
    addLevel: boolean = false
  ) => {
    let newLevels: SortLevel[];
    
    if (addLevel) {
      // Shift+Click: добавляем новый уровень, удаляя дубликаты поля
      newLevels = [
        ...sortConfig.levels.filter(l => l.field !== field),
        { field, direction }
      ];
    } else {
      // Обычный клик: заменяем сортировку + автоматический fallback на order_number
      newLevels = [{ field, direction }];
      if (field !== 'order_number') {
        newLevels.push({ field: 'order_number', direction: 'asc' });
      }
    }
    
    const newSortConfig = { levels: newLevels };
    setSortConfig(newSortConfig);
    updateSettings({ sortConfig: newSortConfig });
  }, [sortConfig, updateSettings]);

  const hasUnappliedChanges = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  const hasUnappliedSearch = useMemo(() => {
    const result = pendingFilters.searchTerm !== appliedFilters.searchTerm;
    console.log('🔍 [Search Check]', {
      pending: pendingFilters.searchTerm,
      applied: appliedFilters.searchTerm,
      hasUnapplied: result
    });
    return result;
  }, [pendingFilters.searchTerm, appliedFilters.searchTerm]);

  return {
    pendingFilters,
    setPendingFilters,
    appliedFilters,
    sortConfig,
    hasUnappliedChanges,
    hasUnappliedSearch,
    handleApplyFilters,
    handleApplySearch,
    handleClearSearch,
    handleClearFilters,
    handleRemoveFilter,
    handleSortChange,
    updateSettings,
    settings
  };
};
