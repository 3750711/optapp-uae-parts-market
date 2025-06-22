import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface OrderVideosProps {
  videoUrls: string[];
  disabled?: boolean;
}

const OrderVideos: React.FC<OrderVideosProps> = ({ videoUrls, disabled = false }) => {
  const { user } = useAuth();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    // Pause all videos when component unmounts or videoUrls change
    return () => {
      videoRefs.current.forEach((video) => {
        if (video) {
          video.pause();
        }
      });
    };
  }, [videoUrls]);

  const handlePlayPause = (index: number) => {
    if (playingIndex === index) {
      // Pause current video
      videoRefs.current[index]?.pause();
      setPlayingIndex(null);
    } else {
      // Pause any other playing video
      if (playingIndex !== null && videoRefs.current[playingIndex]) {
        videoRefs.current[playingIndex]?.pause();
      }
      // Play selected video
      videoRefs.current[index]?.play();
      setPlayingIndex(index);
    }
  };

  const handleVolumeToggle = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
      // Force re-render to update icon
      setPlayingIndex((prev) => prev);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Видео</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {videoUrls.length === 0 && <p>Видео отсутствуют</p>}
        {videoUrls.map((url, index) => (
          <div key={index} className="relative">
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={url}
              controls={false}
              muted
              className="w-full rounded-md bg-black"
              onEnded={() => setPlayingIndex(null)}
              onPause={() => {
                if (playingIndex === index) {
                  setPlayingIndex(null);
                }
              }}
              onPlay={() => setPlayingIndex(index)}
            />
            <div className="absolute bottom-2 left-2 flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePlayPause(index)}
                disabled={disabled}
                aria-label={playingIndex === index ? 'Pause video' : 'Play video'}
              >
                {playingIndex === index ? <Pause /> : <Play />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVolumeToggle(index)}
                disabled={disabled}
                aria-label="Toggle mute"
              >
                {videoRefs.current[index]?.muted ? <VolumeX /> : <Volume2 />}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OrderVideos;
