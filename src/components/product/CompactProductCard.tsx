import React from 'react';

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
  return (
    <div className="bg-card border border-border rounded-lg p-3 min-w-[140px] flex-shrink-0 shadow-sm">
      {/* Image */}
      <div className="aspect-square w-full mb-2 rounded-md overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">No Image</span>
          </div>
        )}
      </div>
      
      {/* Brand and Model */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground leading-tight line-clamp-1">
          {brand}
        </p>
        {model && (
          <p className="text-xs text-muted-foreground leading-tight line-clamp-1">
            {model}
          </p>
        )}
      </div>
    </div>
  );
};

export default CompactProductCard;