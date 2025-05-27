
import React from 'react';
import { MediaUploadSection } from "@/components/admin/order/MediaUploadSection";
import { OrderConfirmationImages } from "@/components/order/OrderConfirmationImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trash2, Download, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OrderMediaTabProps {
  order: any;
  orderImages: string[];
  orderVideos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
}

export const OrderMediaTab: React.FC<OrderMediaTabProps> = ({
  order,
  orderImages,
  orderVideos,
  onImagesUpload,
  onVideoUpload,
  onVideoDelete
}) => {
  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleBulkImageDelete = async () => {
    if (selectedImages.length === 0) return;

    setIsDeleting(true);
    try {
      const remainingImages = orderImages.filter(img => !selectedImages.includes(img));
      await onImagesUpload(remainingImages);
      setSelectedImages([]);
      toast({
        title: "Успешно",
        description: `Удалено ${selectedImages.length} изображений`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить изображения",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectImage = (url: string) => {
    setSelectedImages(prev => 
      prev.includes(url) 
        ? prev.filter(img => img !== url)
        : [...prev, url]
    );
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `order-${order?.order_number}-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать изображение",
        variant: "destructive",
      });
    }
  };

  const totalFiles = orderImages.length + orderVideos.length;
  const maxFiles = 27; // 25 images + 2 videos
  const usagePercentage = (totalFiles / maxFiles) * 100;

  return (
    <div className="space-y-6">
      {/* Media Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Статистика медиафайлов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Использовано файлов:</span>
              <span>{totalFiles} / {maxFiles}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Изображения:</span>
                <span className="ml-2 font-medium">{orderImages.length} / 25</span>
              </div>
              <div>
                <span className="text-gray-600">Видео:</span>
                <span className="ml-2 font-medium">{orderVideos.length} / 2</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedImages.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Выбрано изображений: {selectedImages.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedImages([])}
                >
                  Отменить выбор
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkImageDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeleting ? "Удаление..." : "Удалить выбранные"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Image Gallery */}
      {orderImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Изображения заказа ({orderImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {orderImages.map((imageUrl, index) => (
                <div key={imageUrl} className="relative group">
                  <div 
                    className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedImages.includes(imageUrl) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Order image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(imageUrl, '_blank');
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(imageUrl, index);
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {selectedImages.includes(imageUrl) && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Загрузка и управление медиафайлами</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaUploadSection
            images={orderImages}
            videos={orderVideos}
            onImagesUpload={onImagesUpload}
            onVideoUpload={onVideoUpload}
            onVideoDelete={onVideoDelete}
            orderId={order?.id}
          />
        </CardContent>
      </Card>

      {/* Confirmation Images Section */}
      {order?.id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Фотографии подтверждения заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderConfirmationImages 
              orderId={order.id} 
              canEdit={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
