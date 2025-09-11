import React, { useCallback } from 'react';
import { UploadItem } from './types';
import { useUploadUIAdapter } from './useUploadUIAdapter';

type Props = {
  existingUrls?: string[];
  onChange?: (items: UploadItem[]) => void;      // отдаём «сырой» список
  onComplete?: (urls: string[]) => void;
  max?: number;
};

export const SimplePhotoUploader: React.FC<Props> = ({
  existingUrls = [],
  onChange,
  onComplete,
  max = 8,
}) => {
  const { items, addFiles, removeById } = useUploadUIAdapter({
    existingUrls,
    max,
    onChange: (state) => onChange?.(state.items),
    onComplete,
  });

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files || []);
      addFiles(files);
    },
    [addFiles]
  );

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  }, [addFiles]);

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-border rounded-2xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input
          id="uploader-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
        <label htmlFor="uploader-input" className="inline-block px-4 py-2 rounded-xl border border-border cursor-pointer hover:bg-accent transition-colors">
          Добавить фото
        </label>
        <div className="text-sm text-muted-foreground mt-1">Перетащи сюда или выбери файлы</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.id} className="relative rounded-xl overflow-hidden border border-border">
            <img
              src={it.previewUrl}
              alt=""
              className="w-full h-28 object-cover"
            />

            {/* прогресс/статус поверх */}
            {(it.status !== 'completed' && it.status !== 'error' && it.status !== 'idle') && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur p-2">
                <div className="h-1 w-full bg-white/20 rounded">
                  <div
                    className="h-1 bg-primary rounded transition-all duration-300"
                    style={{ width: `${Math.max(2, it.progress)}%` }}
                  />
                </div>
                <div className="text-[11px] text-white mt-1">
                  {it.status === 'compressing' ? 'Сжатие…' : 'Загрузка…'} {Math.round(it.progress)}%
                </div>
              </div>
            )}

            {it.status === 'error' && (
              <div className="absolute inset-0 bg-destructive/70 text-destructive-foreground text-xs flex items-center justify-center p-2 text-center">
                Ошибка: {it.error ?? 'upload'}
              </div>
            )}

            <button
              className="absolute top-1 right-1 text-xs bg-background/80 text-foreground rounded px-2 py-1 hover:bg-background transition-colors"
              onClick={() => removeById(it.id)}
              type="button"
              aria-label="Удалить"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};