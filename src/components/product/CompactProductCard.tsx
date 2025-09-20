import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface CompactProductCardProps {
  title: string;
  brand: string;
  model: string | null;
  imageUrl?: string;
}

const CompactProductCard: React.FC<CompactProductCardProps> = ({
  title,
  brand,
  model,
  imageUrl
}) => {
  // Combine brand and model for Telegram-style display
  const displayText = [brand, model].filter(Boolean).join(' ') || title;
  
  return (
    <div className="bg-white rounded-[12px] overflow-hidden shadow-none border-0 p-0 w-[160px] h-[220px] flex flex-col flex-shrink-0">
      {/* Image - 78% height (~171px) */}
      <div className="h-[171px] w-full bg-muted flex-shrink-0">
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
      
      {/* Text - 22% height (~49px) */}
      <div className="h-[49px] px-2 py-1.5 flex flex-col justify-center">
        <p className="text-[15px] leading-tight text-[#222] line-clamp-2 font-normal">
          {displayText}
        </p>
      </div>
    </div>
  );
};

export default CompactProductCard;