import React from 'react';
import { cn } from '@/lib/utils';

interface BrandedLoaderProps {
  variant?: 'fullscreen' | 'section';
  message?: string;
  logoSrc?: string; // public path or imported asset
}

const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  variant = 'section',
  logoSrc = '/logo.svg',
}) => {
  const isFullscreen = variant === 'fullscreen';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex items-center justify-center',
        isFullscreen ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'min-h-[320px]'
      )}
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative h-16 w-16 md:h-20 md:w-20" aria-hidden>
          {/* Spinning ring using design tokens */}
          <div className="absolute inset-0 rounded-full border-2 border-muted border-t-primary animate-spin" />

          {/* Inner disc with logo */}
          <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center shadow-card">
            <img
              src={logoSrc}
              alt="Логотип"
              className="h-8 w-8 md:h-10 md:w-10 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = (e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement) || null;
                if (fallback) fallback.style.display = 'flex';
              }}
              loading="eager"
            />
            <div className="logo-fallback hidden h-full w-full items-center justify-center" />
          </div>
        </div>

        {/* Visually hidden text for screen readers (no visible labels) */}
        <span className="sr-only">Загрузка</span>
      </div>
    </div>
  );
};

export default BrandedLoader;
