import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Package, MapPin, Calendar, DollarSign, Loader2 } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { ProductProps } from '@/components/product/ProductCard';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ProductStatusChangeDialog from '@/components/product/ProductStatusChangeDialog';
import { RepostButton } from '@/components/product/RepostButton';
import { useAuth } from '@/contexts/AuthContext';
import { useProductImages } from '@/hooks/useProductImages';
import { getOptimizedImage, CLOUDINARY_PRESETS } from '@/utils/cloudinaryOptimization';

interface SellerListingCardProps {
  product: ProductProps;
  onStatusChange?: (productId: string, newStatus: string) => void;
  onRepostSuccess?: () => void;
}

export const SellerListingCard: React.FC<SellerListingCardProps> = ({
  product,
  onStatusChange,
  onRepostSuccess
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'center',
    containScroll: 'trimSnaps'
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const images = useProductImages(product);
  
  const optimizedImages = useMemo(() => 
    images.map(url => getOptimizedImage(url, CLOUDINARY_PRESETS.SELLER_CARD)),
    [images]
  );
  
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>(() => 
    images.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Активный', className: 'bg-green-100 text-green-800 border-green-200' };
      case 'sold':
        return { label: 'Продан', className: 'bg-red-100 text-red-800 border-red-200' };
      case 'draft':
        return { label: 'Черновик', className: 'bg-gray-100 text-gray-800 border-gray-200' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const statusConfig = useMemo(
    () => getStatusConfig(product.status),
    [product.status]
  );

  const formattedDate = useMemo(() => 
    product.created_at 
      ? format(new Date(product.created_at), 'd MMM yyyy', { locale: ru })
      : '',
    [product.created_at]
  );

  const handleImageLoad = useCallback((index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>, index: number) => {
    const target = e.target as HTMLImageElement;
    
    if (target.src !== '/placeholder.svg') {
      const original = optimizedImages[index]?.original;
      if (original && target.src !== original) {
        target.src = original;
        return;
      }
      target.src = '/placeholder.svg';
    }
    
    setImageLoading(prev => ({ ...prev, [index]: false }));
  }, [optimizedImages]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleCardClick = () => {
    const targetPath = `/seller/product/${product.id}`;
    // Prevent duplicate history entries
    if (window.location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <Card 
      role="article"
      tabIndex={0}
      aria-label={`Товар: ${product.title}, цена ${product.price || 'не указана'}, статус: ${statusConfig.label}`}
      className="w-full overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Header Bar */}
      <div className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-transparent px-2.5 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {product.title}
            </h3>
          </div>
          <span className={`px-2 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2.5">
        {/* Image Carousel */}
        <div className="relative w-full">
          {images.length > 1 ? (
            <>
              <div ref={emblaRef} className="overflow-hidden rounded-lg">
                <div className="flex gap-3 px-2 items-stretch h-[200px] sm:h-[240px] md:h-[280px]">
                  {images.map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className="relative flex-[0_0_100%] min-w-0"
                    >
                      <img
                        src={optimizedImages[index].optimized}
                        srcSet={optimizedImages[index].srcSet}
                        sizes="(max-width: 640px) 320px, (max-width: 1024px) 400px, 450px"
                        alt={`${product.title} - изображение ${index + 1}`}
                        className={`w-full h-full object-contain bg-gray-50 rounded-lg transition-opacity duration-300 cursor-pointer ${
                          imageLoading[index] ? 'opacity-0' : 'opacity-100'
                        }`}
                        loading="lazy"
                        onLoad={() => handleImageLoad(index)}
                        onError={(e) => handleImageError(e, index)}
                        onClick={handleCardClick}
                      />
                      {imageLoading[index] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dots Indicator */}
              <div className="flex justify-center gap-1.5 mt-2.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      emblaApi?.scrollTo(index);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      index === selectedIndex 
                        ? 'w-6 bg-blue-600' 
                        : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Перейти к изображению ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="relative h-[200px] sm:h-[240px] md:h-[280px] rounded-lg overflow-hidden bg-gray-50">
              <img
                src={optimizedImages[0].optimized}
                srcSet={optimizedImages[0].srcSet}
                sizes="(max-width: 640px) 320px, (max-width: 1024px) 400px, 450px"
                alt={product.title}
                className={`w-full h-full object-contain transition-opacity duration-300 cursor-pointer ${
                  imageLoading[0] ? 'opacity-0' : 'opacity-100'
                }`}
                loading="lazy"
                onLoad={() => handleImageLoad(0)}
                onError={(e) => handleImageError(e, 0)}
                onClick={handleCardClick}
              />
              {imageLoading[0] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Panel */}
        <div className="border-t border-gray-200/50 mt-2.5 pt-2.5 space-y-2">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Цена:</span>
            <div className="flex items-center gap-1 text-xl font-bold text-gray-900">
              <DollarSign className="h-4 w-4" />
              {product.price}
            </div>
          </div>

          {/* Location */}
          {product.product_location && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{product.product_location}</span>
            </div>
          )}

          {/* Date */}
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Action Buttons - только если есть что показать */}
        {(product.status === 'active' && onStatusChange || user?.id === product.seller_id) && (
          <div className="border-t border-gray-200/50 mt-2.5 pt-2.5 flex gap-2">
            {/* Mark as Sold Button */}
            {product.status === 'active' && onStatusChange && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex-1"
              >
                <ProductStatusChangeDialog
                  productId={product.id}
                  productName={product.title}
                  onStatusChange={() => onStatusChange(product.id, 'sold')}
                />
              </div>
            )}
            
            {/* Repost Button */}
            {user?.id === product.seller_id && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex-1"
              >
                <RepostButton
                  productId={product.id}
                  catalogPosition={product.catalog_position || ''}
                  status={product.status}
                  sellerId={product.seller_id}
                  currentPrice={product.price || 0}
                  productTitle={product.title}
                  onRepostSuccess={onRepostSuccess}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SellerListingCard;
