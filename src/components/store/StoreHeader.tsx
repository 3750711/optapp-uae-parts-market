
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, ShieldCheck, Share2, Send } from 'lucide-react';
import { StoreWithImages } from '@/types/store';

interface StoreHeaderProps {
  store: StoreWithImages;
  averageRating?: number | null;
  reviewsCount?: number;
  onShareStore?: () => void;
  onShareToTelegram?: () => void;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({
  store,
  averageRating,
  reviewsCount,
  onShareStore,
  onShareToTelegram
}) => {
  const ratingToShow = averageRating ?? store.rating ?? null;
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3 flex-wrap">
            {store.name}
            {/* Verification status badge */}
            {store.verified ? (
              <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
                <ShieldCheck className="w-3 h-3" />
                Проверено
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 text-amber-700 border-amber-200">
                Не проверено
              </Badge>
            )}
          </h1>
          
          {/* Rating and location */}
          <div className="flex items-center flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-lg">
                {ratingToShow !== null ? ratingToShow.toFixed(1) : '-'}
              </span>
              <span className="text-muted-foreground">/ 5</span>
              {typeof reviewsCount === 'number' && (
                <span className="text-muted-foreground ml-2">· {reviewsCount} отзывов</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{store.address}</span>
            </div>
          </div>

          {/* Tags */}
          {store.tags && store.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {store.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="capitalize hover:bg-primary/10 transition-colors"
                >
                  {tag.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onShareStore && (
            <Button variant="outline" size="sm" onClick={onShareStore} className="gap-2">
              <Share2 className="w-4 h-4" /> Поделиться
            </Button>
          )}
          {onShareToTelegram && (
            <Button variant="outline" size="sm" onClick={onShareToTelegram} className="gap-2">
              <Send className="w-4 h-4" /> Telegram
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;
