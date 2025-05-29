
import React from "react";
import { Shield } from "lucide-react";
import { CommunicationRatingBadge } from "@/components/admin/CommunicationRatingBadge";
import { useCommunicationInfo } from "./useCommunicationInfo";

interface CommunicationRatingSectionProps {
  communicationRating?: number | null;
  isMobile?: boolean;
}

export const CommunicationRatingSection: React.FC<CommunicationRatingSectionProps> = ({
  communicationRating,
  isMobile = false
}) => {
  const commInfo = useCommunicationInfo(communicationRating);
  const CommIcon = commInfo.icon;

  const iconSize = isMobile ? "h-4 w-4" : "h-5 w-5";
  const spacing = isMobile ? "gap-2" : "gap-3";
  const textSize = isMobile ? "text-sm" : "text-base";

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
        <div className={`flex items-start ${spacing}`}>
          <CommIcon className={`${iconSize} ${commInfo.textColor} mt-0.5 flex-shrink-0`} />
          <div>
            <p className={`${commInfo.textColor} font-medium ${isMobile ? 'text-sm' : ''} ${isMobile ? '' : 'mb-1'}`}>
              {commInfo.title}
            </p>
            <p className={`text-sm text-gray-600 ${isMobile ? '' : 'mb-2'}`}>
              {commInfo.description}
            </p>
            {commInfo.recommendation && (
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${commInfo.textColor} font-medium ${isMobile ? 'mt-1' : ''}`}>
                💡 {commInfo.recommendation}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
