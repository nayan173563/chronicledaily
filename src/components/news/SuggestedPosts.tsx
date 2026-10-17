import React, { useState, useEffect, useMemo } from 'react';
import { Post } from '../../types';
import { Sparkles, TrendingUp, Compass, Flame, Eye, Clock, ArrowRight, Bookmark } from 'lucide-react';

interface SuggestedPostsProps {
  currentPost: Post;
  allPosts: Post[];
  onSelectPost: (post: Post) => void;
}

type TabType = 'for_you' | 'trending' | 'category';

export const SuggestedPosts: React.FC<SuggestedPostsProps> = ({
  currentPost,
  allPosts,
  onSelectPost,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('for_you');

  // Record user category interest in localStorage on viewing
  useEffect(() => {
    if (!currentPost?.category_id) return;
    try {
      const raw = localStorage.getItem('chronicle_user_interests');
      const interests: Record<string, number> = raw ? JSON.parse(raw) : {};
      interests[currentPost.category_id] = (interests[currentPost.category_id] || 0) + 1;
      localStorage.setItem('chronicle_user_interests', JSON.stringify(interests));
    } catch {}
  }, [currentPost.id, currentPost.category_id]);

  // Read saved user interest profile
  const userInterests = useMemo<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('chronicle_user_interests');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [currentPost.id]);

  // Other published posts excluding the current one
  const candidatePosts = useMemo(() => {
    return allPosts.filter((p) => p.id !== currentPost.id && p.status === 'published');
  }, [allPosts, currentPost.id]);

  // 1. Personalized "For You" (Traffic interests and demand scoring algorithm)
  const forYouPosts = useMemo(() => {
    return [...candidatePosts]
      .map((p) => {
        let score = 0;
        // User interest category weight
        const interestCount = userInterests[p.category_id] || 0;
        score += interestCount * 25;

        // Current article category relevance
        if (p.category_id === currentPost.category_id) {
          score += 40;
        }

        // View popularity score (normalized)
        score += Math.min(30, (p.views || 0) / 100);

        // Recency score (posts created recently get higher score)
        const ageHours = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 20 - ageHours / 12);

        return { post: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.post)
      .slice(0, 6);
  }, [candidatePosts, currentPost.category_id, userInterests]);

  // 2. Trending / Most Demanded Posts (Highest views and reader engagement)
  const trendingPosts = useMemo(() => {
    return [...candidatePosts]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 6);
  }, [candidatePosts]);

  // 3. Category Specific (More stories in same editorial category)
  const sameCategoryPosts = useMemo(() => {
    const list = candidatePosts.filter((p) => p.category_id === currentPost.category_id);
    return (list.length > 0 ? list : candidatePosts).slice(0, 6);
  }, [candidatePosts, currentPost.category_id]);

  // Active display list based on selected tab
  const displayedPosts = useMemo(() => {
    switch (activeTab) {
      case 'trending':
        return trendingPosts;
      case 'category':
        return sameCategoryPosts;
      case 'for_you':
      default:
        return forYouPosts.length > 0 ? forYouPosts : candidatePosts.slice(0, 6);
    }
  }, [activeTab, forYouPosts, trendingPosts, sameCategoryPosts, candidatePosts]);

  if (candidatePosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t-2 border-neutral-900">
      {/* Header with Title and Personalized Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Personalized Recommendations
            </span>
          </div>
          <h3 className="font-serif font-black text-xl sm:text-2xl text-neutral-900 tracking-tight">
            Suggested For You
          </h3>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('for_you')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'for_you'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>For You</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trending'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Trending</span>
          </button>

          <button
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'category'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span className="truncate max-w-[120px]">
              {currentPost.category_name || 'Category'}
            </span>
          </button>
        </div>
      </div>

      {/* Suggested Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedPosts.map((p) => {
          const isCategoryMatch = p.category_id === currentPost.category_id;
          const formattedDate = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
          }).format(new Date(p.created_at));

          return (
            <div
              key={p.id}
              onClick={() => {
                onSelectPost(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group cursor-pointer flex flex-col bg-white border border-neutral-200/90 rounded-xl overflow-hidden hover:border-neutral-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-16/10 w-full bg-neutral-100 overflow-hidden shrink-0">
                {p.thumbnail_url ? (
                  <img
                    src={p.thumbnail_url}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-400 font-serif font-bold text-xl">
                    Chronicle
                  </div>
                )}

                {/* Category Badge overlay */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-neutral-900/90 text-white rounded backdrop-blur-xs shadow-xs">
                    {p.category_name || 'News'}
                  </span>
                </div>

                {isCategoryMatch && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="px-2 py-0.5 text-[9px] font-semibold bg-red-600/95 text-white rounded-full shadow-xs">
                      Related Topic
                    </span>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 group-hover:text-red-700 transition-colors leading-snug line-clamp-2 mb-2">
                    {p.title}
                  </h4>

                  {p.description && (
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-3 font-sans">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Footer Metadata: Views + Read Time + Date */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 text-neutral-400" />
                      {(p.views || 0).toLocaleString()}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {p.read_time || 3} min
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
