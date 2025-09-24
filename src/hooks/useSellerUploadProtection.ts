import { useEffect } from "react";
import { isPWAMode } from "@/utils/pwaOptimizations";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/utils/logger";

interface UploadProtectionOptions {
  isUploading: boolean;
  uploadProgress?: number;
  warningMessage?: string;
}

export function useSellerUploadProtection({
  isUploading,
  uploadProgress,
  warningMessage = "Загрузка файлов не завершена. Вы уверены, что хотите покинуть страницу?"
}: UploadProtectionOptions) {
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!isUploading) return;
    
    // На мобильных и/или в PWA — НЕ вешаем beforeunload, чтобы не убить bfcache
    if (isMobile || isPWAMode()) {
      logger.log('📱 Mobile/PWA detected - skipping beforeunload protection to preserve bfcache');
      return;
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = warningMessage;
      
      logger.log('🛡️ Upload protection triggered:', {
        isUploading,
        progress: uploadProgress,
        timestamp: new Date().toISOString()
      });
      
      return warningMessage;
    };
    
    logger.log('🛡️ Seller upload protection enabled');
    window.addEventListener("beforeunload", onBeforeUnload);
    
    return () => {
      logger.log('🛡️ Seller upload protection disabled');
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isUploading, isMobile, warningMessage, uploadProgress]);

  // Additional protection for popstate (back button)
  useEffect(() => {
    if (!isUploading) return;

    const onPopState = (e: PopStateEvent) => {
      if (isUploading) {
        logger.log('🔙 Back navigation during upload - showing confirmation');
        
        const shouldLeave = window.confirm(warningMessage);
        if (!shouldLeave) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    
    // Push initial state to enable popstate detection
    window.history.pushState(null, '', window.location.href);
    
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [isUploading, warningMessage]);

  return {
    isProtected: isUploading && !(isMobile || isPWAMode())
  };
}