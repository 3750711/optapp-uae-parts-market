
import React from "react";
import { Shield, Globe, Star } from "lucide-react";
import { CommunicationRatingBadge } from "@/components/admin/CommunicationRatingBadge";

interface CommunicationRatingSectionProps {
  communicationRating?: number | null;
  isMobile?: boolean;
}

export const CommunicationRatingSection: React.FC<CommunicationRatingSectionProps> = ({
  communicationRating,
  isMobile = false
}) => {
  const getCommunicationInfo = () => {
    if (!communicationRating) {
      return {
        title: "Собираем отзывы",
        language: "Язык неизвестен",
        level: "Уровень неопределен",
        recommendation: "Рекомендуем помощника",
        gradient: "from-blue-500 to-indigo-600",
        bgGradient: "from-blue-50 to-indigo-50",
        flag: "❓",
        emoji: "🔍"
      };
    }

    switch (communicationRating) {
      case 1:
        return {
          title: "Очень сложно",
          language: "🇬🇧 Английский",
          level: "Сложность: 1/5",
          recommendation: "Только через помощника",
          gradient: "from-red-500 to-pink-600",
          bgGradient: "from-red-50 to-pink-50",
          flag: "🚫",
          emoji: "⚠️"
        };
      case 2:
        return {
          title: "Сложно",
          language: "🇬🇧 Английский",
          level: "Сложность: 2/5",
          recommendation: "Лучше через помощника",
          gradient: "from-orange-500 to-red-500",
          bgGradient: "from-orange-50 to-red-50",
          flag: "⚠️",
          emoji: "🔶"
        };
      case 3:
        return {
          title: "Умеренно",
          language: "🇬🇧 Английский",
          level: "Сложность: 3/5",
          recommendation: "Нужен английский",
          gradient: "from-yellow-500 to-orange-500",
          bgGradient: "from-yellow-50 to-orange-50",
          flag: "🇬🇧",
          emoji: "📝"
        };
      case 4:
        return {
          title: "Легко",
          language: "🇷🇺 Русский",
          level: "Сложность: 4/5",
          recommendation: "Можно писать по-русски",
          gradient: "from-green-500 to-emerald-600",
          bgGradient: "from-green-50 to-emerald-50",
          flag: "✅",
          emoji: "👍"
        };
      case 5:
        return {
          title: "Профессионал",
          language: "🇷🇺 Свободно",
          level: "Сложность: 5/5",
          recommendation: "Отличный продавец",
          gradient: "from-emerald-500 to-green-600",
          bgGradient: "from-emerald-50 to-green-50",
          flag: "⭐",
          emoji: "🌟"
        };
      default:
        return {
          title: "Неизвестно",
          language: "Язык неизвестен",
          level: "Уровень неопределен",
          recommendation: "Рекомендуем помощника",
          gradient: "from-gray-500 to-slate-600",
          bgGradient: "from-gray-50 to-slate-50",
          flag: "❓",
          emoji: "❔"
        };
    }
  };

  const commInfo = getCommunicationInfo();

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${commInfo.bgGradient} border border-white/50 shadow-lg ${isMobile ? 'p-3' : 'p-4'}`}>
      {/* Декоративные элементы */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -translate-y-4 translate-x-4"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full translate-y-3 -translate-x-3"></div>
      
      <div className="relative z-10">
        <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-gradient-to-br ${commInfo.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-800`}>
              Сложность общения
            </span>
          </div>
          {communicationRating ? (
            <CommunicationRatingBadge rating={communicationRating} size="sm" />
          ) : (
            <div className="px-2 py-1 bg-white/80 rounded-lg">
              <span className="text-xs font-medium text-blue-700">Сбор отзывов</span>
            </div>
          )}
        </div>
        
        <div className={`space-y-${isMobile ? '2' : '3'}`}>
          {/* Заголовок */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{commInfo.emoji}</span>
            <h3 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} text-gray-800`}>
              {commInfo.title}
            </h3>
          </div>

          {/* Детали */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 px-2 py-1 bg-white/60 rounded-lg">
              <Globe className="h-3 w-3 text-gray-600" />
              <span className="text-xs text-gray-700">{commInfo.language}</span>
            </div>
            
            <div className="flex items-center gap-2 px-2 py-1 bg-white/60 rounded-lg">
              <Star className="h-3 w-3 text-gray-600" />
              <span className="text-xs text-gray-700">{commInfo.level}</span>
            </div>
          </div>

          {/* Рекомендация */}
          <div className={`p-2 bg-white/80 rounded-lg border border-white/50 shadow-sm ${isMobile ? 'mt-2' : 'mt-3'}`}>
            <p className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-800`}>
              💡 {commInfo.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
