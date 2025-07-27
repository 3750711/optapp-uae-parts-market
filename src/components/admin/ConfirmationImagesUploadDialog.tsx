
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, SkipForward, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { SessionStatusComponent } from "./SessionStatusComponent";
import { MediaUploadTabs } from "./MediaUploadTabs";
import { UploadedFilesInfo } from "./UploadedFilesInfo";
import { useConfirmationUpload } from "./useConfirmationUpload";

interface ConfirmationImagesUploadDialogProps {
  open: boolean;
  orderId: string;
  onComplete: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export const ConfirmationImagesUploadDialog: React.FC<ConfirmationImagesUploadDialogProps> = ({
  open,
  orderId,
  onComplete,
  onSkip,
  onCancel,
}) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const isSeller = profile?.user_type === 'seller';

  // Translation helper
  const t = {
    title: isSeller ? "Order Confirmation Files Upload" : "Загрузка файлов подтверждения заказа",
    description: isSeller 
      ? "Upload photos and videos confirming order completion, or skip this step."
      : "Загрузите фотографии и видео, подтверждающие выполнение заказа, или пропустите этот шаг.",
    smartProcessing: isSeller ? "Smart Image Processing" : "Умная обработка изображений",
    processingDescription: isSeller 
      ? "Images are automatically optimized for fast loading: small files (<400KB) are not compressed, large ones are optimized to WebP format."
      : "Изображения автоматически оптимизируются для быстрой загрузки: малые файлы (<400KB) не сжимаются, большие - оптимизируются до WebP формата.",
    cancel: isSeller ? "Cancel" : "Отмена",
    skip: isSeller ? "Skip" : "Пропустить",
    saveAndContinue: isSeller ? "Save and Continue" : "Сохранить и продолжить",
    saving: isSeller ? "Saving..." : "Сохранение..."
  };
  const {
    confirmImages,
    confirmVideos,
    isUploading,
    uploadError,
    isComponentReady,
    sessionLost,
    handleImagesUpload,
    handleVideosUpload,
    handleVideoDelete,
    handleImageDelete,
    handleSaveMedia,
    handleSessionRecovery,
    handleReset
  } = useConfirmationUpload(open, orderId, onComplete);

  const totalFiles = confirmImages.length + confirmVideos.length;
  const isDisabled = !isComponentReady || sessionLost || isUploading;

  // Prevent accidental closing during upload
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isUploading) {
      // Don't close if uploading
      return;
    }
    if (!newOpen) {
      onCancel();
    }
  };

  const PreviewContent = () => (
    <div className="space-y-4">
      <SessionStatusComponent
        isComponentReady={isComponentReady}
        sessionLost={sessionLost}
        uploadError={uploadError}
        onSessionRecovery={handleSessionRecovery}
        onReset={handleReset}
        isSeller={isSeller}
      />

      {isComponentReady && !sessionLost && (
        <>
          {/* Mobile compression info */}
          {isMobile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Upload className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">
                    {t.smartProcessing}
                  </div>
                  <div className="text-blue-700 text-xs leading-relaxed">
                    {t.processingDescription}
                  </div>
                </div>
              </div>
            </div>
          )}

          <MediaUploadTabs
            confirmImages={confirmImages}
            confirmVideos={confirmVideos}
            onImagesUpload={handleImagesUpload}
            onVideosUpload={handleVideosUpload}
            onImageDelete={handleImageDelete}
            onVideoDelete={handleVideoDelete}
            orderId={orderId}
            disabled={isDisabled}
            isSeller={isSeller}
          />

          <UploadedFilesInfo
            totalFiles={totalFiles}
            confirmImages={confirmImages}
            confirmVideos={confirmVideos}
            uploadError={uploadError}
            isSeller={isSeller}
          />
        </>
      )}
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button 
        variant="outline" 
        onClick={onCancel} 
        disabled={isUploading}
        className="flex-1 sm:flex-none min-h-[44px] text-sm"
      >
        {t.cancel}
      </Button>
      <Button 
        variant="secondary" 
        onClick={onSkip}
        disabled={isUploading}
        className="flex-1 sm:flex-none min-h-[44px] text-sm flex items-center gap-2"
      >
        <SkipForward className="h-4 w-4" />
        {t.skip}
      </Button>
      <Button
        onClick={handleSaveMedia}
        disabled={isDisabled || totalFiles === 0}
        className="bg-green-600 hover:bg-green-700 min-h-[44px] text-sm flex items-center gap-2 flex-1 sm:flex-none"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.saving}
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            {t.saveAndContinue}
          </>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] w-full flex flex-col p-0"
          onInteractOutside={(e) => {
            // Prevent closing during upload
            if (isUploading) {
              e.preventDefault();
            }
          }}
        >
          <SheetHeader className="text-left p-4 pb-2 border-b">
            <SheetTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t.title}
            </SheetTitle>
            <SheetDescription className="text-sm">
              {t.description}
            </SheetDescription>
          </SheetHeader>
          
          {/* Scrollable content area - calculated height */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-2">
              <PreviewContent />
            </div>
          </ScrollArea>
          
          {/* Footer with buttons */}
          <SheetFooter className="p-4 pt-3 border-t bg-white">
            <div className="flex flex-col gap-3 w-full">
              {/* Main action button */}
              <Button
                onClick={handleSaveMedia}
                disabled={isDisabled || totalFiles === 0}
                className="bg-green-600 hover:bg-green-700 min-h-[48px] text-base flex items-center gap-2 w-full order-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {t.saveAndContinue} ({totalFiles})
                  </>
                )}
              </Button>
              
              {/* Secondary buttons */}
              <div className="flex gap-2 order-2">
                <Button 
                  variant="outline" 
                  onClick={onCancel} 
                  disabled={isUploading}
                  className="flex-1 min-h-[44px] text-sm"
                >
                  {t.cancel}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={onSkip}
                  disabled={isUploading}
                  className="flex-1 min-h-[44px] text-sm flex items-center gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  {t.skip}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-w-[95vw] sm:max-h-[90vh] max-h-[85vh] p-3 sm:p-6 flex flex-col">
        <DialogHeader className="space-y-2 pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <PreviewContent />
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t mt-auto">
          <div className="flex gap-2 order-2 sm:order-1">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={isUploading}
              className="flex-1 sm:flex-none h-10 text-sm"
            >
              {t.cancel}
            </Button>
            <Button 
              variant="secondary" 
              onClick={onSkip}
              disabled={isUploading}
              className="flex-1 sm:flex-none h-10 text-sm flex items-center gap-1"
            >
              <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
              {t.skip}
            </Button>
          </div>
          
          <Button
            onClick={handleSaveMedia}
            disabled={isDisabled || totalFiles === 0}
            className="bg-green-600 hover:bg-green-700 h-10 text-sm flex items-center gap-1 order-1 sm:order-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                {t.saveAndContinue}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
