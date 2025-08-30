import React, { useEffect, useRef, useState } from 'react';

interface ImageZoomDebuggerProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoomDebugger: React.FC<ImageZoomDebuggerProps> = ({ src, alt, className }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [debugInfo, setDebugInfo] = useState<{
    naturalWidth: number;
    naturalHeight: number;
    displayWidth: number;
    displayHeight: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const updateDebugInfo = () => {
      const rect = img.getBoundingClientRect();
      const scaleX = rect.width / img.naturalWidth;
      const scaleY = rect.height / img.naturalHeight;
      
      setDebugInfo({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: rect.width,
        displayHeight: rect.height,
        scaleX: Math.round(scaleX * 1000) / 1000,
        scaleY: Math.round(scaleY * 1000) / 1000,
      });
    };

    img.addEventListener('load', updateDebugInfo);
    window.addEventListener('resize', updateDebugInfo);
    
    // Update immediately if image is already loaded
    if (img.complete) {
      updateDebugInfo();
    }

    return () => {
      img.removeEventListener('load', updateDebugInfo);
      window.removeEventListener('resize', updateDebugInfo);
    };
  }, [src]);

  return (
    <div className="relative">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
      />
      
      {debugInfo && (
        <div className="absolute top-2 left-2 bg-black/75 text-white text-xs p-2 rounded font-mono">
          <div>Natural: {debugInfo.naturalWidth}×{debugInfo.naturalHeight}</div>
          <div>Display: {Math.round(debugInfo.displayWidth)}×{Math.round(debugInfo.displayHeight)}</div>
          <div>Scale: {debugInfo.scaleX}×{debugInfo.scaleY}</div>
          {(debugInfo.scaleX > 1.1 || debugInfo.scaleY > 1.1) && (
            <div className="text-red-300">⚠️ ZOOM DETECTED</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageZoomDebugger;