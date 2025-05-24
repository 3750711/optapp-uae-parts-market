
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, ShieldCheck, Share, Send } from 'lucide-react';
import { StoreWithImages } from '@/types/store';

interface StoreHeaderProps {
  store: StoreWithImages;
  onShareToTelegram: () => void;
  onShare: () => void;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({
  store,
  onShareToTelegram,
  onShare
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-4">
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
                {store.rating?.toFixed(1) || '-'}
              </span>
              <span className="text-muted-foreground">/ 5</span>
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
        
        {/* Share buttons */}
        <div className="flex gap-2 ml-4">
          {/* Desktop share button */}
          <div className="hidden md:block">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShare}
              className="flex items-center gap-2 hover:bg-primary/5 transition-colors"
            >
              <Share className="h-4 w-4" />
              Поделиться
            </Button>
          </div>
          
          {/* Telegram share button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShareToTelegram}
            className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
          >
            <Send className="h-4 w-4" /> 
            <span className="hidden sm:inline">Telegram</span>
          </Button>
          
          {/* Mobile share button */}
          <div className="md:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShare}
              className="flex items-center gap-1"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;
