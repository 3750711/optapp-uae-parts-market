import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useUploadUIAdapter } from "./useUploadUIAdapter";
import { Lang } from "@/types/i18n";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";
import { validateUploadFile } from "@/utils/fileValidation";
import { toast } from "sonner";
import { getImageOrientation, getOrientationCSS } from "@/utils/imageOrientation";

type Props = {
  max?: number;
  onChange?: (okItems: any[]) => void;
  onComplete?: (okItems: any[]) => void;
  buttonText?: string;
  language?: Lang;
};

export default function SimplePhotoUploader({
  max = 50,
  onChange,
  onComplete,
  buttonText,
  language = 'ru',
}: Props) {
  const { items, uploadFiles, removeItem, retryItem } = useUploadUIAdapter({ max, onChange, onComplete });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getSellerPagesTranslations(language);
  
  // Track image orientations for EXIF support
  const [imageOrientations, setImageOrientations] = useState<Map<string, number>>(new Map());
  
  // Count completed items
  const completedCount = items.filter((i: any) => i.status === "completed" && i.cloudinaryUrl).length;
  const hasItems = items.length > 0;
  const hasReachedLimit = completedCount >= max;
  
  // Get localized button text with fallback
  const uploadButtonText = buttonText || t.media.uploadPhotos;
  const addMoreText = t.media.addMorePhotos;
  const photoCountText = t.media.photoCount
    .replace('{count}', completedCount.toString())
    .replace('{max}', max.toString());

  // Stable callback references to prevent race conditions
  const stableOnChange = useCallback((urls: string[]) => {
    onChange?.(urls);
  }, [onChange]);
  
  const stableOnComplete = useCallback((okUrls: string[]) => {
    onComplete?.(okUrls);
  }, [onComplete]);

  // Track previous URLs with stable comparison
  const [lastProcessedUrls, setLastProcessedUrls] = useState<string>('');
  
  const urlsString = useMemo(() => {
    return items
      .filter(item => item.status === "completed" && item.cloudinaryUrl)
      .map(item => item.cloudinaryUrl!)
      .sort() // Sort for consistent comparison
      .join('|');
  }, [items]);

  useEffect(() => {
    if (urlsString !== lastProcessedUrls && urlsString) {
      setLastProcessedUrls(urlsString);
      const urls = urlsString.split('|').filter(Boolean);
      stableOnChange(urls);
    }

    // Check if all uploads are complete
    const allComplete = items.length > 0 && items.every(item => 
      item.status === "completed" || item.status === "failed"
    );
    
    if (allComplete && items.some(item => item.status === "completed")) {
      const urls = urlsString.split('|').filter(Boolean);
      stableOnComplete(urls);
    }
  }, [urlsString, lastProcessedUrls, items, stableOnChange, stableOnComplete]);

  // Process EXIF orientation for new files
  useEffect(() => {
    items.forEach(async (item: any) => {
      if (item.originalFile && item.originalFile instanceof File && !imageOrientations.has(item.id)) {
        const orientation = await getImageOrientation(item.originalFile);
        setImageOrientations(prev => new Map(prev.set(item.id, orientation)));
      }
    });
  }, [items, imageOrientations]);

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length > 0) {
      // Validate each file before upload
      const validatedFiles: File[] = [];
      
      for (const file of files) {
        const validation = await validateUploadFile(file);
        
        if (validation.isValid) {
          validatedFiles.push(file);
          
          // Show warnings if any with enhanced context
          if (validation.warnings.length > 0) {
            console.warn(`File warnings for ${file.name}:`, validation.warnings);
            const warningContext = t.media?.hints?.retryTip || 'File has warnings';
            toast.warning(`${file.name}: ${validation.warnings[0]}\n${warningContext}`);
          }
        } else {
          // Show detailed validation errors with user hints
          const errorMsg = validation.errors.join(', ');
          console.error(`File validation failed for ${file.name}:`, validation.errors);
          
          // Enhanced error context based on error type
          let contextualHint = '';
          if (errorMsg.includes('large') || errorMsg.includes('размер')) {
            contextualHint = t.media?.hints?.fileSize || '';
          } else if (errorMsg.includes('format') || errorMsg.includes('формат')) {
            contextualHint = t.media?.hints?.supportedFormats || '';
          } else if (errorMsg.includes('pixel') || errorMsg.includes('мегапиксел')) {
            contextualHint = t.media?.hints?.maxDimensions || '';
          }
          
          toast.error(`${file.name}: ${errorMsg}${contextualHint ? '\n💡 ' + contextualHint : ''}`);
        }
      }
      
      if (validatedFiles.length > 0) {
        uploadFiles(validatedFiles);
      }
      
      if (validatedFiles.length < files.length) {
        const rejectedCount = files.length - validatedFiles.length;
        const hintText = t.media?.hints?.retryTip || 'Try selecting files again';
        toast.warning(`${rejectedCount} file(s) rejected due to validation errors\n💡 ${hintText}`);
      }
    }
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };


  return (
    <div className="space-y-3">
      {/* Photo count indicator */}
      {hasItems && (
        <div className="text-sm text-muted-foreground">
          {photoCountText}
        </div>
      )}

        {/* Upload button - direct input styled as button */}
        {(!hasItems || !hasReachedLimit) && (
          <div className="w-full relative group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPick}
              disabled={hasReachedLimit}
              className={`w-full sm:w-auto h-12 px-4 rounded-xl border border-border transition text-sm sm:text-base bg-background text-foreground cursor-pointer
                ${hasReachedLimit 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-accent/50 active:scale-[.99]'
                }
                file:hidden`}
              title={hasItems 
                ? t.media?.hints?.batchUploadTip || addMoreText
                : t.media?.hints?.supportedFormats || uploadButtonText
              }
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {hasItems ? addMoreText : uploadButtonText}
            </div>
            {/* Helpful tooltip */}
            {!hasItems && (
              <div className="absolute top-full mt-1 left-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {t.media?.hints?.dragDropTip || 'Drag files here or click to browse'}
              </div>
            )}
          </div>
        )}

      {/* Grid of uploaded images */}
      {hasItems && (
        <div
          className="
            grid gap-2
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4
          "
          aria-live="polite"
        >
          {items.map((it: any) => (
            <figure
              key={it.id}
              className="relative rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Image preview */}
              {it.cloudinaryUrl || it.thumbUrl ? (
                <img
                  src={it.cloudinaryUrl || it.thumbUrl}
                  srcSet={it.cloudinaryUrl ? `
                    ${it.cloudinaryUrl.replace('/upload/', '/upload/w_400,c_limit/')} 400w,
                    ${it.cloudinaryUrl.replace('/upload/', '/upload/w_800,c_limit/')} 800w,
                    ${it.cloudinaryUrl} 1200w
                  ` : undefined}
                  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-square object-contain bg-muted"
                  style={{ 
                    aspectRatio: '1/1',
                    transform: getOrientationCSS(imageOrientations.get(it.id) || 1)
                  }}
                />
              ) : (
                <div className="w-full aspect-square grid place-items-center text-xs text-muted-foreground bg-muted">
                  {it.originalFile?.name || t.loading}
                </div>
              )}

              {/* Progress / status overlay */}
              {it.status !== "completed" && !it.cloudinaryUrl && (
                <figcaption
                  className="absolute inset-0 bg-black/40 text-white text-[11px] sm:text-xs
                             grid place-items-center p-2"
                >
                  {it.status === "uploading" 
                    ? `${Math.round(it.progress || 0)}%` 
                    : statusLabel(it.status, t, it.error)
                  }
                </figcaption>
              )}

              {/* Control buttons: delete / retry */}
              <div className="absolute top-1 right-1 flex gap-1">
                {it.status === "error" && (
                  <button
                    type="button"
                    onClick={() => retryItem?.(it.id)}
                    className="px-2 py-1 rounded-md text-[11px] sm:text-xs bg-white/90 hover:bg-white transition-colors"
                    title={t.media?.hints?.retryTip || t.retry}
                  >
                    {t.retry}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeItem?.(it.id)}
                  className="px-2 py-1 rounded-md text-[11px] sm:text-xs bg-white/90 hover:bg-white transition-colors"
                  aria-label={t.delete}
                  title={`${t.delete} ${it.originalFile?.name || ''}`}
                >
                  {t.delete}
                </button>
              </div>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

// Enhanced status labels with contextual error information
const getStatusLabels = (t: any) => ({
  pending: t.media?.status?.preparing || `${t.loading}…`,
  compressing: t.media?.status?.compressing || `${t.loading}…`,
  signing: t.media?.status?.preparing || `${t.loading}…`,
  uploading: t.media?.status?.uploading?.replace('{progress}', '') || `${t.loading}…`,
  processing: t.media?.status?.processing || `${t.loading}…`,
  error: t.media?.status?.failed || t.error,
  failed: t.media?.status?.failed || t.error,
  retrying: t.media?.status?.retrying || `${t.retry}…`,
  cancelled: t.media?.status?.cancelled || t.cancel,
  default: `${t.loading}…`
});

function statusLabel(status: string, t: any, error?: string) {
  const labels = getStatusLabels(t);
  let baseLabel = labels[status as keyof typeof labels] || labels.default;
  
  // Add contextual error information for failed uploads
  if ((status === 'error' || status === 'failed') && error) {
    // Extract key error types and provide helpful context
    if (error.includes('size') || error.includes('large') || error.includes('размер')) {
      const hint = t.media?.hints?.fileSize || '';
      baseLabel = `${baseLabel}${hint ? ': ' + hint : ''}`;
    } else if (error.includes('format') || error.includes('формат')) {
      const hint = t.media?.hints?.supportedFormats || '';
      baseLabel = `${baseLabel}${hint ? ': ' + hint : ''}`;
    } else if (error.includes('network') || error.includes('сети')) {
      baseLabel = `${t.media?.errors?.networkError || baseLabel}`;
    } else if (error.includes('pixel') || error.includes('мегапиксел')) {
      const hint = t.media?.hints?.maxDimensions || '';
      baseLabel = `${baseLabel}${hint ? ': ' + hint : ''}`;
    }
  }
  
  return baseLabel;
}