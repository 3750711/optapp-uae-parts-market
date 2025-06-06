
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, Sparkles } from "lucide-react";

export const CloudinaryIntegrationInfo: React.FC = () => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Cloud className="h-4 w-4" />
          <Sparkles className="h-4 w-4" />
          <span>Полная интеграция с Cloudinary: автоматическое сжатие до 400KB</span>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          • Основные изображения: сжатие с q_auto:low и f_auto
        </div>
        <div className="text-xs text-blue-600">
          • Превью: автоматическое создание версий 20KB в формате WebP
        </div>
        <div className="text-xs text-blue-600">
          • Без промежуточной загрузки в Supabase Storage
        </div>
      </CardContent>
    </Card>
  );
};
