
import React from "react";
import { AlertTriangle, MessageCircle, CheckCircle, Clock } from "lucide-react";

interface CommunicationRatingSectionProps {
  communicationRating?: number | null;
  isMobile?: boolean;
}

export const CommunicationRatingSection: React.FC<CommunicationRatingSectionProps> = ({
  communicationRating,
  isMobile
}) => {
  const getRatingInfo = () => {
    if (!communicationRating) {
      return {
        icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
        title: "Собираем отзывы о коммуникации",
        description: "Пока недостаточно данных для оценки",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    }

    switch (communicationRating) {
      case 1:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          title: "Сложная коммуникация",
          description: "По статистике partsbay договориться напрямую с этим продавцем очень сложно, пожалуйста обратитесь к нашему менеджеру он поможет уточнить необходимую информацию и оформить заказ",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
      case 2:
        return {
          icon: <Clock className="w-5 h-5 text-orange-500" />,
          title: "Могут быть сложности в общении",
          description: "Продавец слабо владеет английским, могут быть сложности в переводе. Старайтесь использовать более простые слова или обратитесь за помощью к менеджеру partsbay",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200"
        };
      case 3:
        return {
          icon: <MessageCircle className="w-5 h-5 text-yellow-500" />,
          title: "Средняя коммуникация",
          description: "Продавец активно общается на английском, присылает дополнительную информацию, может подсказать и посоветовать",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200"
        };
      case 4:
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          title: "Хорошая коммуникация",
          description: "Продавец отвечает быстро и понятно",
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        };
      case 5:
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
          title: "Отличная коммуникация",
          description: "Продавец очень отзывчив и профессионален",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200"
        };
      default:
        return {
          icon: <MessageCircle className="w-5 h-5 text-gray-500" />,
          title: "Оценка недоступна",
          description: "Недостаточно данных для оценки",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        };
    }
  };

  const ratingInfo = getRatingInfo();

  return (
    <div className={`
      ${ratingInfo.bgColor} ${ratingInfo.borderColor} 
      border rounded-lg p-4 space-y-2
    `}>
      <div className="flex items-center gap-2">
        {ratingInfo.icon}
        <span className="font-medium text-gray-900">
          {ratingInfo.title}
        </span>
      </div>
      <p className={`text-sm text-gray-700 leading-relaxed ${
        communicationRating === 1 ? 'font-medium' : ''
      }`}>
        {ratingInfo.description}
      </p>
    </div>
  );
};
