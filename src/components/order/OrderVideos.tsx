
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play } from 'lucide-react';

interface OrderVideosProps {
  videos: string[];
  title?: string;
}

const OrderVideos: React.FC<OrderVideosProps> = ({ videos, title = "Видео заказа" }) => {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((videoUrl, index) => (
            <div key={index} className="aspect-video rounded-lg overflow-hidden bg-black">
              <video
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderVideos;
