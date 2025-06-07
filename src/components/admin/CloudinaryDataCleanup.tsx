
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Info } from 'lucide-react';

const CloudinaryDataCleanup: React.FC = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Обслуживание Cloudinary</CardTitle>
          <CardDescription>
            Инструменты для работы с изображениями Cloudinary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Система очистки данных Cloudinary была удалена. Теперь приложение использует оригинальные изображения напрямую из Cloudinary без генерации preview.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-medium">Текущий статус</h4>
            <p className="text-sm text-gray-600">
              Все товары теперь отображают оригинальные изображения из поля cloudinary_url. 
              Генерация preview изображений отключена для улучшения производительности.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CloudinaryDataCleanup;
