import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AnalyticsSummary } from '../../types';
import { BarChart3, TrendingUp, Eye, Globe, Database, ArrowUpRight } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<(AnalyticsSummary & { database_status?: { connected: boolean; message: string } }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-neutral-400 animate-pulse">
        Calculating traffic analytics &amp; page impressions...
      </div>
    );
  }

  // Find max daily view for relative bar height
  const maxDaily = Math.max(...data.daily_views.map((d) => d.views), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Traffic Analytics &amp; Readership Intelligence
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Detailed metrics across reader sessions, article engagement, desk performance, and database health
        </p>
      </div>

      {/* 14-Day View History Chart */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-500" />
            <h3 className="font-serif font-bold text-base text-white">
              Daily Readership Volume (Past 14 Days)
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Total Aggregate: <strong className="text-white">{data.total_views.toLocaleString()}</strong> views
          </span>
        </div>

        {/* Visual Bar Graph */}
        <div className="h-48 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-neutral-800">
          {data.daily_views.map((item, idx) => {
            const heightPercent = Math.max(12, Math.round((item.views / maxDaily) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  {item.views.toLocaleString()}
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 rounded-t transition-all cursor-pointer shadow-xs"
                />
              </div>
            );
          })}
        </div>

        {/* Date labels */}
        <div className="flex justify-between pt-3 text-[10px] font-mono text-neutral-500 px-2">
          <span>{data.daily_views[0]?.date}</span>
          <span>{data.daily_views[Math.floor(data.daily_views.length / 2)]?.date}</span>
          <span>{data.daily_views[data.daily_views.length - 1]?.date}</span>
        </div>
      </div>

      {/* 2-column breakdown: Category Views & Top Performing Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Category Views */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-md">
          <h3 className="font-serif font-bold text-base text-white border-b border-neutral-800 pb-3 mb-4">
            Readership by Editorial Desk
          </h3>

          <div className="space-y-3">
            {data.views_by_category.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">{cat.category}</span>
                <span className="font-mono text-neutral-400">{cat.views.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Articles */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-md">
          <h3 className="font-serif font-bold text-base text-white border-b border-neutral-800 pb-3 mb-4">
            Most Viewed Dispatches
          </h3>

          <div className="divide-y divide-neutral-900">
            {data.top_posts.map((post, idx) => (
              <div key={post.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 uppercase font-semibold">
                    <span className="text-red-400">#{idx + 1}</span>
                    <span>·</span>
                    <span>{post.category_name}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-neutral-200 truncate">
                    {post.title}
                  </h4>
                </div>
                <div className="text-xs font-mono text-neutral-300 shrink-0">
                  {post.views.toLocaleString()} views
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database Connection Status & Cloud Sync */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <h3 className="font-serif font-bold text-base text-white">
              Database &amp; Cloud Sync Configuration
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-neutral-800 text-neutral-300">
            {data.database_status?.connected ? 'Supabase Active' : 'Persistent Storage Active'}
          </span>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
          The website operates out-of-the-box with atomic persistent local database storage (<code className="text-neutral-300">data/news_db.json</code>).
          To connect directly to a remote Supabase PostgreSQL database, simply provide your <code className="text-amber-400">SUPABASE_URL</code> and <code className="text-amber-400">SUPABASE_ANON_KEY</code> in <code className="text-neutral-300">.env</code>, and execute the supplied <code className="text-neutral-300">supabase_schema.sql</code> script.
        </p>

        <div className="p-3 bg-neutral-900 rounded border border-neutral-800 font-mono text-[11px] text-neutral-300">
          Status: {data.database_status?.message}
        </div>
      </div>
    </div>
  );
};
