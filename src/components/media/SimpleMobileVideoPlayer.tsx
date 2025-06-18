
import React, { useState, memo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SimpleMobileVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  className?: string;
  autoGenThumbnail?: boolean;
}

const VideoThumbnail = memo(({ 
  videoUrl, 
  thumbnailUrl, 
  onClick,
  className = "w-full aspect-video",
  autoGenThumbnail = true
}: {
  videoUrl: string;
  thumbnailUrl?: string;
  onClick: () => void;
  className?: string;
  autoGenThumbnail?: boolean;
}) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // Generate Cloudinary thumbnail URL if not provided
  const generatedThumbnail = autoGenThumbnail && !thumbnailUrl && videoUrl.includes('cloudinary.com')
    ? videoUrl.replace('/video/upload/', '/video/upload/f_jpg,w_300,h_200,c_fill,q_auto:good/') + '.jpg'
    : thumbnailUrl;
  
  return (
    <div 
      className={`${className} relative rounded border overflow-hidden bg-black cursor-pointer group`}
      onClick={onClick}
    >
      {generatedThumbnail && !thumbnailError ? (
        <img
          src={generatedThumbnail}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          onError={() => setThumbnailError(true)}
          loading="lazy"
        />
      ) : (
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          preload="metadata"
          muted
        />
      )}
      
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="bg-white/90 group-hover:bg-white rounded-full p-3 shadow-lg transition-colors">
          <Play className="w-6 h-6 text-black" fill="currentColor" />
        </div>
      </div>
    </div>
  );
});

export const SimpleMobileVideoPlayer: React.FC<SimpleMobileVideoPlayerProps> = memo(({
  videoUrl,
  thumbnailUrl,
  className,
  autoGenThumbnail = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <>
      <VideoThumbnail
        videoUrl={videoUrl}
        thumbnailUrl={thumbnailUrl}
        onClick={() => setIsModalOpen(true)}
        className={className}
        autoGenThumbnail={autoGenThumbnail}
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl max-h-[80vh]'} p-2`}>
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh] rounded"
              playsInline
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

VideoThumbnail.displayName = 'VideoThumbnail';
SimpleMobileVideoPlayer.displayName = 'SimpleMobileVideoPlayer';
