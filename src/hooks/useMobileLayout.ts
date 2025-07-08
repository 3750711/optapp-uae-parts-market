import { useIsMobile } from "@/hooks/use-mobile";

export const useMobileLayout = () => {
  const isMobile = useIsMobile();
  
  return {
    isMobile,
    shouldUseMobileLayout: isMobile,
    shouldUseCompactComponents: isMobile,
    shouldShowStickyActions: isMobile,
  };
};