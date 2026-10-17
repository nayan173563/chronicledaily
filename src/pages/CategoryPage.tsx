import React, { useEffect, useState } from 'react';
import { Post, Category } from '../types';
import { api } from '../services/api';
import { useWebsite } from '../context/WebsiteContext';
import { NewsCard } from '../components/news/NewsCard';
import { AdSlot } from '../components/ads/AdSlot';
import { SEOHead } from '../components/seo/SEOHead';
import { ChevronLeft } from 'lucide-react';

interface CategoryPageProps {
  categorySlug: string;
  onSelectPost: (post: Post) => void;
  onNavigateHome: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categorySlug,
  onSelectPost,
  onNavigateHome,
}) => {
  const { categories } = useWebsite();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const category = categories.find((c) => c.slug === categorySlug) || {
    id: '',
    name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
    slug: categorySlug,
    description: 'Archive of dispatches and reports',
    color: '#0f172a',
  };

  useEffect(() => {
    const loadCategoryPosts = async () => {
      setLoading(true);
      try {
        const cat = categories.find((c) => c.slug === categorySlug);
        const data = await api.getPosts({
          category_id: cat ? cat.id : undefined,
          status: 'published',
        });
        setPosts(data);
      } catch (err) {
        console.error('Failed to load category posts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategoryPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead
        title={`${category.name} News & Dispatches`}
        description={category.description}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <button
          onClick={onNavigateHome}
          className="hover:text-neutral-900 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Front Page</span>
        </button>
        <span>/</span>
        <span className="font-semibold text-neutral-900 uppercase tracking-wider">{category.name}</span>
      </div>

      {/* Category Header */}
      <div className="border-b-2 border-neutral-900 pb-4 mb-8">
        <h1 className="font-serif font-black text-3xl sm:text-4xl uppercase tracking-tight text-neutral-950">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 text-sm text-neutral-600 font-serif italic max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          {loading ? (
            <div className="py-20 text-center text-sm text-neutral-400 animate-pulse">
              Loading category dispatches...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="font-serif text-lg">No published dispatches under {category.name} yet.</p>
              <button
                onClick={onNavigateHome}
                className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded text-xs font-semibold"
              >
                Return to Front Page
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {posts.map((post) => (
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

        {/* Category Sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:border-l lg:border-neutral-200 lg:pl-8">
          <AdSlot position="sidebar_300x250" minHeight={250} />
          <AdSlot position="sidebar_160x300" minHeight={300} />
        </aside>
      </div>
    </div>
  );
};
