import React, { useEffect, useRef } from "react";
import { useUploadUIAdapter } from "./useUploadUIAdapter";
import { generateThumbnailUrl } from "@/utils/cloudinaryUtils";


type Props = {
  max?: number;
  onChange?: (okItems: any[]) => void;
  onComplete?: (okItems: any[]) => void;
  buttonText?: string;
};

export default function SimplePhotoUploader({
  max = 20,
  onChange,
  onComplete,
  buttonText = "Загрузить фото",
}: Props) {
  const { items, uploadFiles, removeItem, retryItem } = useUploadUIAdapter({ max, onChange, onComplete });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    console.log('📸 SimplePhotoUploader: Files selected', { 
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
    
    // Simple file logging
    console.log('📸 Files to upload:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
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
          {buttonText}
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
            {/* Оптимизированное превью: thumbnail URL для всех изображений */}
            {it.cloudinaryUrl || it.thumbUrl ? (
              <img
                src={it.cloudinaryUrl 
                  ? generateThumbnailUrl(it.cloudinaryUrl) 
                  : (it.thumbUrl?.includes('cloudinary') ? generateThumbnailUrl(it.thumbUrl) : it.thumbUrl)
                }
                alt=""
                loading="lazy"
                className="w-full aspect-square object-cover bg-muted"
              />
            ) : (
              <div className="w-full aspect-square grid place-items-center text-xs text-muted-foreground bg-muted">
                {it.originalFile ? statusLabel(it.status) : "Загрузка..."}
              </div>
            )}

            {/* Прогресс / статус-оверлей (большие пальцы, мобайл) */}
            {it.status !== "completed" && !it.cloudinaryUrl && (
              <figcaption
                 className="absolute inset-0 bg-black/40 text-white text-[11px] sm:text-xs
                           grid place-items-center p-2"
              >
                {it.status === "uploading" 
                  ? `${Math.round(it.progress || 0)}%` 
                  : statusLabel(it.status)
                }
              </figcaption>
            )}

            {/* Кнопки управления: удалить / повторить */}
            <div className="absolute top-1 right-1 flex gap-1">
              {it.status === "error" && (
                <button
                  type="button"
                  onClick={() => retryItem?.(it.id)}
                  className="px-2 py-1 rounded-md text-[11px] sm:text-xs bg-white/90 hover:bg-white transition-colors"
                >
                  Повторить
                </button>
              )}
              <button
                type="button"
                onClick={() => removeItem?.(it.id)}
                className="px-2 py-1 rounded-md text-[11px] sm:text-xs bg-white/90 hover:bg-white transition-colors"
                aria-label="Удалить фото"
              >
                Удалить
              </button>
            </div>
          </figure>
        ))}
      </div>

      {/* 3) Upload Progress Summary */}
      {items.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Всего файлов:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Загружено:</span>
              <span className="font-medium text-success">
                {items.filter(item => item.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>В процессе:</span>
              <span className="font-medium text-primary">
                {items.filter(item => ['pending', 'compressing', 'signing', 'uploading'].includes(item.status)).length}
              </span>
            </div>
            {items.filter(item => item.status === 'error').length > 0 && (
              <div className="flex justify-between">
                <span>Ошибки:</span>
                <span className="font-medium text-destructive">
                  {items.filter(item => item.status === 'error').length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4) Кнопка «Добавить ещё» (видна всегда) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleAddMore}
          className="w-full sm:w-auto h-11 px-4 rounded-xl border border-border hover:bg-accent/50 text-sm bg-background text-foreground transition-colors"
        >
          Добавить ещё
        </button>
      </div>
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case "pending": return "Ожидание…";
    case "compressing": return "Компрессия…";
    case "signing": return "Подпись…";
    case "uploading": return "Загрузка…";
    default: return "Обработка…";
  }
}