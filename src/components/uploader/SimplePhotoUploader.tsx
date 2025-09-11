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
  existingUrls?: string[];
};

export default function SimplePhotoUploader({
  max = 20,
  onChange,
  onComplete,
  buttonText,
  language = 'ru',
  existingUrls,
}: Props) {
  const { items, uploadFiles, removeItem, retryItem } = useUploadUIAdapter({ max, onChange, onComplete, existingUrls });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getSellerPagesTranslations(language);
  
  // Get localized button text with fallback
  const uploadButtonText = buttonText || t.media.uploadPhotos;
  const addMoreText = t.media.uploadPhotos;

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
      {/* 1) Только кнопка — никаких drag&drop */}
      <div className="w-full">
        <button
          type="button"
          onClick={handleAddMore}
                   className="w-full sm:w-auto h-12 px-4 rounded-xl border border-border hover:bg-accent/50 active:scale-[.99]
                     transition text-sm sm:text-base bg-background text-foreground"
        >
          {uploadButtonText}
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

      {/* 2) Сетка превью: мобильная адаптация */}
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
            {/* Мини-превью: thumbUrl или обычный src; не режем — object-contain */}
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

            {/* Прогресс / статус-оверлей (большие пальцы, мобайл) */}
            {it.status !== "completed" && !it.cloudinaryUrl && (
              <figcaption
                className="absolute inset-0 bg-black/40 text-white text-[11px] sm:text-xs
                           grid place-items-center p-2"
              >
                {it.status === "uploading" ? `${Math.round(it.progress || 0)}%` : statusLabel(it.status, t)}
              </figcaption>
            )}

            {/* Кнопки управления: удалить / повторить */}
            <div className="absolute top-1 right-1 flex gap-1">
              {/* Show "Saved" badge for existing photos */}
              {it.id?.startsWith('existing-') && (
                <div className="px-2 py-1 rounded-md text-xs bg-green-500 text-white">
                  Saved
                </div>
              )}
              {/* Show retry/delete buttons only for new uploads */}
              {!it.id?.startsWith('existing-') && (
                <>
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
                </>
              )}
            </div>
          </figure>
        ))}
      </div>

      {/* 3) Кнопка «Добавить ещё» (видна всегда) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleAddMore}
          className="w-full sm:w-auto h-11 px-4 rounded-xl border border-border hover:bg-accent/50 text-sm bg-background text-foreground transition-colors"
        >
          {addMoreText}
        </button>
      </div>
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