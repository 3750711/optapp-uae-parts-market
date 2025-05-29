
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const GenerateOGImage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateImage = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-og-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "clean minimalist logo with text 'partsbay.ae' on pure white background, modern typography, professional business logo, high contrast black text on white, 1200x630 pixels, social media banner"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.image);
      
      toast({
        title: "Изображение сгенерировано!",
        description: "Теперь вы можете скачать og-image.jpg"
      });

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать изображение. Убедитесь, что настроен Hugging Face токен.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    // Convert base64 to blob
    const base64Data = generatedImage.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'og-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Генерация OG Image для PartsBay.ae</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Создайте изображение og-image.jpg для социальных сетей с логотипом partsbay.ae на белом фоне.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={generateImage} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                'Сгенерировать изображение'
              )}
            </Button>

            {generatedImage && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <img 
                    src={generatedImage} 
                    alt="Generated OG Image" 
                    className="w-full h-auto max-w-md mx-auto"
                  />
                </div>
                
                <Button 
                  onClick={downloadImage}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать как og-image.jpg
                </Button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 mt-4">
            <p><strong>Примечание:</strong> Для работы этой функции необходимо:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Создать аккаунт на <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Hugging Face</a></li>
              <li>Получить токен доступа</li>
              <li>Добавить токен в переменные окружения Supabase как HUGGING_FACE_ACCESS_TOKEN</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateOGImage;
