import React from 'react';
import { Post, Category } from '../../types';
import { NewsCard } from './NewsCard';
import { AdSlot } from '../ads/AdSlot';
import { ChevronRight } from 'lucide-react';

interface CategoryFeedProps {
  categories: Category[];
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory: (slug: string) => void;
}

export const CategoryFeed: React.FC<CategoryFeedProps> = ({
  categories,
  posts,
  onSelectPost,
  onSelectCategory,
}) => {
  return (
    <div className="space-y-16">
      {/* 1. Between Content Banner Ad (468×60) */}
      <div className="w-full flex justify-center py-2 border-y border-neutral-200 bg-neutral-50/50">
        <AdSlot position="between_content_468x60" minHeight={60} />
      </div>

      {/* 2. Loop Through Featured Desks */}
      {categories.map((cat, idx) => {
        const catPosts = posts.filter((p) => p.category_id === cat.id);
        if (catPosts.length === 0) return null;

        const mainPost = catPosts[0];
        const subPosts = catPosts.slice(1, 4);

        return (
          <section key={cat.id} className="border-t-2 border-neutral-900 pt-4">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-baseline gap-3">
                <h3 className="font-serif font-black text-xl lg:text-2xl uppercase tracking-tight text-neutral-950">
                  {cat.name}
                </h3>
                {cat.description && (
                  <span className="hidden md:inline text-xs text-neutral-500 font-serif italic">
                    — {cat.description}
                  </span>
                )}
              </div>

              <button
                onClick={() => onSelectCategory(cat.slug)}
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-red-700 hover:text-red-900 transition-colors cursor-pointer"
              >
                <span>View Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid Layout for Desk */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main feature */}
              <div className="lg:col-span-6">
                <NewsCard
                  post={mainPost}
                  layout="standard"
                  onClick={onSelectPost}
                />
              </div>

              {/* Sub features list */}
              <div className="lg:col-span-6 space-y-2 divide-y divide-neutral-100">
                {subPosts.map((post) => (
                  <NewsCard
                    key={post.id}
                    post={post}
                    layout="horizontal"
                    onClick={onSelectPost}
                  />
                ))}
              </div>
            </div>

            {/* Native Banner Ad inserted naturally inside feed after 2nd category */}
            {idx === 1 && (
              <div className="mt-10 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">
                  Sponsored Network Feed
                </div>
                <AdSlot position="native_feed" />
              </div>
            )}
          </section>
        );
      })}

      {/* 3. Mobile Bottom Sticky Banner Ad (320×50) */}
      <div className="md:hidden flex justify-center py-2">
        <AdSlot position="mobile_bottom_320x50" minHeight={50} />
      </div>
    </div>
  );
};
