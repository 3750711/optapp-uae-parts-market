
import React from 'react';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';

interface OptimizedOrderVideosProps {
  videos: string[];
  className?: string;
}

export const OptimizedOrderVideos: React.FC<OptimizedOrderVideosProps> = ({
  videos,
  className = ""
}) => {
  if (!videos || videos.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        Видео не добавлены
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {videos.map((video, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-video relative">
            <video
              src={video}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Play className="h-12 w-12 text-white opacity-80" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
