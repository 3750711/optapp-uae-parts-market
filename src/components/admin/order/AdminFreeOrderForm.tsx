
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOptimizedAdminAccess } from '@/hooks/useOptimizedAdminAccess';
import { CreatedOrderView } from './CreatedOrderView';
import { OrderPreviewDialog } from './OrderPreviewDialog';
import { AdminFreeOrderFormHeader } from './AdminFreeOrderFormHeader';
import { AdminFreeOrderFormContent } from './AdminFreeOrderFormContent';
import { AdminFreeOrderFormActions } from './AdminFreeOrderFormActions';
import { AdminFreeOrderFormProvider } from './AdminFreeOrderFormProvider';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';

export const AdminFreeOrderForm = React.memo(() => {
  const isMobile = useIsMobile();
  const { hasAdminAccess, isCheckingAdmin } = useOptimizedAdminAccess();
  
  const {
    createdOrder,
    images,
    videos,
    buyerProfiles,
    handleOrderUpdate,
    resetForm,
    error,
    retryOperation,
    clearError,
    isDataReady
  } = useAdminOrderFormLogic();

  // Early returns for loading states
  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          У вас нет прав администратора для создания заказов
        </AlertDescription>
      </Alert>
    );
  }

  if (!isDataReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных формы...</p>
        </div>
      </div>
    );
  }

  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        videos={videos}
        onNewOrder={resetForm}
        onOrderUpdate={handleOrderUpdate}
        buyerProfile={buyerProfiles.find(buyer => buyer.opt_id === createdOrder.buyer_opt_id) || null}
      />
    );
  }

  return (
    <AdminFreeOrderFormProvider>
      {(contextValue) => (
        <div className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
          <AdminFreeOrderFormHeader />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryOperation}
                  className="ml-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Повторить
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <AdminFreeOrderFormContent
            formData={contextValue.formData}
            handleInputChange={contextValue.handleInputChange}
            images={contextValue.images}
            videos={contextValue.videos}
            onImagesUpload={contextValue.onImagesUpload}
            onImageDelete={contextValue.onImageDelete}
            onVideoUpload={contextValue.onVideoUpload}
            onVideoDelete={contextValue.onVideoDelete}
            disabled={contextValue.isLoading || !contextValue.canSubmit}
          />

          <AdminFreeOrderFormActions
            formData={contextValue.formData}
            isLoading={contextValue.isLoading}
            canSubmit={contextValue.canSubmit}
            onCreateOrderClick={contextValue.handleCreateOrderClick}
          />

          <OrderPreviewDialog
            open={contextValue.showPreview}
            onOpenChange={contextValue.setShowPreview}
            formData={contextValue.formData}
            images={contextValue.images}
            videos={contextValue.videos}
            selectedSeller={contextValue.selectedSeller}
            buyerProfile={contextValue.buyerProfiles.find(buyer => buyer.opt_id === contextValue.formData.buyerOptId) || null}
            onConfirm={contextValue.handleConfirmOrder}
            onBack={() => contextValue.setShowPreview(false)}
            isLoading={contextValue.isLoading}
          />
        </div>
      )}
    </AdminFreeOrderFormProvider>
  );
});

AdminFreeOrderForm.displayName = 'AdminFreeOrderForm';
