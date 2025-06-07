
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const CloudinaryDataCleanup: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Очистка данных Cloudinary</CardTitle>
          <CardDescription>
            Функциональность очистки данных была удалена. Теперь система использует оригинальные изображения напрямую.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Функции очистки данных Cloudinary больше не доступны. Система теперь работает с оригинальными изображениями через cloudinary_url и product_images.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default CloudinaryDataCleanup;
