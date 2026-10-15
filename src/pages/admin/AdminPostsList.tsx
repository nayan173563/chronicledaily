import React, { useState, useEffect } from 'react';
import { Post } from '../../types';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { 
  Link as LinkIcon, 
  Link2, 
  Edit, 
  Trash2, 
  Eye, 
  Check, 
  Search, 
  Filter, 
  CheckCircle, 
  FileEdit,
  ExternalLink
} from 'lucide-react';

interface AdminPostsListProps {
  onEditPost: (post: Post) => void;
  onCreateNew: () => void;
}

export const AdminPostsList: React.FC<AdminPostsListProps> = ({ onEditPost, onCreateNew }) => {
  const { categories, toast, confirm } = useWebsite();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<{ id: string; type: 'full' | 'short' } | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleToggleStatus = async (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await api.updatePost(post.id, { status: newStatus });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
      );
      toast.success(`Post status changed to ${newStatus}`);
    } catch (err: any) {
      toast.error(`Status update failed: ${err.message}`);
    }
  };

  const handleDelete = (post: Post) => {
    confirm({
      title: 'Delete Publication',
      message: `Are you sure you want to permanently delete "${post.title}"? This action cannot be reversed.`,
      confirmLabel: 'Delete Post',
      onConfirm: async () => {
        try {
          await api.deletePost(post.id);
          setPosts((prev) => prev.filter((p) => p.id !== post.id));
          toast.success('Post deleted successfully');
        } catch (err: any) {
          toast.error(`Delete failed: ${err.message}`);
        }
      },
    });
  };

  const handleCopy = (post: Post, type: 'full' | 'short') => {
    const origin = window.location.origin;
    const url = type === 'full' ? `${origin}/post/${post.slug}` : `${origin}/p/${post.short_id}`;
    navigator.clipboard.writeText(url);
    setCopiedId({ id: post.id, type });
    toast.info(`Copied ${type === 'full' ? 'full' : 'short'} URL to clipboard`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered posts
  const filtered = posts.filter((p) => {
    if (filterCategory !== 'all' && p.category_id !== filterCategory) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            All Published &amp; Draft Dispatches
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage links, status, short URLs, and content controls
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          Create Content
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-400 animate-pulse">
            Loading dispatches...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs">
            No posts found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Title &amp; Desk</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Short URL</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {filtered.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-900/40 transition-colors">
                    {/* Title & Desk */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-serif font-bold text-white text-sm line-clamp-1">
                        {post.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                        <span className="text-red-500 uppercase font-semibold">{post.category_name}</span>
                        <span>·</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Format */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-neutral-900 rounded text-[10px] uppercase font-semibold text-neutral-400 border border-neutral-800">
                        {post.content_type}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          post.status === 'published'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                            : 'bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900'
                        }`}
                      >
                        {post.status}
                      </button>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 font-mono text-neutral-400">
                      {post.views.toLocaleString()}
                    </td>

                    {/* Short Link */}
                    <td className="py-3 px-4 font-mono text-neutral-400">
                      <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-[11px] text-neutral-300">
                        /p/{post.short_id}
                      </span>
                    </td>

                    {/* Action Controls */}
                    <td className="py-3 px-4 text-right space-x-1">
                      {/* Copy Link */}
                      <button
                        onClick={() => handleCopy(post, 'full')}
                        title="Copy Canonical Link"
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId?.id === post.id && copiedId?.type === 'full' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <LinkIcon className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Copy Short Link */}
                      <button
                        onClick={() => handleCopy(post, 'short')}
                        title="Copy Short Link (/p/...)"
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        {copiedId?.id === post.id && copiedId?.type === 'short' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEditPost(post)}
                        title="Edit Article"
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-sky-400 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(post)}
                        title="Delete Article"
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
