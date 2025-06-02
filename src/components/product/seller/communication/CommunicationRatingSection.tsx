
import React from "react";
import { MessageCircle } from "lucide-react";
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
        description: "Рекомендуем помощника",
        color: "text-gray-600"
      };
    }

    switch (communicationRating) {
      case 1:
        return {
          title: "Очень сложно",
          description: "Только через помощника",
          color: "text-red-600"
        };
      case 2:
        return {
          title: "Сложно",
          description: "Лучше через помощника",
          color: "text-orange-600"
        };
      case 3:
        return {
          title: "Умеренно",
          description: "Нужен английский",
          color: "text-yellow-600"
        };
      case 4:
        return {
          title: "Легко",
          description: "Можно писать по-русски",
          color: "text-green-600"
        };
      case 5:
        return {
          title: "Профессионал",
          description: "Отличный продавец",
          color: "text-blue-600"
        };
      default:
        return {
          title: "Неизвестно",
          description: "Рекомендуем помощника",
          color: "text-gray-600"
        };
    }
  };

  const commInfo = getCommunicationInfo();

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Сложность общения</span>
        </div>
        {communicationRating ? (
          <CommunicationRatingBadge rating={communicationRating} size="sm" />
        ) : (
          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
            Сбор отзывов
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className={`font-semibold text-sm ${commInfo.color}`}>
          {commInfo.title}
        </h3>
        <p className="text-xs text-gray-600">
          💡 {commInfo.description}
        </p>
      </div>
    </div>
  );
};
