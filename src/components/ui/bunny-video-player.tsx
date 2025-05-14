
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BunnyVideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  pullZone?: string;
  autoplay?: boolean;
  controls?: boolean;
  posterUrl?: string;
}

export const BunnyVideoPlayer: React.FC<BunnyVideoPlayerProps> = ({
  videoId,
  title,
  className,
  pullZone = "video-example",
  autoplay = false,
  controls = true,
  posterUrl
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInitialized = useRef(false);

  useEffect(() => {
    // Проверяем, загружена ли библиотека Bunny Player
    if (typeof window !== 'undefined' && !window.BunnyPlayer) {
      const script = document.createElement('script');
      script.src = 'https://player.bunny.net/bunny-player.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
    
    return () => {};
  }, []);

  useEffect(() => {
    // Инициализация плеера, когда библиотека загружена и videoId доступен
    if (videoId && playerRef.current && typeof window !== 'undefined' && window.BunnyPlayer && !playerInitialized.current) {
      // Проверка, что элемент не содержит уже плеер
      if (playerRef.current.children.length === 0) {
        const playerOptions = {
          videoId: videoId,
          playbackSpeed: true,
          autoplay: autoplay,
          chromecast: true,
          muted: false,
          loop: false,
          preload: "metadata",
          thumbnail: posterUrl,
        };
        
        // Создаем плеер
        // @ts-ignore - BunnyPlayer API не типизирован
        new window.BunnyPlayer(playerRef.current, playerOptions);
        playerInitialized.current = true;
      }
    }
    
    return () => {
      playerInitialized.current = false;
    };
  }, [videoId, playerRef, autoplay, posterUrl]);

  return (
    <div 
      ref={playerRef} 
      className={cn("aspect-video rounded-lg overflow-hidden", className)}
      data-bunny-video-id={videoId}
      data-bunny-cdn-domain={`${pullZone}.b-cdn.net`}
      title={title}
    >
      {/* Плеер будет вставлен сюда */}
    </div>
  );
};

// Добавляем типы для глобального объекта window
declare global {
  interface Window {
    BunnyPlayer: any;
  }
}
