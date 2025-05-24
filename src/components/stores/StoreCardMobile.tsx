
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Package, ShieldCheck, Phone, MessageCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { StoreWithImages } from '@/types/store';

interface StoreWithProductCount extends StoreWithImages {
  product_count?: number;
}

interface StoreCardMobileProps {
  store: StoreWithProductCount;
}

const StoreCardMobile: React.FC<StoreCardMobileProps> = ({ store }) => {
  const getMainImageUrl = () => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  return (
    <Card className="overflow-hidden border-0 shadow-card hover:shadow-elevation transition-all duration-300">
      <div className="relative">
        <div className="aspect-[16/9] relative overflow-hidden">
          <OptimizedImage
            src={getMainImageUrl()}
            alt={store.name}
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          
          {/* Verification badge */}
          <div className="absolute top-2 right-2">
            {store.verified ? (
              <Badge variant="default" className="flex items-center gap-1 bg-green-500 text-white shadow-lg">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-xs">Проверено</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-xs">
                Не проверено
              </Badge>
            )}
          </div>

          {/* Rating */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="flex items-center gap-1 bg-black/50 text-white backdrop-blur-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{store.rating?.toFixed(1) || '-'}</span>
            </Badge>
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">
          <Link 
            to={`/stores/${store.id}`} 
            className="hover:text-primary transition-colors line-clamp-2"
          >
            {store.name}
          </Link>
        </CardTitle>
        
        {store.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {store.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1" title={store.address}>
            {store.address}
          </span>
        </div>

        {/* Product count */}
        <div className="flex items-center text-sm text-gray-600">
          <Package className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
          <span>{store.product_count || 0} объявлений</span>
        </div>

        {/* Tags */}
        {store.tags && store.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {store.tags.slice(0, 2).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs capitalize"
              >
                {tag.replace('_', ' ')}
              </Badge>
            ))}
            {store.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{store.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            asChild 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            <Link to={`/stores/${store.id}`}>
              Подробнее
            </Link>
          </Button>
          
          {store.phone && (
            <Button 
              variant="outline" 
              size="sm"
              className="px-3"
              onClick={() => window.open(`tel:${store.phone}`)}
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
          
          {store.whatsapp && (
            <Button 
              variant="outline" 
              size="sm"
              className="px-3"
              onClick={() => window.open(`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`)}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreCardMobile;
