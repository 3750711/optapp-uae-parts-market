
import React, { useState } from 'react';
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
import { Loader2, Banknote, Truck, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen || !productData) {
    return null;
  }
  
  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return 'Не указана';
    return `${parseFloat(price).toLocaleString('ru-RU')} ₽`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Предпросмотр товара</DialogTitle>
            <DialogDescription>
              Проверьте данные перед публикацией. Так будет выглядеть ваш товар.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="p-4 space-y-6">
              {/* Title */}
              <h2 className="text-2xl font-bold">{productData.title}</h2>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Цена</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(productData.price)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Доставка</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(productData.deliveryPrice)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Места</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{productData.placeNumber || '1'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Characteristics and Seller */}
              <div className="space-y-4">
                 <div className="flex flex-wrap gap-2">
                    {productData.sellerName && <Badge variant="secondary">Продавец: {productData.sellerName}</Badge>}
                    {productData.brandName && <Badge variant="outline">Марка: {productData.brandName}</Badge>}
                    {productData.modelName && <Badge variant="outline">Модель: {productData.modelName}</Badge>}
                 </div>
              </div>

              <Separator />

              {/* Media Section */}
              {productData.imageUrls.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Фотографии ({productData.imageUrls.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {productData.imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square group cursor-pointer" onClick={() => setZoomedImage(url)}>
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                        {url === productData.primaryImage && (
                          <Badge className="absolute top-2 right-2" variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            Главное
                          </Badge>
                        )}
                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity">Увеличить</p>
                        </div>
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
      
      {/* Zoomed Image Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl h-[90vh] p-2 sm:p-4">
          <img src={zoomedImage || ''} alt="Zoomed preview" className="w-full h-full object-contain"/>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductPreviewDialog;
