
import React from 'react';
import { AdminOrderEditDialog } from '@/components/admin/AdminOrderEditDialog';
import { AdminOrderDeleteDialog } from '@/components/admin/AdminOrderDeleteDialog';
import { BulkDeleteConfirmation, BulkStatusChangeConfirmation, SingleOrderDeleteConfirmation } from './ConfirmationDialogs';
import { BulkActionLoading } from './LoadingStates';
import { Order } from '@/hooks/useOptimizedOrdersQuery';

interface AdminOrdersDialogsProps {
  // Edit Dialog
  showEditDialog: boolean;
  setShowEditDialog: (show: boolean) => void;
  selectedOrder: Order | null;
  onOrderStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  
  // Delete Dialog
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  
  // Bulk Actions
  confirmBulkDelete: boolean;
  setConfirmBulkDelete: (confirm: boolean) => void;
  confirmBulkStatus: { open: boolean; status: string };
  setConfirmBulkStatus: (confirm: { open: boolean; status: string }) => void;
  confirmSingleDelete: boolean;
  setConfirmSingleDelete: (confirm: boolean) => void;
  
  // Loading states
  bulkActionLoading: { isLoading: boolean; action: string };
  singleDeleteLoading: boolean;
  
  // Actions
  selectedOrdersCount: number;
  totalSelectedValue: number;
  onBulkDelete: () => void;
  onBulkStatusChange: (status: string) => void;
  onSingleOrderDelete: () => void;
}

export const AdminOrdersDialogs: React.FC<AdminOrdersDialogsProps> = ({
  showEditDialog,
  setShowEditDialog,
  selectedOrder,
  onOrderStatusChange,
  showDeleteDialog,
  setShowDeleteDialog,
  confirmBulkDelete,
  setConfirmBulkDelete,
  confirmBulkStatus,
  setConfirmBulkStatus,
  confirmSingleDelete,
  setConfirmSingleDelete,
  bulkActionLoading,
  singleDeleteLoading,
  selectedOrdersCount,
  totalSelectedValue,
  onBulkDelete,
  onBulkStatusChange,
  onSingleOrderDelete
}) => {
  return (
    <>
      {/* Loading Overlay */}
      <BulkActionLoading
        isLoading={bulkActionLoading.isLoading}
        selectedCount={selectedOrdersCount}
        action={bulkActionLoading.action}
      />

      {/* Confirmation Dialogs */}
      <BulkDeleteConfirmation
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        selectedCount={selectedOrdersCount}
        totalValue={totalSelectedValue}
        onConfirm={() => {
          setConfirmBulkDelete(false);
          onBulkDelete();
        }}
        isLoading={bulkActionLoading.isLoading}
      />

      <BulkStatusChangeConfirmation
        open={confirmBulkStatus.open}
        onOpenChange={(open) => setConfirmBulkStatus({ open, status: '' })}
        selectedCount={selectedOrdersCount}
        newStatus={confirmBulkStatus.status}
        onConfirm={() => {
          setConfirmBulkStatus({ open: false, status: '' });
          onBulkStatusChange(confirmBulkStatus.status);
        }}
        isLoading={bulkActionLoading.isLoading}
      />

      <SingleOrderDeleteConfirmation
        open={confirmSingleDelete}
        onOpenChange={setConfirmSingleDelete}
        order={selectedOrder}
        onConfirm={() => {
          setConfirmSingleDelete(false);
          onSingleOrderDelete();
        }}
        isLoading={singleDeleteLoading}
      />

      {/* Existing Dialogs */}
      <AdminOrderEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        order={selectedOrder}
        onStatusChange={onOrderStatusChange}
      />

      <AdminOrderDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        order={selectedOrder}
      />
    </>
  );
};
