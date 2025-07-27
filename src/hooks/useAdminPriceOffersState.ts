import { useState, useMemo } from 'react';
import { PriceOffer, PriceOfferStatus } from '@/types/price-offer';
import { useDebounce } from '@/hooks/use-debounce';

export const useAdminPriceOffersState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PriceOfferStatus | 'all'>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSelectOffer = (offerId: string, selected: boolean) => {
    if (selected) {
      setSelectedOfferIds(prev => [...prev, offerId]);
    } else {
      setSelectedOfferIds(prev => prev.filter(id => id !== offerId));
    }
  };

  const handleSelectAll = (offerIds: string[]) => {
    setSelectedOfferIds(offerIds);
  };

  const handleClearSelection = () => {
    setSelectedOfferIds([]);
  };

  const hasActiveFilters = useMemo(() => {
    return searchTerm.length > 0 || statusFilter !== 'all';
  }, [searchTerm, statusFilter]);

  const filterAndPaginateOffers = (offers: PriceOffer[]) => {
    if (!offers) return { paginatedOffers: [], totalCount: 0, totalPages: 0 };
    
    let filtered = [...offers];

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(offer => 
        offer.product?.title?.toLowerCase().includes(searchLower) ||
        offer.buyer_profile?.full_name?.toLowerCase().includes(searchLower) ||
        offer.seller_profile?.full_name?.toLowerCase().includes(searchLower) ||
        offer.buyer_profile?.opt_id?.toLowerCase().includes(searchLower) ||
        offer.seller_profile?.opt_id?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'buyer_profile.full_name':
          aValue = a.buyer_profile?.full_name || '';
          bValue = b.buyer_profile?.full_name || '';
          break;
        case 'seller_profile.full_name':
          aValue = a.seller_profile?.full_name || '';
          bValue = b.seller_profile?.full_name || '';
          break;
        case 'original_price':
          aValue = a.original_price;
          bValue = b.original_price;
          break;
        case 'offered_price':
          aValue = a.offered_price;
          bValue = b.offered_price;
          break;
        case 'status':
          // Order statuses for better sorting
          const statusOrder = { 'pending': 0, 'accepted': 1, 'rejected': 2, 'cancelled': 3, 'expired': 4 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] ?? 999;
          bValue = statusOrder[b.status as keyof typeof statusOrder] ?? 999;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = b.created_at;
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedOffers = filtered.slice(startIndex, startIndex + pageSize);

    return { paginatedOffers, totalCount, totalPages };
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    statusFilter,
    setStatusFilter,
    sortField,
    sortDirection,
    currentPage,
    pageSize,
    selectedOfferIds,
    handleSort,
    handleClearFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSelectOffer,
    handleSelectAll,
    handleClearSelection,
    hasActiveFilters,
    filterAndPaginateOffers
  };
};