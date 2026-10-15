import React, { useState, useEffect } from 'react';
import { Post } from '../../types';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

interface BreakingTickerProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ posts, onSelectPost }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [posts.length]);

  if (!posts || posts.length === 0) return null;

  const current = posts[currentIndex] || posts[0];

  return (
    <div className="border-y border-neutral-200 bg-neutral-900 text-white text-xs py-2 px-4 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 animate-pulse">
            <Flame className="w-3.5 h-3.5" />
            <span>Breaking</span>
          </div>

          <button
            onClick={() => onSelectPost(current)}
            className="text-left font-medium text-neutral-200 hover:text-white transition-colors truncate hover:underline cursor-pointer"
          >
            {current.title}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-neutral-400">
          <span className="font-mono text-[11px] hidden sm:inline">
            {currentIndex + 1} / {posts.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length)}
            aria-label="Previous headline"
            className="p-1 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % posts.length)}
            aria-label="Next headline"
            className="p-1 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
