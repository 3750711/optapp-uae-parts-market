import React, { useRef } from "react";
import { useUploadUIAdapter } from "../../features/uploads/useUploadUIAdapter";
import { Lang } from "@/types/i18n";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";

type Props = {
  max?: number;
  onChange?: (urls: string[]) => void;
  onComplete?: (urls: string[]) => void;
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
  const { items, addFiles, removeById } = useUploadUIAdapter({ 
    max, 
    onChange: onChange ? (state) => onChange(state.completedUrls) : undefined,
    onComplete,
    existingUrls 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getSellerPagesTranslations(language);
  
  const uploadButtonText = buttonText || t.media.uploadPhotos;
  const addMoreText = t.media.uploadPhotos;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files);
    e.currentTarget.value = "";
  };

  const handleAddMore = () => fileInputRef.current?.click();

  return (
    <div className="space-y-3">
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

      <div
        className="
          grid gap-2
          grid-cols-2
          sm:grid-cols-3
          lg:grid-cols-4
        "
        aria-live="polite"
      >
        {items.map((item) => (
          <figure
            key={item.id}
            className="relative rounded-xl border border-border bg-card overflow-hidden"
          >
            {item.url || item.previewUrl ? (
              <img
                src={item.url || item.previewUrl}
                alt=""
                loading="lazy"
                className="w-full aspect-square object-contain bg-muted"
              />
            ) : (
              <div className="w-full aspect-square grid place-items-center text-xs text-muted-foreground bg-muted">
                {item.file?.name || t.loading}
              </div>
            )}

            {item.status !== "completed" && !item.url && (
              <figcaption
                className="absolute inset-0 bg-black/40 text-white text-[11px] sm:text-xs
                           grid place-items-center p-2"
              >
                {item.status === "uploading" ? `${Math.round(item.progress || 0)}%` : statusLabel(item.status, t)}
              </figcaption>
            )}

            <div className="absolute top-1 right-1 flex gap-1">
              {item.id?.startsWith('existing-') && (
                <div className="px-2 py-1 rounded-md text-xs bg-green-500 text-white">
                  Saved
                </div>
              )}
              {!item.id?.startsWith('existing-') && (
                <button
                  type="button"
                  onClick={() => removeById(item.id)}
                  className="px-2 py-1 rounded-md text-[11px] sm:text-xs bg-white/90 hover:bg-white transition-colors"
                  aria-label={t.delete}
                >
                  {t.delete}
                </button>
              )}
            </div>
          </figure>
        ))}
      </div>

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