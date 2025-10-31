import { useState, useCallback, useMemo } from 'react';
import { useLocalStorageSettings } from "@/hooks/useLocalStorageSettings";
import { LogisticsFilters } from "@/types/logisticsFilters";
import { Order } from "@/hooks/useServerFilteredOrders";

type SortConfig = {
  field: keyof Order | null;
  direction: 'asc' | 'desc' | null;
};

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
    field: null,
    direction: null
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

  // Update sort configuration
  const handleSortChange = useCallback((field: keyof Order | null, direction: 'asc' | 'desc' | null) => {
    const newSortConfig = { field, direction };
    setSortConfig(newSortConfig);
    updateSettings({ sortConfig: newSortConfig });
  }, [updateSettings]);

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
