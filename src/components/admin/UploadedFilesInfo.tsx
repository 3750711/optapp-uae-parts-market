
import React from "react";
import { Check, Upload } from "lucide-react";

interface UploadedFilesInfoProps {
  totalFiles: number;
  confirmImages: string[];
  confirmVideos: string[];
  uploadError: string | null;
}

export const UploadedFilesInfo: React.FC<UploadedFilesInfoProps> = ({
  totalFiles,
  confirmImages,
  confirmVideos,
  uploadError
}) => {
  if (totalFiles > 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-green-700">
          <Check className="h-4 w-4" />
          <span className="font-medium text-sm">
            Загружено {totalFiles} файлов подтверждения
          </span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          {confirmImages.length > 0 && `${confirmImages.length} фотографий`}
          {confirmImages.length > 0 && confirmVideos.length > 0 && ', '}
          {confirmVideos.length > 0 && `${confirmVideos.length} видео`}
          {' - файлы готовы к сохранению'}
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
            <p className="font-medium">Рекомендации по файлам подтверждения:</p>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>• Подпишите товар номером заказа и ID покупателя</li>
              <li>• Добавьте скриншот переписки если вы обсуждали детали с покупателем</li>
              <li>• Добавьте скриншот переписки с обсуждения цены</li>
            </ul>
            <p className="font-medium mt-2">Для видео:</p>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>• Добавьте больше видео если вы присылали их продавцу</li>
              <li>• Добавьте видео эндоскопии, масла и прокрутки для моторов</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
