import React from 'react';
import { Lock } from 'lucide-react';

interface BlurredDataProps {
  emoji?: string;
  label?: string;
  value?: string | number | null;
  className?: string;
  showLabel?: boolean;
}

const BlurredData: React.FC<BlurredDataProps> = ({ 
  emoji, 
  label, 
  value, 
  className = "",
  showLabel = true 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && emoji && label && (
        <span className="text-sm text-muted-foreground">
          {emoji} {label}:
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Lock className="h-3 w-3 text-muted-foreground" />
        <span aria-hidden className="blur-[6px] select-none text-sm">
          {value || "**********"}
        </span>
      </span>
    </div>
  );
};

export const BlurredPrice: React.FC<{ price?: number | null; showLabel?: boolean }> = ({ 
  price, 
  showLabel = false 
}) => (
  <BlurredData 
    emoji="💲" 
    label="Цена" 
    value={price || "1234.56"} 
    showLabel={showLabel}
    className="text-2xl font-bold"
  />
);

export const BlurredOptId: React.FC<{ optId?: string | null; showLabel?: boolean }> = ({ 
  optId, 
  showLabel = true 
}) => (
  <BlurredData 
    emoji="🆔" 
    label="OPT_ID" 
    value={optId || "PB123456"} 
    showLabel={showLabel}
  />
);

export const BlurredTelegram: React.FC<{ telegram?: string | null; showLabel?: boolean }> = ({ 
  telegram, 
  showLabel = true 
}) => (
  <BlurredData 
    emoji="📱" 
    label="Telegram" 
    value={telegram || "@username"} 
    showLabel={showLabel}
  />
);

export const BlurredPhone: React.FC<{ phone?: string | null; showLabel?: boolean }> = ({ 
  phone, 
  showLabel = true 
}) => (
  <BlurredData 
    emoji="📞" 
    label="Телефон" 
    value={phone || "+971501234567"} 
    showLabel={showLabel}
  />
);

export const BlurredSellerName: React.FC<{ name?: string | null; showLabel?: boolean }> = ({ 
  name, 
  showLabel = false 
}) => (
  <BlurredData 
    value={name || "Имя продавца"} 
    showLabel={showLabel}
    className="text-lg font-semibold"
  />
);

export const BlurredRating: React.FC<{ rating?: number | null; showLabel?: boolean }> = ({ 
  rating, 
  showLabel = false 
}) => (
  <BlurredData 
    emoji="⭐" 
    label="Рейтинг" 
    value={rating || "5.0"} 
    showLabel={showLabel}
  />
);