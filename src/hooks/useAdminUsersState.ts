
import { useState, useMemo } from 'react';
import { useDebounceSearch } from './useDebounceSearch';

export type SortField = 'full_name' | 'email' | 'user_type' | 'verification_status' | 'opt_status' | 'created_at' | 'rating' | 'opt_id' | 'communication_ability';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  status: string;
  userType: string;
  optStatus: string;
  ratingFrom: string;
  ratingTo: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

export const useAdminUsersState = () => {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    userType: 'all',
    optStatus: 'all',
    ratingFrom: '',
    ratingTo: '',
    dateFrom: undefined,
    dateTo: undefined
  });

  const debouncedSearch = useDebounceSearch(filters.search, 300);
  
  // Sorting and pagination
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // UI settings
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  // Bulk actions
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.userType !== 'all') count++;
    if (filters.optStatus !== 'all') count++;
    if (filters.ratingFrom) count++;
    if (filters.ratingTo) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      userType: 'all',
      optStatus: 'all',
      ratingFrom: '',
      ratingTo: '',
      dateFrom: undefined,
      dateTo: undefined
    });
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (userIds: string[]) => {
    setSelectedUsers(userIds);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  return {
    filters,
    debouncedSearch,
    sortField,
    sortDirection,
    currentPage,
    pageSize,
    isCompactMode,
    selectedUsers,
    activeFiltersCount,
    handleFilterChange,
    handleClearFilters,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    setIsCompactMode,
    handleSelectUser,
    handleSelectAll,
    handleClearSelection
  };
};
