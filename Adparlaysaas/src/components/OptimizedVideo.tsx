import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface OptimizedVideoProps {
  src: string;
  type: 'youtube' | 'vimeo' | 'direct';
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  lazy?: boolean;
}

const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
  src,
  type,
  title = 'Video',
  autoplay = false,
  muted = true,
  controls = true,
  className = '',
  lazy = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !videoRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Load when 50px away from viewport
        threshold: 0.1
      }
    );

    observerRef.current.observe(videoRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy]);

  // Generate optimized YouTube embed URL
  const getYouTubeEmbedUrl = useCallback((url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoId) return url;

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0', // Don't show related videos
      modestbranding: '1', // Minimal YouTube branding
      playsinline: '1', // Play inline on mobile
      enablejsapi: '1', // Enable JavaScript API for better control
      origin: window.location.origin
    });

    return `https://www.youtube.com/embed/${videoId[1]}?${params.toString()}`;
  }, [autoplay, muted, controls]);

  // Generate optimized Vimeo embed URL
  const getVimeoEmbedUrl = useCallback((url: string) => {
    const videoId = url.match(/(?:vimeo\.com\/)([0-9]+)/);
    if (!videoId) return url;

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      muted: muted ? '1' : '0',
      controls: controls ? '1' : '0',
      title: '0',
      byline: '0',
      portrait: '0',
      transparent: '0',
      responsive: '1'
    });

    return `https://player.vimeo.com/video/${videoId[1]}?${params.toString()}`;
  }, [autoplay, muted, controls]);

  // Handle video load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  // Handle video error
  const handleError = useCallback(() => {
    setHasError(true);
    console.error('Video failed to load:', src);
  }, [src]);

  // Render placeholder while loading
  if (!isInView) {
    return (
      <div
        ref={videoRef}
        className={`relative bg-gray-200 rounded-lg overflow-hidden ${className}`}
        style={{ aspectRatio: '16/9' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <div className={`relative bg-gray-200 rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-sm">Failed to load video</p>
          </div>
        </div>
      </div>
    );
  }

  // Render the actual video
  const renderVideo = () => {
    switch (type) {
      case 'youtube':
        return (
          <iframe
            src={getYouTubeEmbedUrl(src)}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        );
      
      case 'vimeo':
        return (
          <iframe
            src={getVimeoEmbedUrl(src)}
            title={title}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-full"
          />
        );
      
      case 'direct':
        return (
          <video
            src={src}
            title={title}
            controls={controls}
            autoPlay={autoplay}
            muted={muted}
            playsInline
            onLoadedData={handleLoad}
            onError={handleError}
            className="w-full h-full object-cover"
            preload={lazy ? 'metadata' : 'auto'}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={videoRef}
      className={`relative bg-gray-200 rounded-lg overflow-hidden ${className}`}
      style={{ aspectRatio: '16/9' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0.7 }}
      transition={{ duration: 0.3 }}
    >
      {renderVideo()}
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="text-gray-500 text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OptimizedVideo;
