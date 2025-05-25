
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Volume2, 
  VolumeX,
  Maximize2,
  Film
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface OptimizedOrderVideosProps {
  videos: string[];
  orderNumber?: string;
}

export const OptimizedOrderVideos: React.FC<OptimizedOrderVideosProps> = ({
  videos,
  orderNumber
}) => {
  const isMobile = useIsMobile();
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<number>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handlePlayPause = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (playingVideo === index) {
      video.pause();
      setPlayingVideo(null);
    } else {
      // Pause other videos
      videoRefs.current.forEach((v, i) => {
        if (v && i !== index) {
          v.pause();
        }
      });
      
      video.play();
      setPlayingVideo(index);
    }
  }, [playingVideo]);

  const handleMuteToggle = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const newMutedVideos = new Set(mutedVideos);
    if (mutedVideos.has(index)) {
      newMutedVideos.delete(index);
      video.muted = false;
    } else {
      newMutedVideos.add(index);
      video.muted = true;
    }
    setMutedVideos(newMutedVideos);
  }, [mutedVideos]);

  const handleDownloadVideo = useCallback(async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `order-${orderNumber}-video-${index + 1}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Загрузка началась",
        description: "Видео сохраняется на устройство",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать видео",
        variant: "destructive",
      });
    }
  }, [orderNumber]);

  const handleShareVideo = useCallback(async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Видео заказа ${orderNumber}`,
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "URL видео скопирован в буфер обмена",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать ссылку",
          variant: "destructive",
        });
      }
    }
  }, [orderNumber]);

  const handleFullscreen = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  }, []);

  if (!videos || videos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Film className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">Видео не загружены</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Видео заказа</CardTitle>
          <Badge variant="secondary">{videos.length}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {videos.map((videoUrl, index) => (
            <div key={videoUrl} className="relative group">
              <div className="aspect-video rounded-lg overflow-hidden border bg-black">
                <video
                  ref={(el) => videoRefs.current[index] = el}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  preload="metadata"
                  playsInline
                  muted={mutedVideos.has(index)}
                  onPlay={() => setPlayingVideo(index)}
                  onPause={() => setPlayingVideo(null)}
                  onEnded={() => setPlayingVideo(null)}
                />
                
                {/* Video controls overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handlePlayPause(index)}
                      className="bg-white/90 hover:bg-white"
                    >
                      {playingVideo === index ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleMuteToggle(index)}
                      className="bg-white/90 hover:bg-white"
                    >
                      {mutedVideos.has(index) ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleFullscreen(index)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={() => handleDownloadVideo(videoUrl, index)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={() => handleShareVideo(videoUrl)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Video index */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Видео {index + 1}
                </div>
              </div>
              
              {/* Mobile controls */}
              {isMobile && (
                <div className="mt-2 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayPause(index)}
                  >
                    {playingVideo === index ? (
                      <><Pause className="h-4 w-4 mr-1" /> Пауза</>
                    ) : (
                      <><Play className="h-4 w-4 mr-1" /> Играть</>
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadVideo(videoUrl, index)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareVideo(videoUrl)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
