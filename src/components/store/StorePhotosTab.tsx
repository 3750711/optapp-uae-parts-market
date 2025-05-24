
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface StoreImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface StorePhotosTabProps {
  storeImages?: StoreImage[];
  storeName: string;
}

const StorePhotosTab: React.FC<StorePhotosTabProps> = ({
  storeImages,
  storeName
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(
        selectedImageIndex > 0 ? selectedImageIndex - 1 : storeImages!.length - 1
      );
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(
        selectedImageIndex < storeImages!.length - 1 ? selectedImageIndex + 1 : 0
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') closeModal();
  };

  if (!storeImages || storeImages.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <div className="text-2xl text-muted-foreground">🏪</div>
            </div>
            <p className="text-muted-foreground text-lg">У этого магазина пока нет фотографий</p>
            <p className="text-sm text-muted-foreground mt-2">Фотографии помогают покупателям лучше понять ваш магазин</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {storeImages.map((image, index) => (
            <div 
              key={image.id} 
              className="group aspect-square overflow-hidden rounded-lg cursor-pointer border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              onClick={() => openModal(index)}
            >
              <OptimizedImage 
                src={image.url} 
                alt={`${storeName} - фото ${index + 1}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                priority={index < 4}
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-medium">
                  Просмотреть
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for full-size images */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={closeModal}>
        <DialogContent 
          className="max-w-5xl w-full p-0 border-0 bg-black/95"
          onKeyDown={handleKeyDown}
        >
          {selectedImageIndex !== null && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
                onClick={closeModal}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation buttons */}
              {storeImages && storeImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Image */}
              <div className="flex items-center justify-center min-h-[60vh] max-h-[85vh] p-4">
                <OptimizedImage
                  src={storeImages[selectedImageIndex].url}
                  alt={`${storeName} - фото ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  priority
                />
              </div>

              {/* Image counter and navigation dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {storeImages.length}
                </div>
                
                {storeImages.length > 1 && (
                  <div className="flex gap-2">
                    {storeImages.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StorePhotosTab;
