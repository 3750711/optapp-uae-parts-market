
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface ProductData {
  title: string;
  price: string;
  description?: string;
  brandName?: string;
  modelName?: string;
  sellerName?: string;
  imageUrls: string[];
  videoUrls: string[];
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
  if (!isOpen || !productData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Предпросмотр товара</DialogTitle>
          <DialogDescription>
            Проверьте данные перед публикацией. Так будет выглядеть ваш товар.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-4 border rounded-md">
          <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-2xl font-bold flex-1">{productData.title}</h2>
              <p className="text-2xl font-bold text-primary whitespace-nowrap">{parseFloat(productData.price).toLocaleString('ru-RU')} ₽</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {productData.sellerName && <Badge variant="secondary">Продавец: {productData.sellerName}</Badge>}
              {productData.brandName && <Badge variant="outline">Марка: {productData.brandName}</Badge>}
              {productData.modelName && <Badge variant="outline">Модель: {productData.modelName}</Badge>}
            </div>

            <Separator />

            {productData.imageUrls.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Фотографии ({productData.imageUrls.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productData.imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productData.videoUrls.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Видео ({productData.videoUrls.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productData.videoUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video">
                      <video src={url} controls className="w-full h-full object-cover rounded-lg border" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {productData.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Описание</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{productData.description}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Редактировать
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Публикация...
              </>
            ) : (
              'Опубликовать'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewDialog;
