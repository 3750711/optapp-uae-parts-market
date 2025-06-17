import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  getOrderNumberFormatted,
  formatOrderPrice
} from '@/utils/orderUtils';

interface OrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  images: string[];
  videos: string[];
  selectedSeller: any;
  buyerProfile: any;
  onConfirm: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const OrderPreviewDialog: React.FC<OrderPreviewDialogProps> = ({
  open,
  onOpenChange,
  formData,
  images,
  videos,
  selectedSeller,
  buyerProfile,
  onConfirm,
  onBack,
  isLoading
}) => {
  const isMobile = useIsMobile();

  // Генерируем preview номера заказа для отображения
  const getPreviewOrderNumber = () => {
    return `НОВЫЙ_ЗАКАЗ_${Date.now().toString().slice(-6)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[90vh]'} overflow-hidden`}>
        <DialogHeader>
          <DialogTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
            Предварительный просмотр заказа
          </DialogTitle>
          <DialogDescription>
            Проверьте все данные перед созданием заказа
          </DialogDescription>
        </DialogHeader>

        <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-1' : 'px-2'}`}>
          <div className="space-y-6">
            {/* Preview Order Number */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700 font-medium">ПРЕДВАРИТЕЛЬНЫЙ НОМЕР ЗАКАЗА:</div>
              <div className="text-xl font-bold text-blue-900 tracking-wider font-mono">
                {getPreviewOrderNumber()}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Финальный номер будет присвоен после создания заказа
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Наименование</div>
                <div className="font-medium">{formData.title || 'Не указано'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Цена товара</div>
                <div className="font-medium">{formatOrderPrice({ price: formData.price })}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">OPT ID покупателя</div>
                <div className="font-medium">{formData.buyerOptId || 'Не указано'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Продавец</div>
                <div className="font-medium">{selectedSeller?.full_name || 'Не указано'}</div>
              </div>
              {formData.brand && (
                <div>
                  <div className="text-sm text-muted-foreground">Бренд</div>
                  <div className="font-medium">{formData.brand}</div>
                </div>
              )}
              {formData.model && (
                <div>
                  <div className="text-sm text-muted-foreground">Модель</div>
                  <div className="font-medium">{formData.model}</div>
                </div>
              )}
              {formData.deliveryMethod && (
                <div>
                  <div className="text-sm text-muted-foreground">Метод доставки</div>
                  <div className="font-medium">{formData.deliveryMethod}</div>
                </div>
              )}
              {formData.place_number && (
                <div>
                  <div className="text-sm text-muted-foreground">Количество мест</div>
                  <div className="font-medium">{formData.place_number}</div>
                </div>
              )}
              {formData.text_order && (
                <div>
                  <div className="text-sm text-muted-foreground">Дополнительная информация</div>
                  <div className="font-medium">{formData.text_order}</div>
                </div>
              )}
            </div>

            {/* Media Preview */}
            {(images.length > 0 || videos.length > 0) && (
              <div className="space-y-4">
                {images.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Изображения</div>
                    <div className="flex gap-2 overflow-x-auto">
                      {images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Preview ${index}`}
                          className="w-32 h-32 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {videos.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Видео</div>
                    <div className="flex gap-2 overflow-x-auto">
                      {videos.map((video, index) => (
                        <video
                          key={index}
                          src={video}
                          controls
                          className="w-64 h-36 rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between'} gap-3 mt-6`}>
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className={isMobile ? 'w-full' : ''}
          >
            Назад к редактированию
          </Button>
          
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${isMobile ? 'w-full' : ''} bg-green-600 hover:bg-green-700`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание заказа...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Подтвердить и создать заказ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
