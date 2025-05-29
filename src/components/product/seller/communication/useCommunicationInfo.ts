
import { AlertCircle, AlertTriangle, MessageSquare, CheckCircle, Info } from "lucide-react";
import { CommunicationInfo } from "./types";

export const useCommunicationInfo = (rating?: number | null): CommunicationInfo => {
  if (!rating) return {
    title: "Собираем отзывы",
    description: "Информация о сложности общения с продавцом пока недоступна",
    icon: Info,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700"
  };

  switch (rating) {
    case 1:
      return {
        title: "Невозможно договориться напрямую",
        description: "Не возможно договориться с продавцом напрямую, только через помощника partsbay",
        icon: AlertCircle,
        color: "red",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        recommendation: "Обязательно используйте помощника для связи"
      };
    case 2:
      return {
        title: "Очень сложно договориться",
        description: "Очень сложно договориться, только на английском, советуем воспользоваться помощником partsbay",
        icon: AlertTriangle,
        color: "orange",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        textColor: "text-orange-700",
        recommendation: "Рекомендуем помощника для комфортного общения"
      };
    case 3:
      return {
        title: "Можно договориться",
        description: "Можно договориться, но только на английском",
        icon: MessageSquare,
        color: "yellow",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
        recommendation: "Готовьтесь к общению на английском языке"
      };
    case 4:
      return {
        title: "Свободно общается",
        description: "Свободно общается, можно писать на русском, использует переводчик",
        icon: CheckCircle,
        color: "green",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-700",
        recommendation: "Можете смело писать на русском языке"
      };
    case 5:
      return {
        title: "Профессионал",
        description: "Профи, только прямая связь",
        icon: CheckCircle,
        color: "emerald",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-700",
        recommendation: "Отличный продавец для прямого общения"
      };
    default:
      return {
        title: "Неизвестный уровень",
        description: "Информация о коммуникации недоступна",
        icon: Info,
        color: "gray",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-700"
      };
  }
};
