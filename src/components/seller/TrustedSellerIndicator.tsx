import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getCommonTranslations } from '@/utils/translations/common';

export const TrustedSellerIndicator: React.FC = () => {
  const { language } = useLanguage();
  const t = getCommonTranslations(language);

  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
      <Shield className="h-5 w-5 text-primary" />
      <div>
        <Badge variant="default" className="bg-primary text-primary-foreground">
          {t.trustedSeller.badge}
        </Badge>
        <p className="text-sm text-muted-foreground mt-1">
          {t.trustedSeller.description}
        </p>
      </div>
    </div>
  );
};