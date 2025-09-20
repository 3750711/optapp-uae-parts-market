import React, { useEffect, useRef } from "react";
import { useUploadUIAdapter } from "./useUploadUIAdapter";
import { Lang } from "@/types/i18n";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";

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

  // дергаем onChange/onComplete только по успешным
  useEffect(() => {
    const ok = items.filter((i: any) => i.status === "completed" && i.cloudinaryUrl);
    const okUrls = ok.map((i: any) => i.cloudinaryUrl).filter(Boolean);
    
    if (okUrls.length > 0) {
      onChange?.(okUrls);
    }
    
    // Вызываем onComplete только когда все файлы завершены (успешно или с ошибкой)
    if (items.length > 0 && items.every((i: any) => i.status === "completed" || i.status === "error")) {
      onComplete?.(okUrls);
    }
  }, [items, onChange, onComplete]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles?.(files);
    // сбрасываем value, чтобы можно было выбрать те же файлы повторно
    e.currentTarget.value = "";
  };

  const handleAddMore = () => fileInputRef.current?.click();

  return (
    <div className="space-y-3">
      {/* Photo count indicator */}
      {hasItems && (
        <div className="text-sm text-muted-foreground">
          {photoCountText}
        </div>
      )}

      {/* Upload button - show only when no items or not at limit */}
      {(!hasItems || !hasReachedLimit) && (
        <div className="w-full">
          <button
            type="button"
            onClick={handleAddMore}
            disabled={hasReachedLimit}
            className={`w-full sm:w-auto h-12 px-4 rounded-xl border border-border transition text-sm sm:text-base bg-background text-foreground
              ${hasReachedLimit 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-accent/50 active:scale-[.99]'
              }`}
          >
            {hasItems ? addMoreText : uploadButtonText}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPick}
          />
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
                  alt=""
                  loading="lazy"
                  className="w-full aspect-square object-contain bg-muted"
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
                  {it.status === "uploading" ? `${Math.round(it.progress || 0)}%` : statusLabel(it.status, t)}
                </figcaption>
              )}

              {/* Control buttons: delete / retry */}
              <div className="absolute top-1 right-1 flex gap-1">
                {it.status === "error" && (
                  <button
                    type="button"
                    onClick={() => retryItem?.(it.id)}
                    className="px-2 py-1 rounded-md text-[11px] sm:text-xs bg-white/90 hover:bg-white transition-colors"
                  >
                    {t.retry}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeItem?.(it.id)}
                  className="px-2 py-1 rounded-md text-[11px] sm:text-xs bg-white/90 hover:bg-white transition-colors"
                  aria-label={t.delete}
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

// Status labels with translations
const getStatusLabels = (t: any) => ({
  pending: `${t.loading}…`,
  compressing: `${t.loading}…`,
  signing: `${t.loading}…`,
  uploading: `${t.loading}…`,
  default: `${t.loading}…`
});

function statusLabel(s: string, t: any) {
  const labels = getStatusLabels(t);
  return labels[s as keyof typeof labels] || labels.default;
}