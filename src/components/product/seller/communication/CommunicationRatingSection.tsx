
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
  const iconSize = isMobile ? "h-2.5 w-2.5" : "h-4 w-4";
  const spacing = isMobile ? "gap-1" : "gap-2";
  const textSize = isMobile ? "text-xs" : "text-sm";

  // Упрощенная информация о коммуникации
  const getCommunicationInfo = () => {
    if (!communicationRating) {
      return {
        title: "Собираем отзывы о продавце",
        language: "Язык общения неизвестен",
        level: "Уровень сложности определяется",
        recommendation: "Рекомендуем использовать помощника",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        flag: "❓"
      };
    }

    switch (communicationRating) {
      case 1:
        return {
          title: "Очень сложное общение",
          language: "🇬🇧 Только английский",
          level: "Уровень сложности: очень высокий (1/5)",
          recommendation: "Обязательно используйте помощника",
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          flag: "🚫"
        };
      case 2:
        return {
          title: "Сложное общение",
          language: "🇬🇧 Только английский",
          level: "Уровень сложности: высокий (2/5)",
          recommendation: "Рекомендуем помощника для комфорта",
          color: "text-orange-700",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          flag: "⚠️"
        };
      case 3:
        return {
          title: "Умеренная сложность",
          language: "🇬🇧 Только английский",
          level: "Уровень сложности: средний (3/5)",
          recommendation: "Готовьтесь к общению на английском",
          color: "text-yellow-700",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          flag: "🇬🇧"
        };
      case 4:
        return {
          title: "Легкое общение",
          language: "🇷🇺 Русский (через переводчик)",
          level: "Уровень сложности: низкий (4/5)",
          recommendation: "Можете писать на русском языке",
          color: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          flag: "✅"
        };
      case 5:
        return {
          title: "Профессиональное общение",
          language: "🇷🇺 Свободно на русском",
          level: "Уровень сложности: минимальный (5/5)",
          recommendation: "Отличный продавец для прямого общения",
          color: "text-emerald-700",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          flag: "⭐"
        };
      default:
        return {
          title: "Неизвестный уровень",
          language: "Язык общения неизвестен",
          level: "Уровень сложности неопределен",
          recommendation: "Рекомендуем использовать помощника",
          color: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          flag: "❓"
        };
    }
  };

  const commInfo = getCommunicationInfo();

  return (
    <div className={`${commInfo.bgColor} border ${commInfo.borderColor} rounded ${isMobile ? 'p-1.5' : 'p-3'}`}>
      <div className={`flex items-center justify-between ${isMobile ? 'mb-0.5' : 'mb-2'}`}>
        <div className="flex items-center gap-1">
          <Shield className={`${iconSize} text-gray-600`} />
          <span className={`${textSize} font-medium text-gray-700`}>
            {isMobile ? 'Сложность' : 'Сложность общения'}
          </span>
        </div>
        {communicationRating ? (
          <CommunicationRatingBadge rating={communicationRating} size="sm" />
        ) : (
          <span className={`text-xs text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 font-medium`}>
            {isMobile ? 'Сбор отзывов' : 'Собираем отзывы'}
          </span>
        )}
      </div>
      
      <div className={`space-y-${isMobile ? '0.5' : '1.5'}`}>
        {/* Заголовок */}
        <div className={`flex items-center ${spacing}`}>
          <span className="text-xs">{commInfo.flag}</span>
          <div>
            <p className={`${commInfo.color} font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isMobile && commInfo.title.length > 20 ? commInfo.title.substring(0, 20) + '...' : commInfo.title}
            </p>
          </div>
        </div>

        {/* Язык общения */}
        <div className={`flex items-center ${spacing}`}>
          <Globe className={`${iconSize} ${commInfo.color} flex-shrink-0`} />
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600`}>
            {isMobile ? (commInfo.language.includes('🇬🇧') ? '🇬🇧 Английский' : '🇷🇺 Русский') : commInfo.language}
          </p>
        </div>

        {/* Уровень сложности */}
        <div className={`flex items-center ${spacing}`}>
          <Star className={`${iconSize} ${commInfo.color} flex-shrink-0`} />
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600`}>
            {isMobile ? `Уровень: ${communicationRating || '?'}/5` : commInfo.level}
          </p>
        </div>

        {/* Рекомендация */}
        <div className={`${isMobile ? 'mt-0.5' : 'mt-1.5'} p-1 bg-white/50 rounded border border-gray-200`}>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} ${commInfo.color} font-medium`}>
            💡 {isMobile && commInfo.recommendation.length > 30 ? commInfo.recommendation.substring(0, 30) + '...' : commInfo.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};
