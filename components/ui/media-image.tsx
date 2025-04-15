'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MediaImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
}

export function MediaImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '100vw',
  onError
}: MediaImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    // Update image source if prop changes
    setImageSrc(src);
    setError(false);
    setLoading(true);
  }, [src]);

  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    setError(true);
    setLoading(false);
    
    // Call the onError callback if provided
    if (onError) {
      onError();
    }
  };

  const handleLoad = () => {
    setLoading(false);
  };

  // Fallback image when loading fails
  const fallbackImage = (
    <div 
      className={`bg-muted flex items-center justify-center ${width ? `w-[${width}px]` : 'w-full'} ${height ? `h-[${height}px]` : 'aspect-square'} ${className}`}
      style={width && height ? { width: `${width}px`, height: `${height}px` } : {}}
    >
      <span className="text-muted-foreground text-sm">Image not available</span>
    </div>
  );

  // If there was an error, show fallback
  if (error) {
    return fallbackImage;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        width={width || 1200}
        height={height || 800}
        quality={85}
        priority={priority}
        sizes={sizes}
        className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
} 