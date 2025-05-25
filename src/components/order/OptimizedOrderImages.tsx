
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import OptimizedImage from '@/components/ui/OptimizedImage';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Download, 
  Share2, 
  Eye, 
  Copy, 
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Grid,
  Maximize2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface OptimizedOrderImagesProps {
  images: string[];
  orderNumber?: string;
}

export const OptimizedOrderImages: React.FC<OptimizedOrderImagesProps> = ({
  images,
  orderNumber
}) => {
  const isMobile = useIsMobile();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsFullscreen(true);
  }, []);

  const handlePrevImage = useCallback(() => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  const handleNextImage = useCallback(() => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, images.length]);

  const handleCopyImageUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Ссылка скопирована",
        description: "URL изображения скопирован в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  }, []);

  const handleDownloadImage = useCallback(async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `order-${orderNumber}-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Загрузка началась",
        description: "Изображение сохраняется на устройство",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать изображение",
        variant: "destructive",
      });
    }
  }, [orderNumber]);

  const handleShareImage = useCallback(async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Изображение заказа ${orderNumber}`,
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyImageUrl(url);
    }
  }, [orderNumber, handleCopyImageUrl]);

  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Eye className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">Изображения не загружены</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Фотографии заказа</CardTitle>
              <Badge variant="secondary">{images.length}</Badge>
            </div>
            
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className={
            viewMode === 'grid' 
              ? `grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`
              : 'space-y-4'
          }>
            {images.map((imageUrl, index) => (
              <div key={imageUrl} className="relative group">
                <div 
                  className={`
                    ${viewMode === 'grid' ? 'aspect-square' : 'aspect-video'} 
                    rounded-lg overflow-hidden border cursor-pointer 
                    hover:shadow-lg transition-all duration-200
                    ${isMobile ? 'hover:scale-105' : 'hover:scale-102'}
                  `}
                  onClick={() => handleImageClick(index)}
                >
                  <OptimizedImage
                    src={imageUrl}
                    alt={`Order image ${index + 1}`}
                    className="w-full h-full object-cover"
                    priority={index < 4}
                    placeholder={true}
                  />
                  
                  {/* Overlay with index */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Mobile zoom indicator */}
                  {isMobile && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1 rounded">
                      <ZoomIn className="h-3 w-3" />
                    </div>
                  )}
                </div>
                
                {/* Desktop action buttons */}
                {!isMobile && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadImage(imageUrl, index);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareImage(imageUrl);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile quick actions */}
          {isMobile && images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  images.forEach((url, index) => {
                    setTimeout(() => handleDownloadImage(url, index), index * 100);
                  });
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Скачать все
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Gallery Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className={`${isMobile ? 'w-full h-full max-w-none' : 'max-w-4xl'} p-0`}>
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>Изображение {(selectedImageIndex || 0) + 1} из {images.length}</span>
              <div className="flex gap-2">
                {selectedImageIndex !== null && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadImage(images[selectedImageIndex], selectedImageIndex)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareImage(images[selectedImageIndex])}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 bg-black">
            {selectedImageIndex !== null && (
              <>
                <div className="flex items-center justify-center h-full p-4">
                  <OptimizedImage
                    src={images[selectedImageIndex]}
                    alt={`Order image ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    priority={true}
                  />
                </div>
                
                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2"
                      onClick={handlePrevImage}
                      disabled={selectedImageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      onClick={handleNextImage}
                      disabled={selectedImageIndex === images.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
