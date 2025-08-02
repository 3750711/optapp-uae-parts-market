import React, { useEffect, useState } from 'react';
import { generateAutomotiveImage } from '@/utils/automotiveImageGenerator';

interface AutomotiveBackgroundProps {
  type?: 'hero' | 'abstract';
  className?: string;
  children?: React.ReactNode;
}

export const AutomotiveBackground: React.FC<AutomotiveBackgroundProps> = ({
  type = 'abstract',
  className = '',
  children
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAutomotiveBackground = async () => {
      try {
        setIsLoading(true);
        const result = await generateAutomotiveImage(type);
        setBackgroundImage(result.image);
      } catch (error) {
        console.error('Failed to generate automotive background:', error);
        // Fallback to gradient if image generation fails
      } finally {
        setIsLoading(false);
      }
    };

    loadAutomotiveBackground();
  }, [type]);

  const backgroundStyle = backgroundImage 
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <div 
      className={`relative ${className}`}
      style={backgroundStyle}
    >
      {/* Automotive-themed fallback background */}
      {!backgroundImage && !isLoading && (
        <div className="absolute inset-0 bg-gradient-automotive opacity-10" />
      )}
      
      {/* Loading shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}
      
      {/* Content overlay */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};