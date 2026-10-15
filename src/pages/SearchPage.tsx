import React, { useState, useEffect } from 'react';
import { Post, Category } from '../types';
import { api } from '../services/api';
import { useWebsite } from '../context/WebsiteContext';
import { NewsCard } from '../components/news/NewsCard';
import { SEOHead } from '../components/seo/SEOHead';
import { Search, X, Filter } from 'lucide-react';

interface SearchPageProps {
  onSelectPost: (post: Post) => void;
  onNavigateHome: () => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onSelectPost, onNavigateHome }) => {
  const { categories } = useWebsite();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleSearch = async () => {
      setLoading(true);
      try {
        const posts = await api.getPosts({
          search: query.trim() || undefined,
          category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
          content_type: selectedType !== 'all' ? selectedType : undefined,
          status: 'published',
        });
        setResults(posts);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query, selectedCategory, selectedType]);

  const contentTypes = [
    { id: 'all', label: 'All Content' },
    { id: 'news', label: 'News' },
    { id: 'movies', label: 'Movies' },
    { id: 'drama', label: 'Drama' },
    { id: 'funny', label: 'Funny Clips' },
    { id: 'article', label: 'In-Depth' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead title="Search Dispatches & Archives" />

      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 mb-8">
        <h1 className="font-serif font-black text-3xl sm:text-4xl text-neutral-950 uppercase tracking-tight mb-4">
          Archive Search &amp; Dispatches
        </h1>

        {/* Live Search Input */}
        <div className="relative max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search by keywords, events, countries, topics, or names..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm md:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Interactive Filter Tabs (Segmented controls) */}
        <div className="mt-6 space-y-3">
          {/* Content Types */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-neutral-400 text-[11px] uppercase tracking-wider mr-1">Type:</span>
            {contentTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-neutral-400 text-[11px] uppercase tracking-wider mr-1">Desk:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-red-700 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Desks
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-red-700 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-neutral-500 mb-6">
        <span>
          Found <strong className="text-neutral-900 font-mono">{results.length}</strong> matching dispatches
        </span>
        {query && <span>Showing matches for &ldquo;{query}&rdquo;</span>}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-neutral-400 animate-pulse">
          Searching dispatches...
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="font-serif text-lg">No dispatches match your search query.</p>
          <p className="text-xs text-neutral-400 mt-1">Try broadening your search terms or clearing the desk filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((post) => (
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
  );
};
