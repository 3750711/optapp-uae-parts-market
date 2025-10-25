
import React, { useState, useCallback } from 'react';
import { ResponsivePicture } from './ResponsivePicture';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'card' | 'detail' | 'telegramCard' | 'preview' | 'gallery' | 'fullscreen';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * CloudinaryImage Component
 * 
 * Wrapper around ResponsivePicture that handles Cloudinary-specific logic
 * Uses modern formats (AVIF, WebP) with JPEG fallback
 */
const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  publicId,
  alt,
  className = '',
  size = 'card',
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/placeholder.svg'
}) => {
  const cloudName = 'dcuziurrb';
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  
  // Map size to responsive preset
  const presetMap: Record<string, 'thumbnail' | 'card' | 'gallery' | 'fullscreen'> = {
    thumbnail: 'thumbnail',
    card: 'card',
    detail: 'gallery',
    telegramCard: 'card',
    preview: 'card',
    gallery: 'gallery',
    fullscreen: 'fullscreen',
  };

  const preset = presetMap[size] || 'card';
  const imageUrl = `${baseUrl}/${publicId}`;

  return (
    <ResponsivePicture
      src={imageUrl}
      alt={alt}
      className={className}
      preset={preset}
      priority={priority}
      onLoad={onLoad}
      onError={onError}
      fallbackSrc={fallbackSrc}
    />
  );
};

export default CloudinaryImage;
