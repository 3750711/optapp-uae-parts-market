
import React, { useState, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Image as ImageIcon, Eye, X, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CompactMediaGridProps {
  images: string[];
  videos: string[];
  maxPreviewItems?: number;
  onImageDelete?: (url: string) => void;
  onVideoDelete?: (url: string) => void;
}

const CompactMediaThumbnail = memo(({ 
  url, 
  type, 
  index, 
  onClick,
  onDelete,
  showDelete = false
}: { 
  url: string; 
  type: 'image' | 'video'; 
  index: number; 
  onClick: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}) => {
  const isMobile = useIsMobile();
  const size = isMobile ? 'w-12 h-12' : 'w-16 h-16';
  
  return (
    <div className={`${size} rounded border overflow-hidden bg-gray-100 flex-shrink-0 relative group`}>
      <div 
        className="w-full h-full cursor-pointer hover:scale-105 transition-transform"
        onClick={onClick}
      >
        {type === 'image' ? (
          <>
            <img
              src={url}
              alt={`Изображение ${index + 1}`}
              className="w-full h-full object-contain"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Eye className="w-3 h-3 text-white" />
            </div>
          </>
        ) : (
          <>
            <video
              src={url}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play className="w-3 h-3 text-white" />
            </div>
          </>
        )}
      </div>
      
      {/* Item number badge */}
      <div className="absolute top-0 left-0 bg-black/60 text-white text-xs px-1 rounded-br leading-none">
        {index + 1}
      </div>
      
      {/* Delete button */}
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-bl w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});

const FullScreenViewer = memo(({ 
  isOpen, 
  onClose, 
  items, 
  currentIndex, 
  onIndexChange 
}: {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ url: string; type: 'image' | 'video'; index: number }>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}) => {
  const currentItem = items[currentIndex];
  
  if (!isOpen || !currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-2">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm">
              {currentItem.type === 'image' ? 'Изображение' : 'Видео'} {currentItem.index + 1}
            </DialogTitle>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-3">
          <div className="max-h-[60vh] w-full flex items-center justify-center bg-black rounded">
            {currentItem.type === 'image' ? (
              <img
                src={currentItem.url}
                alt={`Изображение ${currentItem.index + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <video
                src={currentItem.url}
                controls
                className="max-h-full max-w-full"
                autoPlay
              />
            )}
          </div>
          
          {items.length > 1 && (
            <div className="flex gap-1 overflow-x-auto max-w-full pb-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 rounded border-2 cursor-pointer overflow-hidden flex-shrink-0 ${
                    index === currentIndex ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  onClick={() => onIndexChange(index)}
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                      <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted />
                      <Play className="absolute w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export const CompactMediaGrid: React.FC<CompactMediaGridProps> = memo(({ 
  images, 
  videos, 
  maxPreviewItems = 20,
  onImageDelete,
  onVideoDelete
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const isMobile = useIsMobile();
  
  const allItems = [
    ...images.map((url, index) => ({ url, type: 'image' as const, index })),
    ...videos.map((url, index) => ({ url, type: 'video' as const, index: images.length + index }))
  ];
  
  const visibleItems = allItems.slice(0, maxPreviewItems);
  const hiddenCount = Math.max(0, allItems.length - maxPreviewItems);
  
  const handleThumbnailClick = (globalIndex: number) => {
    setCurrentViewIndex(globalIndex);
    setViewerOpen(true);
  };

  const handleDelete = (item: typeof allItems[0]) => {
    if (item.type === 'image' && onImageDelete) {
      onImageDelete(item.url);
    } else if (item.type === 'video' && onVideoDelete) {
      onVideoDelete(item.url);
    }
  };
  
  if (allItems.length === 0) return null;
  
  const showDeleteButtons = !!(onImageDelete || onVideoDelete);
  
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{images.length}</span>
            </div>
            {videos.length > 0 && (
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{videos.length}</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {allItems.length} файлов
          </Badge>
        </div>
        
        <div className={`grid gap-2 ${
          isMobile 
            ? 'grid-cols-4' 
            : 'grid-cols-6'
        }`}>
          {visibleItems.map((item, index) => (
            <CompactMediaThumbnail
              key={`${item.type}-${item.index}`}
              url={item.url}
              type={item.type}
              index={item.index}
              onClick={() => handleThumbnailClick(index)}
              onDelete={() => handleDelete(item)}
              showDelete={showDeleteButtons}
            />
          ))}
          
          {hiddenCount > 0 && (
            <div 
              className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded border bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors`}
              onClick={() => {
                setCurrentViewIndex(maxPreviewItems);
                setViewerOpen(true);
              }}
            >
              <span className="text-xs font-medium text-gray-600">+{hiddenCount}</span>
            </div>
          )}
        </div>
      </div>
      
      <FullScreenViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        items={allItems}
        currentIndex={currentViewIndex}
        onIndexChange={setCurrentViewIndex}
      />
    </>
  );
});

CompactMediaThumbnail.displayName = 'CompactMediaThumbnail';
CompactMediaGrid.displayName = 'CompactMediaGrid';
