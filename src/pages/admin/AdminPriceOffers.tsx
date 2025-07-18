import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminPriceOffers } from "@/hooks/use-price-offers";
import { useAdminPriceOffersState } from "@/hooks/useAdminPriceOffersState";
import { AdminPriceOffersHeader } from "@/components/admin/price-offers/AdminPriceOffersHeader";
import { AdminPriceOffersFilters } from "@/components/admin/price-offers/AdminPriceOffersFilters";
import { AdminPriceOffersTable } from "@/components/admin/price-offers/AdminPriceOffersTable";
import { AdminPriceOffersPagination } from "@/components/admin/price-offers/AdminPriceOffersPagination";
import { AdminPriceOffersBulkActions } from "@/components/admin/price-offers/AdminPriceOffersBulkActions";

const AdminPriceOffers = () => {
  const { data: offers, isLoading, refetch } = useAdminPriceOffers();
  
  const {
    searchTerm,
    setSearchTerm,
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
  } = useAdminPriceOffersState();

  const { paginatedOffers, totalCount, totalPages } = filterAndPaginateOffers(offers || []);

  const handleRefresh = () => {
    refetch();
    handleClearSelection();
  };

  const handleBulkUpdate = () => {
    refetch();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card>
          <AdminPriceOffersHeader
            offers={offers}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
          
          <CardContent className="space-y-6">
            <AdminPriceOffersFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              isLoading={isLoading}
            />

            {selectedOfferIds.length > 0 && (
              <AdminPriceOffersBulkActions
                selectedOfferIds={selectedOfferIds}
                onClearSelection={handleClearSelection}
                onBulkUpdate={handleBulkUpdate}
              />
            )}

            <AdminPriceOffersTable
              offers={paginatedOffers}
              isLoading={isLoading}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
            />

            {!isLoading && totalCount > 0 && (
              <AdminPriceOffersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPriceOffers;