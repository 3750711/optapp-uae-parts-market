import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, ShieldX } from 'lucide-react';
import { authPrompt } from '@/utils/translations/authPrompt';
import { Lang } from '@/types/i18n';

interface RestrictionBadgeProps {
  userType: 'guest' | 'seller';
  language: Lang;
  className?: string;
}

export const RestrictionBadge: React.FC<RestrictionBadgeProps> = ({
  userType,
  language,
  className = ""
}) => {
  const t = authPrompt[language];
  
  if (userType === 'seller') {
    return (
      <Badge variant="warning" className={`flex items-center gap-1.5 text-xs ${className}`}>
        <ShieldX className="h-3 w-3" />
        {t.notAvailableForSellers}
      </Badge>
    );
  }
  
  return (
    <Badge variant="info" className={`flex items-center gap-1.5 text-xs ${className}`}>
      <Lock className="h-3 w-3" />
      {t.availableAfterLogin}
    </Badge>
  );
};
