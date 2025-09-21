import React from 'react';
import { Eye } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { BlurredPrice, BlurredOptId, BlurredTelegram } from './BlurredDataComponents';

interface CompactProductCardProps {
  title: string;
  brand: string | null;
  model: string | null;
  imageUrl?: string;
  // New props for telegramStyleV2 mode
  telegramStyleV2?: boolean;
  heightVariant?: 'normal' | 'compact';
  deliveryPrice?: number | null;
  lotNumber?: number;
  condition?: string;
  description?: string;
  tgViewsEstimate?: number;
}

const CompactProductCard: React.FC<CompactProductCardProps> = ({
  title,
  brand,
  model,
  imageUrl,
  telegramStyleV2 = false,
  heightVariant = 'normal',
  deliveryPrice,
  lotNumber,
  condition,
  description,
  tgViewsEstimate
}) => {
  
  // Clean and combine brand and model for display with 📦 emoji
  const cleanBrand = brand && brand !== '0' && brand.trim() !== '' ? brand.trim() : null;
  const cleanModel = model && model !== '0' && model.trim() !== '' ? model.trim() : null;
  const brandModel = [cleanBrand, cleanModel].filter(Boolean).join(' ');
  const displayText = brandModel ? `📦 ${brandModel}` : `📦 ${title}`;
  
  // Calculate heights based on variant - увеличил для помещения текста
  const containerHeight = heightVariant === 'compact' ? 'h-[280px]' : 'h-[260px]';
  const imageHeight = heightVariant === 'compact' ? 'h-[140px]' : 'h-[171px]';
  const textHeight = heightVariant === 'compact' ? 'h-[140px]' : 'h-[89px]';
  
  if (telegramStyleV2) {
    return (
      <div className={`bg-white rounded-[12px] overflow-hidden shadow-none border-0 p-0 w-[160px] ${containerHeight} flex flex-col flex-shrink-0 snap-start`}>
        {/* Image - 70-72% height */}
        <div className={`${imageHeight} w-full bg-muted flex-shrink-0 relative`}>
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover select-none"
              size="telegramCard"
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-[#f2f3f5] flex flex-col items-center justify-center">
              <svg className="h-8 w-8 text-muted-foreground mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-4.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span className="text-muted-foreground text-[12px]">Нет фото</span>
            </div>
          )}
          
          {/* Views overlay */}
          {tgViewsEstimate > 0 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white rounded-md px-2 py-1 flex items-center gap-1">
              <Eye size={12} />
              <span className="text-[11px] font-medium">
                {tgViewsEstimate > 999 ? `${Math.floor(tgViewsEstimate / 1000)}k` : tgViewsEstimate}
              </span>
            </div>
          )}
        </div>
        
        {/* Text block - фиксированная высота вместо flex-1 */}
        <div className={`${textHeight} px-2 py-2 space-y-0.5 overflow-hidden`}>
          {/* LOT */}
          {lotNumber && (
            <p className="text-[14px] leading-tight text-[#222]">
              LOT(лот) #{lotNumber}
            </p>
          )}
          
          {/* Title with 📦 emoji */}
          <p className="text-[15px] leading-tight text-[#222] font-[450] tracking-[-0.01em] line-clamp-2">
            {displayText}
          </p>
          
          {/* Emoji list */}
          <div className="space-y-0.5">
            {/* Blurred price - always shown */}
            <BlurredPrice />
            
            {/* Delivery price (visible) */}
            {deliveryPrice && (
              <p className="text-[14px] leading-snug text-[#222]">
                🚚 Цена доставки: {deliveryPrice} $
              </p>
            )}
            
            {/* Blurred OPT_ID - always shown */}
            <BlurredOptId />
            
            {/* Blurred Telegram - always shown */}
            <BlurredTelegram />
          </div>
        </div>
      </div>
    );
  }
  
  // Default mode (original styling)
  return (
    <div className={`bg-white rounded-[12px] overflow-hidden shadow-none border-0 p-0 w-[160px] ${containerHeight} flex flex-col flex-shrink-0`}>
      {/* Image */}
      <div className={`${imageHeight} w-full bg-muted flex-shrink-0`}>
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            size="thumbnail"
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
            <svg className="h-8 w-8 text-muted-foreground mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-4.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span className="text-muted-foreground text-[10px]">Нет фото</span>
          </div>
        )}
      </div>
      
      {/* Text - 22% height */}
      <div className={`${textHeight} px-2 py-1.5 flex flex-col justify-center`}>
        <p className="text-[15px] leading-tight text-[#222] line-clamp-2 font-normal">
          {displayText}
        </p>
      </div>
    </div>
  );
};

export default CompactProductCard;