import { useEffect, useRef } from "react";
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
  const protectionActiveRef = useRef(false);
  
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
    if (!isUploading) {
      protectionActiveRef.current = false;
      return;
    }

    protectionActiveRef.current = true;
    logger.log('🛡️ Popstate protection enabled');

    const onPopState = (e: PopStateEvent) => {
      if (!protectionActiveRef.current) return;
      
      logger.log('🔙 Back navigation during upload - showing confirmation');
      
      const shouldLeave = window.confirm(warningMessage);
      if (!shouldLeave) {
        // Prevent navigation by going forward instead of manipulating state
        window.history.forward();
      }
    };

    window.addEventListener('popstate', onPopState);
    
    return () => {
      window.removeEventListener('popstate', onPopState);
      protectionActiveRef.current = false;
      logger.log('🛡️ Popstate protection disabled');
    };
  }, [isUploading, warningMessage]);

  return {
    isProtected: isUploading && !(isMobile || isPWAMode())
  };
}