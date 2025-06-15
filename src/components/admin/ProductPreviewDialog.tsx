import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Truck, Users, X } from 'lucide-react';
import ProductGallery from "@/components/product/ProductGallery";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import SellerInfo from "@/components/product/SellerInfo";
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductData {
  title: string;
  price: string;
  description?: string;
  brandName?: string;
  modelName?: string;
  sellerName?: string;
  imageUrls: string[];
  videoUrls: string[];
  placeNumber?: string;
  deliveryPrice?: string;
  primaryImage?: string;
}

interface ProductPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productData: ProductData | null;
  isSubmitting: boolean;
}

const ProductPreviewDialog: React.FC<ProductPreviewDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productData,
  isSubmitting,
}) => {
  const isMobile = useIsMobile();
  
  const [activeMedia, setActiveMedia] = useState<string | null>(null);

  React.useEffect(() => {
    if (productData) {
      setActiveMedia(productData.primaryImage || productData.imageUrls[0] || productData.videoUrls[0] || null);
    }
  }, [productData]);

  if (!isOpen || !productData) {
    return null;
  }
  
  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return 'Не указана';
    return `${parseFloat(price).toLocaleString('ru-RU')} ₽`;
  };

  const PreviewContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 p-1">
      {/* Left Column: Gallery */}
      <div className="space-y-6">
        <ProductGallery 
          images={productData.imageUrls}
          videos={productData.videoUrls}
          title={productData.title}
          selectedImage={activeMedia || undefined} 
          onImageClick={setActiveMedia}
        />
      </div>
      
      {/* Right Column: Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{productData.title}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="text-2xl md:text-3xl font-bold text-primary">{formatPrice(productData.price)}</span>
            {productData.deliveryPrice && parseFloat(productData.deliveryPrice) > 0 && (
              <div className="flex items-center gap-1 text-base text-muted-foreground">
                <Truck className="w-5 h-5" />
                <span>Доставка: {formatPrice(productData.deliveryPrice)}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <ProductSpecifications 
          brand={productData.brandName || "Не указано"}
          model={productData.modelName || "Не указано"}
          lot_number={0} // Not available in preview data
        />

        <Separator />
        
        {productData.description && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Описание</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">{productData.description}</p>
          </div>
        )}
        
        <div className="flex items-center text-muted-foreground">
          <Users className="h-5 w-5 mr-2" />
          <span>Количество мест для отправки: {productData.placeNumber || 1}</span>
        </div>

        {productData.sellerName && (
          <>
            <Separator />
            <SellerInfo
              sellerProfile={{
                full_name: productData.sellerName,
                // Provide dummy values for other required props to avoid crashes
                id: '',
                rating: 0,
                opt_id: '',
                opt_status: 'pending',
                description_user: '',
                telegram: '',
                phone: '',
                location: '',
                avatar_url: '',
                communication_ability: 0
              }}
              seller_name={productData.sellerName}
              seller_id={""}
            >
              <div className="mt-2 text-sm text-muted-foreground">
                Контактные кнопки будут доступны после публикации.
              </div>
            </SellerInfo>
          </>
        )}
      </div>
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11">
        Редактировать
      </Button>
      <Button onClick={onConfirm} disabled={isSubmitting} className="h-11">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Публикация...
          </>
        ) : (
          'Опубликовать'
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[95vh] w-full flex flex-col p-4">
          <SheetHeader className="text-left">
            <SheetTitle>Предпросмотр товара</SheetTitle>
            <SheetDescription>
              Проверьте данные перед публикацией.
            </SheetDescription>
          </SheetHeader>
          <div className="absolute top-4 right-4">
            <SheetClose asChild>
              <Button size="icon" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
          <ScrollArea className="flex-grow my-4">
            <PreviewContent />
          </ScrollArea>
          <SheetFooter className="grid grid-cols-2 gap-2 pt-4 border-t">
            <ActionButtons />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Предпросмотр товара</DialogTitle>
          <DialogDescription>
            Проверьте данные перед публикацией. Так будет выглядеть ваш товар.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] p-1 pr-4 -mr-4">
          <PreviewContent />
        </ScrollArea>
        <DialogFooter>
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewDialog;
