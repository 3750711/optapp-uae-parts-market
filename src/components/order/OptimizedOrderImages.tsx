
import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface OptimizedOrderImagesProps {
  images: string[];
}

const OptimizedOrderImages: React.FC<OptimizedOrderImagesProps> = ({ images }) => {
  const [open, setOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNext = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const currentImage = images[currentImageIndex];

  return (
    <div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-4">
          {images.length > 0 ? (
            <>
              <div className="relative w-full max-w-sm">
                <OptimizedImage
                  src={currentImage}
                  alt={`Изображение ${currentImageIndex + 1}`}
                  className="w-full h-auto rounded-md"
                  onError={() => console.error('Failed to load image')}
                />
                <div className="absolute top-2 left-2 flex items-center space-x-2">
                  <Badge variant="secondary">{`${currentImageIndex + 1}/${images.length}`}</Badge>
                </div>
              </div>
              <div className="flex justify-between w-full max-w-sm mt-2">
                <Button variant="outline" size="icon" onClick={handlePrev} disabled={images.length <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext} disabled={images.length <= 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Просмотреть все изображения
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Нет изображений</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%] flex flex-col">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative">
                <OptimizedImage
                  src={url}
                  alt={`Изображение ${index + 1}`}
                  className="w-full h-auto rounded-md cursor-pointer"
                  onClick={() => {
                    setCurrentImageIndex(index);
                  }}
                  onError={() => console.error('Failed to load image')}
                />
                <div className="absolute top-2 left-2 flex items-center space-x-2">
                  <Badge variant="secondary">{index + 1}</Badge>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2"
                >
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptimizedOrderImages;
