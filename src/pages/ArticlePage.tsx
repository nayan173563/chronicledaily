import React, { useState, useEffect } from 'react';
import { Post, Comment } from '../types';
import { api } from '../services/api';
import { useWebsite } from '../context/WebsiteContext';
import { MediaViewer } from '../components/news/MediaViewer';
import { AdSlot } from '../components/ads/AdSlot';
import { SkipAdModal } from '../components/ads/SkipAdModal';
import { SEOHead } from '../components/seo/SEOHead';
import { SuggestedPosts } from '../components/news/SuggestedPosts';
import { 
  Share2, 
  Link2, 
  Check, 
  Send, 
  Clock, 
  Eye, 
  ChevronLeft, 
  MessageSquare, 
  Sparkles,
  Bookmark
} from 'lucide-react';

interface ArticlePageProps {
  post: Post;
  onNavigateBack: () => void;
  onSelectPost: (post: Post) => void;
  onSelectCategory: (slug: string) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({
  post,
  onNavigateBack,
  onSelectPost,
  onSelectCategory,
}) => {
  const { settings } = useWebsite();
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [allPublishedPosts, setAllPublishedPosts] = useState<Post[]>([]);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'full' | 'short' | null>(null);

  const fullUrl = `${window.location.origin}/post/${post.slug}`;
  const shortUrl = `${window.location.origin}/p/${post.short_id}`;

  useEffect(() => {
    // Load comments and all published posts for suggestions
    const loadData = async () => {
      try {
        const commData = await api.getComments(post.id);
        setComments(commData);

        const allPosts = await api.getPosts({ status: 'published' });
        setAllPublishedPosts(allPosts);
        
        // Filter category-related posts for sidebar
        const catRelated = allPosts.filter((p) => p.id !== post.id && p.category_id === post.category_id);
        setRelatedPosts(catRelated.length > 0 ? catRelated.slice(0, 5) : allPosts.filter((p) => p.id !== post.id).slice(0, 5));
      } catch (err) {
        console.error('Failed to load article extras:', err);
      }
    };
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post.id, post.category_id]);

  const handleCopy = (type: 'full' | 'short', textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await api.addComment({
        post_id: post.id,
        author_name: commentAuthor.trim(),
        author_email: commentEmail.trim(),
        content: commentText.trim(),
      });
      setComments([newComment, ...comments]);
      setCommentText('');
      setCommentAuthor('');
      setCommentEmail('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(post.created_at));

  return (
    <article className="min-h-screen bg-white">
      {/* Dynamic SEO Meta Tags & JSON-LD Structured Data */}
      <SEOHead
        title={post.title}
        description={post.description}
        image={post.thumbnail_url}
        url={fullUrl}
        type="article"
        post={post}
      />

      {/* Mandatory Skip Ad System (with Smart Link & Overlay) */}
      <SkipAdModal post={post} />

      {/* Top Breadcrumb & Return Ribbon */}
      <div className="border-b border-neutral-100 bg-neutral-50/60 py-2.5 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-950 font-medium transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Front Page</span>
          </button>

          <div className="flex items-center gap-2 text-neutral-500">
            <button
              onClick={() => onSelectCategory(post.category_id)}
              className="font-bold text-red-700 hover:underline uppercase tracking-wider"
            >
              {post.category_name}
            </button>
            <span>/</span>
            <span className="font-mono text-[11px] text-neutral-400">ID: {post.short_id}</span>
          </div>
        </div>
      </div>

      {/* Article Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Reading Column (Left 8 cols) */}
          <div className="lg:col-span-8">
            {/* Header Lockup */}
            <header className="mb-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                <span className="text-red-700 uppercase tracking-widest">{post.category_name}</span>
                <span>·</span>
                <span>{formattedDate}</span>
                {post.read_time && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {post.read_time}
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight leading-tight">
                {post.title}
              </h1>

              {post.description && (
                <p className="font-serif italic text-lg sm:text-xl text-neutral-600 leading-relaxed border-l-2 border-red-700 pl-4">
                  {post.description}
                </p>
              )}

              {/* Byline & Share Bar */}
              <div className="pt-4 border-t border-b border-neutral-200 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-serif font-bold flex items-center justify-center text-sm shadow">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">{post.author}</span>
                    <span className="text-neutral-500 text-[11px]">Senior Editorial Correspondent</span>
                  </div>
                </div>

                {/* Social Share Controls & Short Link */}
                <div className="flex items-center gap-2">
                  {/* Copy Short Link Button */}
                  <button
                    onClick={() => handleCopy('short', shortUrl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium transition-colors cursor-pointer"
                    title={`Copy short link: ${shortUrl}`}
                  >
                    {copiedLink === 'short' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] text-emerald-700">Copied Short Link!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy Short URL</span>
                      </>
                    )}
                  </button>

                  {/* Share on WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title}\n${fullUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    title="Share to WhatsApp"
                  >
                    <span className="text-xs font-bold">WA</span>
                  </a>

                  {/* Share on X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(fullUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    title="Share to X"
                  >
                    <span className="text-xs font-bold font-sans">𝕏</span>
                  </a>

                  {/* Share on Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-neutral-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Share to Facebook"
                  >
                    <span className="text-xs font-bold font-serif">f</span>
                  </a>

                  {/* Share on Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-neutral-100 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                    title="Share to Telegram"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </header>

            {/* Media Presentation (Video / Embed / High-Res Image) */}
            <div className="mb-8">
              <MediaViewer post={post} />
            </div>

            {/* Prose Content (Refined typography with measure 65-75ch and drop cap) */}
            <div className="prose prose-neutral max-w-none text-neutral-800 text-base md:text-lg leading-relaxed font-sans space-y-6">
              {post.content.split('\n\n').map((paragraph, index) => {
                if (index === 0) {
                  return (
                    <p
                      key={index}
                      className="first-letter:text-5xl first-letter:font-serif first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-neutral-900 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  );
                }
                return (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* In-Article Advertisement Banner (468×60) */}
            <div className="my-10 pt-6 border-t border-neutral-200">
              <AdSlot position="between_content_468x60" minHeight={60} />
            </div>

            {/* Article Footer & Verification Tag */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Verified Independent Fact-Checked Dispatch</span>
              </div>
              <span className="font-mono text-neutral-400">Total Views: {post.views.toLocaleString()}</span>
            </div>

            {/* Suggested Posts Section (Tailored to Traffic Demands & Interests) */}
            <SuggestedPosts
              currentPost={post}
              allPosts={allPublishedPosts}
              onSelectPost={onSelectPost}
            />

            {/* Reader Comments Section */}
            {settings?.comments_enabled && (
              <section className="mt-14 pt-8 border-t-2 border-neutral-900">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-neutral-800" />
                    <h3 className="font-serif font-bold text-xl text-neutral-950">
                      Discussions ({comments.length})
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-500">Moderated Forum</span>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-8 p-5 bg-neutral-50 border border-neutral-200 rounded-lg space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Contribute to the Editorial Forum
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Full Name *"
                      required
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Your Email Address (Confidential)"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write your respectful, constructive commentary..."
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-5 py-2 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submittingComment ? 'Submitting...' : 'Post Commentary'}
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No comments yet. Be the first to start the discussion.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-4 border border-neutral-100 rounded-lg bg-white shadow-xs">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-neutral-900">{c.author_name}</span>
                          <span className="text-neutral-400 text-[11px]">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Editorial Sidebar (Right 4 cols) */}
          <aside className="lg:col-span-4 space-y-8 lg:border-l lg:border-neutral-200 lg:pl-8">
            {/* Sidebar Ad (300×250) */}
            <div>
              <AdSlot position="sidebar_300x250" minHeight={250} />
            </div>

            {/* Related Coverage */}
            {relatedPosts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <h3 className="font-serif font-bold text-base uppercase tracking-wider text-neutral-900">
                    Related Stories
                  </h3>
                  <span className="text-[10px] font-bold text-red-600 uppercase">Top Picks</span>
                </div>
                <div className="space-y-3.5">
                  {relatedPosts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => {
                        onSelectPost(rel);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group cursor-pointer flex gap-3 py-2 border-b border-neutral-100 last:border-b-0 items-start"
                    >
                      {rel.thumbnail_url && (
                        <div className="w-18 h-14 rounded-md overflow-hidden shrink-0 bg-neutral-100">
                          <img
                            src={rel.thumbnail_url}
                            alt={rel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes('unsplash.com')) {
                                target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold uppercase mb-1">
                          <span className="text-red-700">{rel.category_name}</span>
                          <span>·</span>
                          <span className="font-mono">{(rel.views || 0).toLocaleString()} views</span>
                        </div>
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-red-700 transition-colors leading-snug line-clamp-2">
                          {rel.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skyscraper Sidebar Ad (160×300) */}
            <div className="pt-4 border-t border-neutral-200">
              <AdSlot position="sidebar_160x300" minHeight={300} />
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
};
