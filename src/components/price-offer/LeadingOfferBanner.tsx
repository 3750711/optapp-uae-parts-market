
import React from 'react';
import { Crown, CheckCircle, Sparkles } from 'lucide-react';

interface LeadingOfferBannerProps {
  compact?: boolean;
}

export const LeadingOfferBanner: React.FC<LeadingOfferBannerProps> = ({ 
  compact = false 
}) => {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg border-2 border-green-300 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 animate-pulse" />
        <div className="relative flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-300 animate-bounce" />
          <div className="flex-1">
            <p className="text-white font-bold text-xs leading-tight">
              ✅ Ваше предложение лучшее
            </p>
            <p className="text-green-100 text-xs">
              Продавец рассматривает его
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 p-4 rounded-lg border-2 border-green-300 shadow-xl relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-500/30 animate-pulse" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-green-300 to-yellow-300 animate-pulse" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-300 animate-bounce" />
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              ✅ Ваше предложение лучшее!
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            </h3>
            <p className="text-green-100 text-sm">
              Продавец рассматривает ваше предложение
            </p>
          </div>
        </div>
        
        <div className="bg-green-700/30 p-2 rounded border border-green-400/30">
          <p className="text-green-100 text-xs flex items-center gap-1">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            Статус: В процессе рассмотрения продавцом
          </p>
        </div>
      </div>
    </div>
  );
};
