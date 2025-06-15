
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import { ResponsiveOrdersView } from "@/components/admin/order/ResponsiveOrdersView";
import { OrdersPagination } from "@/components/admin/order/OrdersPagination";
import { MobilePagination } from "@/components/admin/order/MobilePagination";
import { BulkActionsBar } from "@/components/admin/order/BulkActionsBar";
import { MobileBulkActionsBar } from "@/components/admin/order/MobileBulkActionsBar";
import { AdminOrdersHeader } from "@/components/admin/order/AdminOrdersHeader";
import { AdminOrdersDialogs } from "@/components/admin/order/AdminOrdersDialogs";
import { EmptyState } from "@/components/admin/order/FallbackComponents";
import { OrdersTableSkeleton } from "@/components/admin/order/OrdersTableSkeleton";
import { useOptimizedOrdersQuery } from "@/hooks/useOptimizedOrdersQuery";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminOrdersState } from "@/hooks/useAdminOrdersState";
import { useOrderActions } from "@/hooks/useOrderActions";
import { AdminOrdersErrorBoundary } from "@/components/error/AdminOrdersErrorBoundary";

const AdminOrders = () => {
  const isMobile = useIsMobile();
  
  const {
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
  } = useAdminOrdersState();

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);

  const { data, isLoading, error, refetch, isFetching } = useOptimizedOrdersQuery({
    statusFilter,
    searchTerm: debouncedSearchTerm,
    page: currentPage,
    pageSize,
    sortField,
    sortDirection
  });

  const orders = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const hasNextPage = data?.hasNextPage || false;
  const hasPreviousPage = data?.hasPreviousPage || false;

  const {
    selectedOrder,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    bulkActionLoading,
    singleDeleteLoading,
    confirmBulkDelete,
    setConfirmBulkDelete,
    confirmBulkStatus,
    setConfirmBulkStatus,
    confirmSingleDelete,
    setConfirmSingleDelete,
    selectedOrdersData,
    totalSelectedValue,
    handleViewDetails,
    handleEdit,
    handleDelete,
    handleBulkStatusChange,
    handleBulkDelete,
    handleSingleOrderDelete,
    handleQuickAction,
    handleExport,
    handleOrderStatusChange,
  } = useOrderActions(orders, selectedOrders, refetch);

  // Error boundary for the entire page
  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <EmptyState 
            message="Ошибка загрузки заказов"
            description="Попробуйте обновить страницу или обратитесь к администратору"
          />
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <Card className="shadow-lg">
            <AdminOrdersHeader
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              debouncedSearchTerm={debouncedSearchTerm}
              onSearch={handleSearch}
              onClearSearch={clearSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onRefetch={refetch}
              totalCount={0}
              isFetching={isFetching}
            />
            <CardContent className="p-6">
              <OrdersTableSkeleton />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminOrdersErrorBoundary>
        <div className="container mx-auto py-8">
          <Card className="shadow-lg">
            <AdminOrdersHeader
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              debouncedSearchTerm={debouncedSearchTerm}
              onSearch={handleSearch}
              onClearSearch={clearSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onRefetch={refetch}
              totalCount={totalCount}
              isFetching={isFetching}
            />
            
            <CardContent className="p-6">
              {/* Desktop Bulk Actions */}
              {!isMobile && (
                <BulkActionsBar
                  selectedOrders={selectedOrders}
                  allOrders={orders}
                  onSelectAll={() => handleSelectAll(orders.map(order => order.id))}
                  onClearSelection={handleClearSelection}
                  onBulkStatusChange={(status) => {
                    setConfirmBulkStatus({ open: true, status });
                  }}
                  onBulkDelete={() => setConfirmBulkDelete(true)}
                  onExport={handleExport}
                />
              )}

              <ResponsiveOrdersView
                orders={orders}
                selectedOrders={selectedOrders}
                onSelectOrder={handleSelectOrder}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onQuickAction={handleQuickAction}
              />
              
              {/* Empty state when no results */}
              {!isLoading && !isFetching && orders.length === 0 && (
                  <EmptyState
                      message={debouncedSearchTerm || statusFilter !== 'all' ? "Заказы не найдены" : "Нет заказов"}
                      description={debouncedSearchTerm || statusFilter !== 'all' ? "Попробуйте изменить фильтры или поисковый запрос" : "Здесь будут отображаться созданные заказы"}
                  />
              )}

              {/* Responsive Pagination */}
              {totalCount > 0 && (
                <>
                  {isMobile ? (
                    <MobilePagination
                      currentPage={currentPage}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      hasNextPage={hasNextPage}
                      hasPreviousPage={hasPreviousPage}
                    />
                  ) : (
                    <OrdersPagination
                      currentPage={currentPage}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      hasNextPage={hasNextPage}
                      hasPreviousPage={hasPreviousPage}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Mobile Bulk Actions */}
          {isMobile && (
            <MobileBulkActionsBar
              selectedOrders={selectedOrders}
              allOrders={orders}
              onSelectAll={() => handleSelectAll(orders.map(order => order.id))}
              onClearSelection={handleClearSelection}
              onBulkStatusChange={(status) => {
                setConfirmBulkStatus({ open: true, status });
              }}
              onBulkDelete={() => setConfirmBulkDelete(true)}
              onExport={handleExport}
            />
          )}

          <AdminOrdersDialogs
            showEditDialog={showEditDialog}
            setShowEditDialog={setShowEditDialog}
            selectedOrder={selectedOrder}
            onOrderStatusChange={handleOrderStatusChange}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            confirmBulkDelete={confirmBulkDelete}
            setConfirmBulkDelete={setConfirmBulkDelete}
            confirmBulkStatus={confirmBulkStatus}
            setConfirmBulkStatus={setConfirmBulkStatus}
            confirmSingleDelete={confirmSingleDelete}
            setConfirmSingleDelete={setConfirmSingleDelete}
            bulkActionLoading={bulkActionLoading}
            singleDeleteLoading={singleDeleteLoading}
            selectedOrdersCount={selectedOrders.length}
            totalSelectedValue={totalSelectedValue}
            onBulkDelete={handleBulkDelete}
            onBulkStatusChange={handleBulkStatusChange}
            onSingleOrderDelete={handleSingleOrderDelete}
          />
        </div>
      </AdminOrdersErrorBoundary>
    </AdminLayout>
  );
};

export default AdminOrders;
