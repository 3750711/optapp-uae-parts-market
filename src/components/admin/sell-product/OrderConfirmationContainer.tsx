
import React from 'react';
import AdminOrderConfirmationDialog from '../AdminOrderConfirmationDialog';
import { ConfirmationImagesUploadDialog } from '../ConfirmationImagesUploadDialog';

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
  lot_number: number;
  seller_id: string;
  seller_name: string;
}

interface OrderConfirmationContainerProps {
  showConfirmDialog: boolean;
  showConfirmImagesDialog: boolean;
  selectedProduct: Product | null;
  selectedBuyer: BuyerProfile | null;
  createdOrder: any;
  isCreatingOrder: boolean;
  onConfirmDialogChange: (open: boolean) => void;
  onConfirmImagesDialogChange: (open: boolean) => void;
  onCreateOrder: (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
  }) => Promise<void>;
  onConfirmImagesComplete: () => void;
  onConfirmImagesSkip: () => void;
  onConfirmImagesCancel: () => void;
  onCancel: () => void;
}

const OrderConfirmationContainer: React.FC<OrderConfirmationContainerProps> = ({
  showConfirmDialog,
  showConfirmImagesDialog,
  selectedProduct,
  selectedBuyer,
  createdOrder,
  isCreatingOrder,
  onConfirmDialogChange,
  onConfirmImagesDialogChange,
  onCreateOrder,
  onConfirmImagesComplete,
  onConfirmImagesSkip,
  onConfirmImagesCancel,
  onCancel
}) => {
  return (
    <>
      {showConfirmDialog && selectedProduct && selectedBuyer && (
        <AdminOrderConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={onConfirmDialogChange}
          onConfirm={onCreateOrder}
          isSubmitting={isCreatingOrder}
          product={selectedProduct}
          seller={{ 
            id: selectedProduct.seller_id, 
            full_name: selectedProduct.seller_name, 
            opt_id: '' 
          }}
          buyer={selectedBuyer}
          onCancel={onCancel}
        />
      )}

      {showConfirmImagesDialog && createdOrder && (
        <ConfirmationImagesUploadDialog
          open={showConfirmImagesDialog}
          orderId={createdOrder.id}
          onComplete={onConfirmImagesComplete}
          onSkip={onConfirmImagesSkip}
          onCancel={onConfirmImagesCancel}
        />
      )}
    </>
  );
};

export default OrderConfirmationContainer;
