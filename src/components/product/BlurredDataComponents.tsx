import React from 'react';

interface BlurredDataProps {
  emoji: string;
  label: string;
  value?: string | number | null;
  className?: string;
}

const BlurredData: React.FC<BlurredDataProps> = ({ emoji, label, value, className = "" }) => {
  return (
    <p className={`text-[14px] leading-snug text-[#222] ${className}`}>
      <span>{emoji} {label}: </span>
      <span aria-hidden className="blur-[4px] select-none">
        {value ? "******" : "******"}
      </span>
    </p>
  );
};

export const BlurredPrice: React.FC<{ price?: number | null }> = ({ price }) => (
  <BlurredData emoji="🪙" label="Цена" value={price} />
);

export const BlurredOptId: React.FC<{ optId?: string | null }> = ({ optId }) => (
  <BlurredData emoji="🆔" label="OPT_ID продавца" value={optId} />
);

export const BlurredTelegram: React.FC<{ telegram?: string | null }> = ({ telegram }) => (
  <BlurredData emoji="👤" label="Telegram продавца" value={telegram} />
);