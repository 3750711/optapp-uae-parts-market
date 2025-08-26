import { useEffect } from "react";
import { isPWAMode } from "@/utils/pwaOptimizations";
import { useIsMobile } from "@/hooks/use-mobile";

export function useAdminSafeUnload(enabled: boolean) {
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!enabled) return;
    
    // На мобильных и/или в PWA — НЕ вешаем beforeunload, чтобы не убить bfcache
    if (isMobile || isPWAMode()) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled, isMobile]);
}