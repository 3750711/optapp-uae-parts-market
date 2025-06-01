
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
  const iconSize = isMobile ? "h-4 w-4" : "h-5 w-5";
  const spacing = isMobile ? "gap-2" : "gap-3";
  const textSize = isMobile ? "text-sm" : "text-base";

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
    <div className={`${commInfo.bgColor} border ${commInfo.borderColor} rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
        <div className="flex items-center gap-2">
          <Shield className={`${iconSize} text-gray-600`} />
          <span className={`${textSize} font-medium text-gray-700`}>Сложность общения</span>
        </div>
        {communicationRating ? (
          <CommunicationRatingBadge rating={communicationRating} size="md" />
        ) : (
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700 bg-blue-50 ${isMobile ? 'px-2 py-1' : 'px-3 py-1'} rounded-md border border-blue-200 font-medium`}>
            Собираем отзывы
          </span>
        )}
      </div>
      
      <div className={`space-y-${isMobile ? '2' : '3'}`}>
        {/* Заголовок */}
        <div className={`flex items-center ${spacing}`}>
          <span className="text-lg">{commInfo.flag}</span>
          <div>
            <p className={`${commInfo.color} font-medium ${isMobile ? 'text-sm' : ''}`}>
              {commInfo.title}
            </p>
          </div>
        </div>

        {/* Язык общения */}
        <div className={`flex items-center ${spacing}`}>
          <Globe className={`${iconSize} ${commInfo.color} flex-shrink-0`} />
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
            {commInfo.language}
          </p>
        </div>

        {/* Уровень сложности */}
        <div className={`flex items-center ${spacing}`}>
          <Star className={`${iconSize} ${commInfo.color} flex-shrink-0`} />
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
            {commInfo.level}
          </p>
        </div>

        {/* Рекомендация */}
        <div className={`${isMobile ? 'mt-2' : 'mt-3'} p-2 bg-white/50 rounded border border-gray-200`}>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${commInfo.color} font-medium`}>
            💡 {commInfo.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};
