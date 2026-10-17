import React from 'react';
import { Post } from '../../types';
import { Play, Eye, Clock } from 'lucide-react';

interface NewsCardProps {
  post: Post;
  onClick: (post: Post) => void;
  layout?: 'standard' | 'horizontal' | 'compact' | 'featured';
  className?: string;
}

const FALLBACK_NEWS_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

export const NewsCard: React.FC<NewsCardProps> = ({
  post,
  onClick,
  layout = 'standard',
  className = '',
}) => {
  const hasVideo = post.media_type && post.media_type !== 'none' && post.media_type !== 'image';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(post.created_at));

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.src !== FALLBACK_NEWS_IMAGE) {
      target.src = FALLBACK_NEWS_IMAGE;
    }
  };

  // 1. Horizontal Layout (for lists and sidebar widgets)
  if (layout === 'horizontal') {
    return (
      <article
        onClick={() => onClick(post)}
        className={`group flex items-start gap-4 cursor-pointer py-3 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/70 p-2 rounded transition-colors ${className}`}
      >
        {post.thumbnail_url && (
          <div className="relative w-24 h-20 sm:w-28 sm:h-20 shrink-0 rounded overflow-hidden bg-neutral-200">
            <img
              src={post.thumbnail_url}
              alt={post.title}
              loading="lazy"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {hasVideo && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Zero-Pill Unboxed Metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-1">
            <span className="font-semibold text-red-700 uppercase tracking-wider">{post.category_name}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
          </div>

          <h4 className="font-serif font-bold text-sm text-neutral-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h4>
        </div>
      </article>
    );
  }

  // 2. Compact Layout (text-heavy list item)
  if (layout === 'compact') {
    return (
      <article
        onClick={() => onClick(post)}
        className={`group cursor-pointer py-3 border-b border-neutral-100 last:border-b-0 ${className}`}
      >
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-1">
          <span className="font-semibold text-neutral-800 uppercase tracking-wider">{post.category_name}</span>
          <span aria-hidden="true">·</span>
          <span>{formattedDate}</span>
          {post.read_time && (
            <>
              <span aria-hidden="true">·</span>
              <span>{post.read_time}</span>
            </>
          )}
        </div>

        <h4 className="font-serif font-bold text-base text-neutral-900 group-hover:text-red-700 transition-colors leading-snug">
          {post.title}
        </h4>
      </article>
    );
  }

  // 3. Featured / Lead Layout
  if (layout === 'featured') {
    return (
      <article
        onClick={() => onClick(post)}
        className={`group cursor-pointer flex flex-col ${className}`}
      >
        {post.thumbnail_url && (
          <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-neutral-100 mb-4 shadow-sm">
            <img
              src={post.thumbnail_url}
              alt={post.title}
              loading="lazy"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {hasVideo && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/95 text-neutral-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5 text-red-600" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zero-Pill Metadata */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
          <span className="font-bold text-red-700 uppercase tracking-wider">{post.category_name}</span>
          <span aria-hidden="true">·</span>
          <span>By {post.author}</span>
          <span aria-hidden="true">·</span>
          <span>{formattedDate}</span>
          {post.read_time && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time}</span>
            </>
          )}
        </div>

        <h2 className="font-serif font-bold text-2xl lg:text-3xl text-neutral-950 group-hover:text-red-700 transition-colors leading-tight mb-3">
          {post.title}
        </h2>

        {post.description && (
          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">
            {post.description}
          </p>
        )}
      </article>
    );
  }

  // Standard Grid Card
  return (
    <article
      onClick={() => onClick(post)}
      className={`group cursor-pointer flex flex-col h-full bg-white rounded-lg overflow-hidden border border-neutral-200/80 hover:border-neutral-300 hover:shadow-md transition-all ${className}`}
    >
      {post.thumbnail_url && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
          <img
            src={post.thumbnail_url}
            alt={post.title}
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hasVideo && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 rounded text-white text-[10px] font-semibold flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span className="uppercase">{post.content_type}</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Zero-Pill Unboxed Metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-2">
            <span className="font-bold text-red-700 uppercase tracking-wider">{post.category_name}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
          </div>

          <h3 className="font-serif font-bold text-base text-neutral-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug mb-2">
            {post.title}
          </h3>

          {post.description && (
            <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
          <span>By {post.author}</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {post.views.toLocaleString()}
          </span>
        </div>
      </div>
    </article>
  );
};
