import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileStabilizerProps {
  children: (isMobile: boolean) => React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * MobileStabilizer prevents hook order changes by ensuring isMobile
 * value is stable before rendering children components.
 */
export const MobileStabilizer: React.FC<MobileStabilizerProps> = ({
  children,
  fallback = null
}) => {
  const isMobile = useIsMobile();
  const [isStabilized, setIsStabilized] = useState(false);
  const [stabilizedValue, setStabilizedValue] = useState(false);

  useEffect(() => {
    // Wait longer than useIsMobile stabilization (100ms) to ensure consistency
    const stabilizeTimer = setTimeout(() => {
      setStabilizedValue(isMobile);
      setIsStabilized(true);
    }, 150);

    return () => clearTimeout(stabilizeTimer);
  }, [isMobile]);

  if (!isStabilized) {
    return fallback as React.ReactElement;
  }

  return children(stabilizedValue) as React.ReactElement;
};