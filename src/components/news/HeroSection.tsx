import React from 'react';
import { Post } from '../../types';
import { NewsCard } from './NewsCard';
import { AdSlot } from '../ads/AdSlot';
import { TrendingUp } from 'lucide-react';

interface HeroSectionProps {
  leadPost?: Post;
  secondaryPosts: Post[];
  trendingPosts: Post[];
  onSelectPost: (post: Post) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  leadPost,
  secondaryPosts,
  trendingPosts,
  onSelectPost,
}) => {
  if (!leadPost && secondaryPosts.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Tier 1: Lead Editorial Anchor (Left 7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {leadPost && (
            <NewsCard
              post={leadPost}
              layout="featured"
              onClick={onSelectPost}
            />
          )}

          {/* Secondary 2-column sub-leads */}
          {secondaryPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-neutral-200">
              {secondaryPosts.slice(0, 2).map((post) => (
                <NewsCard
                  key={post.id}
                  post={post}
                  layout="standard"
                  onClick={onSelectPost}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tier 3: Right Sidebar with Trending Column and Sidebar Ad (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-neutral-200 lg:pl-8">
          {/* Trending Header */}
          <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <h3 className="font-serif font-bold text-base uppercase tracking-wider text-neutral-900">
                Trending Dispatches
              </h3>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-neutral-400">Live Wire</span>
          </div>

          {/* Trending Posts List */}
          <div className="divide-y divide-neutral-100">
            {trendingPosts.map((post, idx) => (
              <div key={post.id} className="py-3 flex items-start gap-4 group cursor-pointer" onClick={() => onSelectPost(post)}>
                <span className="font-serif text-2xl font-bold text-neutral-300 group-hover:text-red-700 transition-colors w-6 shrink-0">
                  0{idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-neutral-500 mb-1">
                    <span className="text-red-700">{post.category_name}</span>
                    <span>·</span>
                    <span>{post.views.toLocaleString()} readers</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-neutral-900 group-hover:text-red-700 transition-colors leading-snug">
                    {post.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Advertisement Placement (300×250) */}
          <div className="pt-4 border-t border-neutral-200">
            <AdSlot position="sidebar_300x250" minHeight={250} />
          </div>
        </div>
      </div>
    </section>
  );
};
