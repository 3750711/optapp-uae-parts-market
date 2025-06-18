
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { X, Star, StarOff, Image as ImageIcon, Video } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface CompactOrderMediaGalleryProps {
  images: string[];
  videos: string[];
  onImageDelete: (url: string) => void;
  onVideoDelete: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  disabled?: boolean;
}

const CompactMediaItem = memo(({
  url,
  type,
  index,
  isPrimary,
  onDelete,
  onSetPrimary,
  disabled
}: {
  url: string;
  type: 'image' | 'video';
  index: number;
  isPrimary?: boolean;
  onDelete: (url: string) => void;
  onSetPrimary?: (url: string) => void;
  disabled?: boolean;
}) => {
  const isMobile = useIsMobile();
  const itemSize = isMobile ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className={cn(
      itemSize,
      "relative group rounded-lg overflow-hidden border-2 bg-gray-100 flex-shrink-0",
      isPrimary ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
    )}>
      {type === 'image' ? (
        <img
          src={url}
          alt={`Изображение ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <>
          <video
            src={url}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Video className="w-3 h-3 text-white" />
          </div>
        </>
      )}

      {/* Номер элемента */}
      <div className="absolute top-0.5 left-0.5 bg-black/70 text-white text-xs px-1 rounded text-center min-w-[16px] leading-tight">
        {index + 1}
      </div>

      {/* Бейдж главного изображения */}
      {isPrimary && type === 'image' && (
        <div className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-xs px-1 rounded">
          Гл
        </div>
      )}

      {/* Кнопки управления */}
      {!disabled && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center">
          <div className="flex gap-1">
            {/* Кнопка "сделать главным" только для изображений */}
            {type === 'image' && onSetPrimary && (
              <Button
                type="button"
                size="sm"
                variant={isPrimary ? "default" : "secondary"}
                onClick={() => onSetPrimary(url)}
                className="h-5 w-5 p-0"
                title={isPrimary ? "Главное фото" : "Сделать главным"}
              >
                {isPrimary ? (
                  <Star className="h-2.5 w-2.5" />
                ) : (
                  <StarOff className="h-2.5 w-2.5" />
                )}
              </Button>
            )}
            
            {/* Кнопка удаления */}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onDelete(url)}
              className="h-5 w-5 p-0"
              title="Удалить"
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export const CompactOrderMediaGallery: React.FC<CompactOrderMediaGalleryProps> = memo(({
  images,
  videos,
  onImageDelete,
  onVideoDelete,
  onSetPrimaryImage,
  primaryImage,
  disabled = false
}) => {
  const isMobile = useIsMobile();
  const totalItems = images.length + videos.length;

  if (totalItems === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">Медиафайлы не добавлены</p>
      </div>
    );
  }

  // Объединяем все медиафайлы для отображения
  const allMedia = [
    ...images.map((url, index) => ({ url, type: 'image' as const, index })),
    ...videos.map((url, index) => ({ url, type: 'video' as const, index: images.length + index }))
  ];

  return (
    <div className="space-y-3">
      {/* Заголовок с счетчиком */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">{images.length} фото</span>
          </div>
          {videos.length > 0 && (
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">{videos.length} видео</span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Всего: {totalItems}
        </div>
      </div>

      {/* Компактная сетка */}
      <div className={cn(
        "grid gap-2",
        isMobile 
          ? "grid-cols-6" // 6 колонок на мобильных
          : "grid-cols-8" // 8 колонок на десктопе
      )}>
        {allMedia.map((item) => (
          <CompactMediaItem
            key={`${item.type}-${item.index}`}
            url={item.url}
            type={item.type}
            index={item.index}
            isPrimary={item.type === 'image' && item.url === primaryImage}
            onDelete={item.type === 'image' ? onImageDelete : onVideoDelete}
            onSetPrimary={item.type === 'image' ? onSetPrimaryImage : undefined}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
});

CompactMediaItem.displayName = 'CompactMediaItem';
CompactOrderMediaGallery.displayName = 'CompactOrderMediaGallery';
