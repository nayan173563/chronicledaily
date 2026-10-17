import React from 'react';
import { Post } from '../../types';
import { detectMediaSource } from '../../services/mediaDetector';

interface MediaViewerProps {
  post: Post;
  className?: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ post, className = '' }) => {
  const { media_source, media_type, thumbnail_url, title } = post;

  if (!media_source && !thumbnail_url) {
    return null;
  }

  const detection = media_source ? detectMediaSource(media_source) : null;
  const effectiveType = media_type !== 'none' ? media_type : detection?.type || 'none';

  // 1. YouTube
  if (effectiveType === 'youtube' && detection?.embedUrl) {
    return (
      <div className={`relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 shadow-md ${className}`}>
        <iframe
          src={detection.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // 2. Vimeo
  if (effectiveType === 'vimeo' && detection?.embedUrl) {
    return (
      <div className={`relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 shadow-md ${className}`}>
        <iframe
          src={detection.embedUrl}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // 3. TikTok
  if (effectiveType === 'tiktok' && detection?.embedUrl) {
    return (
      <div className={`relative aspect-[9/16] max-w-sm mx-auto w-full rounded-lg overflow-hidden bg-neutral-900 shadow-md ${className}`}>
        <iframe
          src={detection.embedUrl}
          title={title}
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // 4. Instagram
  if (effectiveType === 'instagram' && detection?.embedUrl) {
    return (
      <div className={`relative aspect-square max-w-md mx-auto w-full rounded-lg overflow-hidden bg-neutral-900 shadow-md ${className}`}>
        <iframe
          src={detection.embedUrl}
          title={title}
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // 5. Facebook Video
  if (effectiveType === 'facebook' && detection?.embedUrl) {
    return (
      <div className={`relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 shadow-md ${className}`}>
        <iframe
          src={detection.embedUrl}
          title={title}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // 6. Direct Video URL
  if (effectiveType === 'video_url' && detection?.embedUrl) {
    return (
      <div className={`relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-950 shadow-md ${className}`}>
        <video
          src={detection.embedUrl}
          controls
          poster={thumbnail_url}
          className="w-full h-full object-contain"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // 7. Generic Embed / Raw iframe code
  if (effectiveType === 'embed_code' && media_source) {
    return (
      <div
        className={`w-full overflow-hidden rounded-lg bg-neutral-900 my-4 ${className}`}
        dangerouslySetInnerHTML={{ __html: media_source }}
      />
    );
  }

  // Default: Standard High-Res Image Thumbnail
  if (thumbnail_url) {
    return (
      <div className={`relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-neutral-100 shadow-sm ${className}`}>
        <img
          src={thumbnail_url}
          alt={title}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('unsplash.com')) {
              target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
            }
          }}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
    );
  }

  return null;
};
