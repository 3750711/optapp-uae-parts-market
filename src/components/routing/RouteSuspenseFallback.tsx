
import React from 'react';
import { PBLogoLoader } from '@/components/ui/PBLogoLoader';

export const RouteSuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <PBLogoLoader message="Загрузка страницы..." />
  </div>
);
