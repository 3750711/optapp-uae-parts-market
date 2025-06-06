
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Cloud } from "lucide-react";

export const CloudinaryIntegrationInfo: React.FC = () => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Cloud className="h-4 w-4" />
          <span>Автоматическая обработка через Cloudinary</span>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          • Автоматическое сжатие и оптимизация размера файлов
        </div>
        <div className="text-xs text-blue-600">
          • Создание превью в формате WebP
        </div>
      </CardContent>
    </Card>
  );
};
