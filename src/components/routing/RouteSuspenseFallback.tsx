
import React from 'react';
import BrandedLoader from '@/components/loading/BrandedLoader';

export const RouteSuspenseFallback: React.FC = () => (
  <BrandedLoader variant="section" />
);
