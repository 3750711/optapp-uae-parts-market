
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
        bgClass: "bg-accent",
        textClass: "text-accent-foreground",
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
          bgClass: "bg-destructive/10",
          textClass: "text-destructive",
          flag: "🚫",
          emoji: "⚠️"
        };
      case 2:
        return {
          title: "Сложно",
          language: "🇬🇧 Английский",
          level: "Сложность: 2/5",
          recommendation: "Лучше через помощника",
          bgClass: "bg-destructive/10",
          textClass: "text-destructive",
          flag: "⚠️",
          emoji: "🔶"
        };
      case 3:
        return {
          title: "Умеренно",
          language: "🇬🇧 Английский",
          level: "Сложность: 3/5",
          recommendation: "Нужен английский",
          bgClass: "bg-secondary/20",
          textClass: "text-secondary-foreground",
          flag: "🇬🇧",
          emoji: "📝"
        };
      case 4:
        return {
          title: "Легко",
          language: "🇷🇺 Русский",
          level: "Сложность: 4/5",
          recommendation: "Можно писать по-русски",
          bgClass: "bg-accent/50",
          textClass: "text-accent-foreground",
          flag: "✅",
          emoji: "👍"
        };
      case 5:
        return {
          title: "Профессионал",
          language: "🇷🇺 Свободно",
          level: "Сложность: 5/5",
          recommendation: "Отличный продавец",
          bgClass: "bg-secondary/20",
          textClass: "text-secondary-foreground",
          flag: "⭐",
          emoji: "🌟"
        };
      default:
        return {
          title: "Неизвестно",
          language: "Язык неизвестен",
          level: "Уровень неопределен",
          recommendation: "Рекомендуем помощника",
          bgClass: "bg-muted",
          textClass: "text-muted-foreground",
          flag: "❓",
          emoji: "❔"
        };
    }
  };

  const commInfo = getCommunicationInfo();

  return (
    <div className={`relative overflow-hidden rounded-lg ${commInfo.bgClass} border border-border shadow-sm ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold ${commInfo.textClass}`}>
            Сложность общения
          </span>
        </div>
        {communicationRating ? (
          <CommunicationRatingBadge rating={communicationRating} size="sm" />
        ) : (
          <div className="px-2 py-1 bg-background/80 rounded-lg border border-border">
            <span className="text-xs font-medium text-primary">Сбор отзывов</span>
          </div>
        )}
      </div>
      
      <div className={`space-y-${isMobile ? '2' : '3'}`}>
        {/* Заголовок */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{commInfo.emoji}</span>
          <h3 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} ${commInfo.textClass}`}>
            {commInfo.title}
          </h3>
        </div>

        {/* Детали */}
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2 px-2 py-1 bg-background/60 rounded-lg border border-border">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground">{commInfo.language}</span>
          </div>
          
          <div className="flex items-center gap-2 px-2 py-1 bg-background/60 rounded-lg border border-border">
            <Star className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground">{commInfo.level}</span>
          </div>
        </div>

        {/* Рекомендация */}
        <div className={`p-2 bg-background/80 rounded-lg border border-border shadow-sm ${isMobile ? 'mt-2' : 'mt-3'}`}>
          <p className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground`}>
            💡 {commInfo.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};
