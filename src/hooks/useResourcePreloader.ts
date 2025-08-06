import { useEffect } from 'react';

interface UseResourcePreloaderProps {
  images?: string[];
  fonts?: string[];
  stylesheets?: string[];
}

export const useResourcePreloader = ({ 
  images = [], 
  fonts = [], 
  stylesheets = [] 
}: UseResourcePreloaderProps) => {
  
  useEffect(() => {
    // Preload critical images
    images.forEach((src, index) => {
      if (index < 2) { // Only preload first 2 images as critical
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = src;
        link.as = 'image';
        if (index === 0) link.fetchPriority = 'high';
        document.head.appendChild(link);
      }
    });

    // Preload fonts
    fonts.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Preload critical stylesheets
    stylesheets.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'style';
      document.head.appendChild(link);
    });

    // Cleanup function
    return () => {
      // Note: We don't remove preload links as they should persist
      // for the lifetime of the page
    };
  }, [images, fonts, stylesheets]);

  const preloadResource = (href: string, as: string, type?: string) => {
    // Check if already preloaded
    const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  };

  return { preloadResource };
};