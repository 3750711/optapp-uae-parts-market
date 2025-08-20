import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { InlineEditableField } from '@/components/ui/InlineEditableField';
import { InlineEditableTextarea } from '@/components/ui/InlineEditableTextarea';
import { InlineEditableSelect } from '@/components/ui/InlineEditableSelect';
import { useOptimizedFormAutosave } from '@/hooks/useOptimizedFormAutosave';
import SellerOrderPriceConfirmDialog from './SellerOrderPriceConfirmDialog';

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  delivery_price?: number;
  place_number?: number;
  product_images?: { url: string; is_primary?: boolean }[];
}

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface OrderConfirmationStepProps {
  product: Product;
  seller: SellerProfile;
  buyer: BuyerProfile;
  onConfirm: (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
    editedData?: {
      title: string;
      brand: string;
      model: string;
      price: number;
      deliveryPrice: number;
      placeNumber: number;
      textOrder: string;
    };
  }) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

interface EditableData {
  title: string;
  brand: string;
  model: string;
  price: number;
  deliveryPrice: number;
  deliveryMethod: string;
  placeNumber: number;
  textOrder: string;
}

const DELIVERY_OPTIONS = [
  { value: 'cargo_rf', label: '🚛 Cargo RF Delivery' },
  { value: 'self_pickup', label: '📦 Self Pickup' },
  { value: 'cargo_kz', label: '🚚 Cargo KZ Delivery' }
];

const OrderConfirmationStep: React.FC<OrderConfirmationStepProps> = ({
  product,
  seller,
  buyer,
  onConfirm,
  onBack,
  isSubmitting
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showPriceConfirmDialog, setShowPriceConfirmDialog] = useState(false);
  const [editableData, setEditableData] = useState<EditableData>({
    title: product.title,
    brand: product.brand || '',
    model: product.model || '',
    price: product.price,
    deliveryPrice: product.delivery_price || 0,
    deliveryMethod: 'cargo_rf',
    placeNumber: product.place_number ?? 1,
    textOrder: ''
  });

  // Setup autosave for editable data
  const {
    loadSavedData: loadEditableData,
    clearSavedData: clearEditableData,
    draftExists: editableDataExists,
    saveNow: saveEditableDataNow
  } = useOptimizedFormAutosave({
    key: `order_confirmation_${product.id}`,
    data: editableData,
    delay: 1500,
    enabled: true,
    excludeFields: []
  });

  // Load saved editable data on component mount
  useEffect(() => {
    const savedData = loadEditableData();
    if (savedData && editableDataExists) {
      console.log('🔄 Restoring saved editable data:', savedData);
      setEditableData(savedData);
      
      toast({
        title: "Data Restored",
        description: "Your changes have been automatically restored",
      });
    }
  }, [loadEditableData, editableDataExists, toast]);

  // Handle page visibility for immediate saves
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden, saving editable data immediately');
        saveEditableDataNow(editableData);
      }
    };

    const handlePageHide = () => {
      console.log('📱 Page hiding, saving editable data immediately');
      saveEditableDataNow(editableData);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [editableData, saveEditableDataNow]);

  // Field update handlers
  const handleFieldUpdate = async (field: keyof EditableData, value: string | number) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
    
    // Show success toast for field updates
    toast({
      title: "Field Updated",
      description: "Changes Saved",
    });
  };

  const validateForm = (): boolean => {
    if (!editableData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Product title is required",
        variant: "destructive",
      });
      return false;
    }

    if (editableData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      return false;
    }

    if (editableData.placeNumber <= 0) {
      toast({
        title: "Validation Error",
        description: "Number of places must be greater than 0",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCreateOrderClick = () => {
    if (!validateForm()) {
      return;
    }
    // Show price confirmation dialog
    setShowPriceConfirmDialog(true);
  };

  const handlePriceConfirmed = async (newProductPrice: number) => {
    try {
      // Update the price in editableData
      const updatedData = { ...editableData, price: newProductPrice };
      setEditableData(updatedData);
      
      const productImageUrls = product.product_images?.map(img => img.url) || [];
      
      const orderData = {
        price: updatedData.price,
        deliveryPrice: updatedData.deliveryPrice,
        deliveryMethod: updatedData.deliveryMethod,
        orderImages: productImageUrls,
        editedData: {
          title: updatedData.title,
          brand: updatedData.brand,
          model: updatedData.model,
          price: updatedData.price,
          deliveryPrice: updatedData.deliveryPrice,
          placeNumber: updatedData.placeNumber,
          textOrder: updatedData.textOrder
        }
      };
      
      // Close the dialog and proceed with order creation
      setShowPriceConfirmDialog(false);
      
      // Clear autosaved editable data after successful submission
      clearEditableData();
      
      await onConfirm(orderData);
    } catch (error) {
      console.error('Failed to confirm order:', error);
      toast({
        title: "Error",
        description: "Failed to confirm order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const shouldShowDeliveryPrice = () => {
    return editableData.deliveryMethod === 'cargo_rf' && editableData.deliveryPrice > 0;
  };

  const getTotalPrice = () => {
    return editableData.price + (shouldShowDeliveryPrice() ? editableData.deliveryPrice : 0);
  };

  const getDeliveryMethodLabel = (method: string) => {
    const option = DELIVERY_OPTIONS.find(opt => opt.value === method);
    return option?.label || method;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h3 className={`${isMobile ? 'text-lg' : 'text-lg'} font-semibold`}>Order Information</h3>
      </div>

      {/* Информация о товаре */}
      <Card className={isMobile ? "mx-0" : ""}>
        <CardHeader className={isMobile ? "pb-3" : ""}>
          <CardTitle className={isMobile ? "text-base" : ""}>Product Information</CardTitle>
        </CardHeader>
        <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Title:</Label>
              <InlineEditableField
                value={editableData.title}
                onSave={(value) => handleFieldUpdate('title', value)}
                required
                placeholder="Enter product title"
                className="text-base font-medium"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Price:</Label>
              <InlineEditableField
                value={editableData.price}
                onSave={(value) => handleFieldUpdate('price', value)}
                type="price"
                min={0.01}
                step="0.01"
                className="text-base font-semibold"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Brand:</Label>
              <InlineEditableField
                value={editableData.brand || 'Not specified'}
                onSave={(value) => handleFieldUpdate('brand', value)}
                placeholder="Enter brand"
                className="text-base"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Model:</Label>
              <InlineEditableField
                value={editableData.model || 'Not specified'}
                onSave={(value) => handleFieldUpdate('model', value)}
                placeholder="Enter model"
                className="text-base"
              />
            </div>
          </div>

          {/* Изображения товара */}
          {product.product_images && product.product_images.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Product Media:</Label>
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                {product.product_images.map((image, index) => (
                  <div key={index} className="aspect-square">
                    <OptimizedImage
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover rounded-md border"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Параметры заказа */}
      <Card className={isMobile ? "mx-0" : ""}>
        <CardHeader className={isMobile ? "pb-3" : ""}>
          <CardTitle className={isMobile ? "text-base" : ""}>Order Parameters</CardTitle>
        </CardHeader>
        <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Delivery:</Label>
              <InlineEditableSelect
                value={editableData.deliveryMethod}
                onSave={(value) => handleFieldUpdate('deliveryMethod', value)}
                options={DELIVERY_OPTIONS}
                placeholder="Select delivery method"
                className="text-base"
              />
            </div>
            {editableData.deliveryMethod === 'cargo_rf' && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Delivery Price:</Label>
                <InlineEditableField
                  value={editableData.deliveryPrice}
                  onSave={(value) => handleFieldUpdate('deliveryPrice', value)}
                  type="price"
                  min={0}
                  step="0.01"
                  className="text-base"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Number of Places:</Label>
              <InlineEditableField
                value={editableData.placeNumber}
                onSave={(value) => handleFieldUpdate('placeNumber', value)}
                type="number"
                min={1}
                className="text-base"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Total:</Label>
              <p className={`${isMobile ? 'text-lg' : 'text-lg'} font-bold text-primary`}>${getTotalPrice()}</p>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Additional Information:</Label>
            <InlineEditableTextarea
              value={editableData.textOrder}
              onSave={(value) => handleFieldUpdate('textOrder', value)}
              placeholder="Specify additional order information"
              emptyText="Click to add additional information"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Информация об участниках */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <Card className={isMobile ? "mx-0" : ""}>
          <CardHeader className={isMobile ? "pb-3" : ""}>
            <CardTitle className={isMobile ? "text-base" : ""}>Seller</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-2 ${isMobile ? 'px-4 pb-4' : ''}`}>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name:</Label>
              <p className="text-base">{seller.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">OPT ID:</Label>
              <p className="text-base">{seller.opt_id}</p>
            </div>
            {seller.telegram && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Telegram:</Label>
                <p className="text-base">{seller.telegram}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isMobile ? "mx-0" : ""}>
          <CardHeader className={isMobile ? "pb-3" : ""}>
            <CardTitle className={isMobile ? "text-base" : ""}>Buyer</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-2 ${isMobile ? 'px-4 pb-4' : ''}`}>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name:</Label>
              <p className="text-base">{buyer.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">OPT ID:</Label>
              <p className="text-base">{buyer.opt_id}</p>
            </div>
            {buyer.telegram && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Telegram:</Label>
                <p className="text-base">{buyer.telegram}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Кнопки действий */}
      <div className={`${isMobile ? 'space-y-3' : 'flex justify-between'}`}>
        <Button 
          variant="outline" 
          onClick={onBack} 
          disabled={isSubmitting}
          className={isMobile ? 'w-full' : ''}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Buyers
        </Button>
        
        <Button 
          onClick={handleCreateOrderClick} 
          disabled={isSubmitting}
          className={`${isMobile ? 'w-full' : 'min-w-[200px]'}`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Order...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Order
            </>
          )}
        </Button>
      </div>

      <SellerOrderPriceConfirmDialog
        open={showPriceConfirmDialog}
        onOpenChange={setShowPriceConfirmDialog}
        currentProductPrice={editableData.price}
        deliveryPrice={editableData.deliveryPrice}
        onConfirm={handlePriceConfirmed}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default OrderConfirmationStep;