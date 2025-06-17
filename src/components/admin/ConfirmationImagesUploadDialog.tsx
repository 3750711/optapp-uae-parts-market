
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, SkipForward, Check, X } from "lucide-react";
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
  SheetClose,
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
  const isMobile = useIsMobile();
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

  const PreviewContent = () => (
    <div className={`space-y-3 sm:space-y-4 ${isMobile ? 'pb-24' : ''}`}>
      <SessionStatusComponent
        isComponentReady={isComponentReady}
        sessionLost={sessionLost}
        uploadError={uploadError}
        onSessionRecovery={handleSessionRecovery}
        onReset={handleReset}
      />

      {isComponentReady && !sessionLost && (
        <>
          <MediaUploadTabs
            confirmImages={confirmImages}
            confirmVideos={confirmVideos}
            onImagesUpload={handleImagesUpload}
            onVideosUpload={handleVideosUpload}
            onImageDelete={handleImageDelete}
            onVideoDelete={handleVideoDelete}
            orderId={orderId}
            disabled={isDisabled}
          />

          <UploadedFilesInfo
            totalFiles={totalFiles}
            confirmImages={confirmImages}
            confirmVideos={confirmVideos}
            uploadError={uploadError}
          />
        </>
      )}
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none h-10 text-sm">
        Отмена
      </Button>
      <Button 
        variant="secondary" 
        onClick={onSkip}
        className="flex-1 sm:flex-none h-10 text-sm flex items-center gap-1"
      >
        <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
        Пропустить
      </Button>
      <Button
        onClick={handleSaveMedia}
        disabled={isDisabled || totalFiles === 0}
        className="bg-green-600 hover:bg-green-700 h-10 text-sm flex items-center gap-1 order-1 sm:order-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            Сохранить и продолжить
          </>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={() => {}}>
        <SheetContent side="bottom" className="h-[85vh] w-full flex flex-col p-4">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-lg flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Загрузка файлов подтверждения заказа
            </SheetTitle>
            <SheetDescription className="text-sm">
              Загрузите фотографии и видео, подтверждающие выполнение заказа, или пропустите этот шаг.
            </SheetDescription>
          </SheetHeader>
          <div className="absolute top-4 right-4">
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <ScrollArea className="flex-1 my-2">
            <PreviewContent />
          </ScrollArea>
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
            <div className="flex gap-2">
              <ActionButtons />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-3xl max-w-[95vw] sm:max-h-[90vh] max-h-[85vh] p-3 sm:p-6 flex flex-col">
        <DialogHeader className="space-y-2 pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            Загрузка файлов подтверждения заказа
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Загрузите фотографии и видео, подтверждающие выполнение заказа, или пропустите этот шаг.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <PreviewContent />
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t mt-auto">
          <div className="flex gap-2 order-2 sm:order-1">
            <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none h-10 text-sm">
              Отмена
            </Button>
            <Button 
              variant="secondary" 
              onClick={onSkip}
              className="flex-1 sm:flex-none h-10 text-sm flex items-center gap-1"
            >
              <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
              Пропустить
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
                Сохранение...
              </>
            ) : (
              <>
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                Сохранить и продолжить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
