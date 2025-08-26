import { useState, useCallback } from 'react';
import { Database } from "@/integrations/supabase/types";
import { useLocalStorageSettings } from "@/hooks/useLocalStorageSettings";
import { SortField, SortDirection } from "@/components/admin/order/SortingControls";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

interface AdminOrdersSettings {
  statusFilter: StatusFilterType;
  sortField: SortField;
  sortDirection: SortDirection;
  pageSize: number;
}

export const useAdminOrdersState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Settings from localStorage with proper typing
  const { settings, updateSettings } = useLocalStorageSettings<AdminOrdersSettings>(
    'admin-orders-settings',
    {
      statusFilter: 'all' as StatusFilterType,
      sortField: 'created_at' as SortField,
      sortDirection: 'desc' as SortDirection,
      pageSize: 10
    }
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(settings.statusFilter);
  const [sortField, setSortField] = useState<SortField>(settings.sortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(settings.sortDirection);
  const pageSize = settings.pageSize;

  const handleSearch = useCallback(() => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  }, [searchTerm]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setStatusFilter('all');
    setSortField('created_at');
    setSortDirection('desc');
    setSelectedOrders([]);
    setCurrentPage(1);
    updateSettings({ 
      statusFilter: 'all',
      sortField: 'created_at',
      sortDirection: 'desc'
    });
  }, [updateSettings]);

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
    activeSearchTerm,
    currentPage,
    selectedOrders,
    statusFilter,
    sortField,
    sortDirection,
    pageSize,
    handleSearch,
    clearSearch,
    clearFilters,
    handlePageChange,
    handleStatusFilterChange,
    handleSortChange,
    handleSelectOrder,
    handleSelectAll,
    handleClearSelection,
  };
};
