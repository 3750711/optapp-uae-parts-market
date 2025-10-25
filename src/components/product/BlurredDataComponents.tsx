import React from 'react';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BlurredDataProps {
  emoji?: string;
  label: string;
  value?: string | number | null;
  className?: string;
  showLabel?: boolean;
  tooltip?: string;
}

const BlurredData: React.FC<BlurredDataProps> = ({ 
  emoji, 
  label, 
  value, 
  className = "", 
  showLabel = true,
  tooltip 
}) => {
  const content = (
    <div className={`text-[14px] leading-snug ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Lock className="h-3.5 w-3.5 text-destructive" />
        {showLabel && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
      <span className="blur-[6px] select-none text-muted-foreground">
        {value || "******"}
      </span>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export const BlurredPrice: React.FC<{ price?: number | null; tooltip?: string }> = ({ price, tooltip }) => (
  <BlurredData label="Цена" value={price ? `$${price}` : "$999.99"} tooltip={tooltip} />
);

export const BlurredOptId: React.FC<{ optId?: string | null; tooltip?: string }> = ({ optId, tooltip }) => (
  <BlurredData label="OPT_ID продавца" value={optId || "ABC123XYZ"} tooltip={tooltip} />
);

export const BlurredTelegram: React.FC<{ telegram?: string | null; tooltip?: string }> = ({ telegram, tooltip }) => (
  <BlurredData label="Telegram продавца" value={telegram || "@username"} tooltip={tooltip} />
);

export const BlurredPhone: React.FC<{ phone?: string | null; tooltip?: string }> = ({ phone, tooltip }) => (
  <BlurredData label="Телефон" value={phone || "+971 XX XXX XXXX"} tooltip={tooltip} />
);

export const BlurredSellerName: React.FC<{ name?: string | null; tooltip?: string }> = ({ name, tooltip }) => (
  <BlurredData label="Имя продавца" value={name || "Seller Name"} tooltip={tooltip} showLabel={false} />
);

export const BlurredRating: React.FC<{ rating?: number | null; tooltip?: string }> = ({ rating, tooltip }) => (
  <BlurredData label="Рейтинг" value={rating ? `★★★★★ ${rating}` : "★★★★★ 4.5"} tooltip={tooltip} />
);