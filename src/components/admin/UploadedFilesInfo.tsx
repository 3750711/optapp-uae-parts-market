
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Image, Video, CheckCircle, AlertCircle } from 'lucide-react';

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
  if (totalFiles === 0 && !uploadError) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">Файлы не загружены</p>
        <p className="text-xs mt-1">Загрузите фотографии или видео для подтверждения заказа</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Загруженные файлы</h4>
        <Badge variant={uploadError ? "destructive" : "secondary"}>
          {uploadError ? (
            <AlertCircle className="mr-1 h-3 w-3" />
          ) : (
            <CheckCircle className="mr-1 h-3 w-3" />
          )}
          {totalFiles} файлов
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Image className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">{confirmImages.length}</p>
            <p className="text-xs text-blue-600">Фотографий</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <Video className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">{confirmVideos.length}</p>
            <p className="text-xs text-green-600">Видео</p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          Ошибка загрузки: {uploadError}
        </div>
      )}
    </div>
  );
};
