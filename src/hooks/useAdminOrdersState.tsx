
import { useState, useCallback } from 'react';
import { Database } from "@/integrations/supabase/types";
import { useLocalStorageSettings } from "@/hooks/useLocalStorageSettings";
import { SortField, SortDirection } from "@/components/admin/order/SortingControls";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

export const useAdminOrdersState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Settings from localStorage
  const { settings, updateSettings } = useLocalStorageSettings('admin-orders-settings');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(settings.statusFilter as StatusFilterType);
  const [sortField, setSortField] = useState<SortField>(settings.sortField as SortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(settings.sortDirection as SortDirection);
  const pageSize = settings.pageSize;

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleStatusFilterChange = useCallback((value: StatusFilterType) => {
    setStatusFilter(value);
    setCurrentPage(1);
    updateSettings({ statusFilter: value });
  }, [updateSettings]);

  const handleSortChange = useCallback((field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
    updateSettings({ sortField: field, sortDirection: direction });
  }, [updateSettings]);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleSelectAll = useCallback((orderIds: string[]) => {
    setSelectedOrders(orderIds);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    selectedOrders,
    statusFilter,
    sortField,
    sortDirection,
    pageSize,
    handleSearch,
    clearSearch,
    handlePageChange,
    handleStatusFilterChange,
    handleSortChange,
    handleSelectOrder,
    handleSelectAll,
    handleClearSelection,
  };
};
