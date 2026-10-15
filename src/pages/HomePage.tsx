import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { api } from '../services/api';
import { useWebsite } from '../context/WebsiteContext';
import { BreakingTicker } from '../components/news/BreakingTicker';
import { HeroSection } from '../components/news/HeroSection';
import { CategoryFeed } from '../components/news/CategoryFeed';
import { SocialBarAd } from '../components/ads/SocialBarAd';
import { SEOHead } from '../components/seo/SEOHead';

interface HomePageProps {
  onSelectPost: (post: Post) => void;
  onSelectCategory: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectPost, onSelectCategory }) => {
  const { categories } = useWebsite();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await api.getPosts({ status: 'published' });
        setPosts(data);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const leadPost = posts[0];
  const secondaryPosts = posts.slice(1, 3);
  const trendingPosts = posts.slice(3, 8);

  return (
    <div className="w-full">
      <SEOHead />

      {/* Floating Bottom Social Bar Ad */}
      <SocialBarAd />

      {/* Breaking News Ticker */}
      <BreakingTicker posts={posts.slice(0, 6)} onSelectPost={onSelectPost} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-400 animate-pulse">
            Loading editorial dispatches...
          </div>
        ) : (
          <>
            {/* Master Hero Section (3-tier salience + Sidebar Ad) */}
            <HeroSection
              leadPost={leadPost}
              secondaryPosts={secondaryPosts}
              trendingPosts={trendingPosts}
              onSelectPost={onSelectPost}
            />

            {/* In-depth Category Feeds & Native Ad integration */}
            <CategoryFeed
              categories={categories}
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
            />
          </>
        )}
      </main>
    </div>
  );
};
