
import React from "react";
import { Check, Upload } from "lucide-react";

interface UploadedFilesInfoProps {
  totalFiles: number;
  confirmImages: string[];
  confirmVideos: string[];
  uploadError: string | null;
  isSeller?: boolean;
}

export const UploadedFilesInfo: React.FC<UploadedFilesInfoProps> = ({
  totalFiles,
  confirmImages,
  confirmVideos,
  uploadError,
  isSeller = false
}) => {
  const t = {
    uploaded: isSeller ? "Uploaded" : "Загружено",
    filesConfirmation: isSeller ? "confirmation files" : "файлов подтверждения",
    photos: isSeller ? "photos" : "фотографий",
    videos: isSeller ? "videos" : "видео",
    readyToSave: isSeller ? "- files ready to save" : "- файлы готовы к сохранению",
    recommendations: isSeller ? "Confirmation Files Recommendations:" : "Рекомендации по файлам подтверждения:",
    labelProduct: isSeller 
      ? "• Label the product with order number and buyer ID"
      : "• Подпишите товар номером заказа и ID покупателя",
    addScreenshotDiscussion: isSeller
      ? "• Add screenshot of conversation if you discussed details with the buyer"
      : "• Добавьте скриншот переписки если вы обсуждали детали с покупателем",
    addScreenshotPrice: isSeller
      ? "• Add screenshot of price discussion conversation"
      : "• Добавьте скриншот переписки с обсуждения цены",
    forVideos: isSeller ? "For videos:" : "Для видео:",
    addMoreVideos: isSeller
      ? "• Add more videos if you sent them to the seller"
      : "• Добавьте больше видео если вы присылали их продавцу",
    addEndoscopyVideos: isSeller
      ? "• Add endoscopy, oil and rotation videos for motors"
      : "• Добавьте видео эндоскопии, масла и прокрутки для моторов"
  };
  if (totalFiles > 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-green-700">
          <Check className="h-4 w-4" />
          <span className="font-medium text-sm">
            {t.uploaded} {totalFiles} {t.filesConfirmation}
          </span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          {confirmImages.length > 0 && `${confirmImages.length} ${t.photos}`}
          {confirmImages.length > 0 && confirmVideos.length > 0 && ', '}
          {confirmVideos.length > 0 && `${confirmVideos.length} ${t.videos}`}
          {t.readyToSave}
        </p>
      </div>
    );
  }

  if (!uploadError) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2 text-blue-700">
          <Upload className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-medium">{t.recommendations}</p>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>{t.labelProduct}</li>
              <li>{t.addScreenshotDiscussion}</li>
              <li>{t.addScreenshotPrice}</li>
            </ul>
            <p className="font-medium mt-2">{t.forVideos}</p>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>{t.addMoreVideos}</li>
              <li>{t.addEndoscopyVideos}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
