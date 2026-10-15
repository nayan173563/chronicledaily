import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AnalyticsSummary, Post } from '../../types';
import { 
  FileText, 
  CheckCircle, 
  FileEdit, 
  Eye, 
  Megaphone, 
  TrendingUp, 
  Plus, 
  ArrowUpRight,
  Database
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: any) => void;
  onEditPost: (post: Post) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab, onEditPost }) => {
  // Read instant cached analytics data to render with zero delay
  const getInitialData = () => {
    try {
      const saved = sessionStorage.getItem('cached_admin_analytics');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const [data, setData] = useState<(AnalyticsSummary & { database_status?: { connected: boolean; message: string } }) | null>(getInitialData);
  const [loading, setLoading] = useState<boolean>(() => !getInitialData());

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        const res = await api.getAnalytics();
        if (isMounted) {
          setData(res);
          sessionStorage.setItem('cached_admin_analytics', JSON.stringify(res));
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => { isMounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-neutral-400 text-sm animate-pulse">
        Loading analytics &amp; editorial state...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Editorial Intelligence &amp; Overview
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time metric telemetry, post performance, and advertisement delivery
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('create_content')}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Content</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Posts */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider">Total Dispatches</span>
            <FileText className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-white tabular-nums">
            {data.total_posts}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Universal content library
          </div>
        </div>

        {/* Published Posts */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider">Live Published</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-400 tabular-nums">
            {data.published_posts}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Accessible on public portal
          </div>
        </div>

        {/* Draft Posts */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider">In Draft</span>
            <FileEdit className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-amber-400 tabular-nums">
            {data.draft_posts}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Awaiting editorial review
          </div>
        </div>

        {/* Total Views */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider">Total Impressions</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-sky-400 tabular-nums">
            {data.total_views.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Aggregated article reads
          </div>
        </div>
      </div>

      {/* Middle Grid: Recent Posts & Ad Network Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recent Posts List (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
            <h3 className="font-serif font-bold text-base text-white">
              Recent Dispatches
            </h3>
            <button
              onClick={() => onNavigateTab('all_posts')}
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-900">
            {data.recent_posts.map((post) => (
              <div key={post.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                    <span className="text-red-500">{post.category_name}</span>
                    <span>·</span>
                    <span className={post.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}>
                      {post.status}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-neutral-500">/p/{post.short_id}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-neutral-200 truncate">
                    {post.title}
                  </h4>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {post.views.toLocaleString()} views · By {post.author}
                  </div>
                </div>

                <button
                  onClick={() => onEditPost(post)}
                  className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors shrink-0"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Advertisement Status & Database Health (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ad Status Widget */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif font-bold text-base text-white">
                  Advertisement Status
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('ad_manager')}
                className="text-xs text-amber-500 hover:text-amber-400 font-semibold"
              >
                Configure
              </button>
            </div>

            <div className="space-y-2.5">
              {data.ad_status.map((ad, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900/60 border border-neutral-800/80 text-xs"
                >
                  <span className="text-neutral-300 truncate font-medium">{ad.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ad.is_active
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {ad.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Database & Sync Status */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Cloud Infrastructure</span>
              </div>
              <button
                onClick={() => onNavigateTab('cloud_services')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {data.database_status?.message || 'Runtime dynamic storage engine active.'}
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
              <span>Supabase &amp; Cloudinary</span>
              <span className="text-emerald-400 font-semibold">AES-256 Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
