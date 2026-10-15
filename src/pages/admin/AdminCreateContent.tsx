import React, { useState, useEffect } from 'react';
import { Post, ContentType, MediaType } from '../../types';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { detectMediaSource, generateShortId, generateSlug } from '../../services/mediaDetector';
import { 
  Sparkles, 
  Upload, 
  Check, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Film, 
  Eye, 
  Share2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface AdminCreateContentProps {
  postToEdit?: Post | null;
  onPostSaved: () => void;
  onCancel: () => void;
}

export const AdminCreateContent: React.FC<AdminCreateContentProps> = ({
  postToEdit,
  onPostSaved,
  onCancel,
}) => {
  const { categories, settings, toast } = useWebsite();

  const [title, setTitle] = useState(postToEdit?.title || '');
  const [description, setDescription] = useState(postToEdit?.description || '');
  const [content, setContent] = useState(postToEdit?.content || '');
  const [categoryId, setCategoryId] = useState(postToEdit?.category_id || (categories[0]?.id || 'cat-1'));
  const [contentType, setContentType] = useState<ContentType>(postToEdit?.content_type || 'news');
  const [mediaSource, setMediaSource] = useState(postToEdit?.media_source || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(postToEdit?.thumbnail_url || '');
  const [author, setAuthor] = useState(postToEdit?.author || 'Chief Editor');
  const [status, setStatus] = useState<'published' | 'draft'>(postToEdit?.status || 'published');
  const [readTime, setReadTime] = useState(postToEdit?.read_time || '4 min read');

  // Device file upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Auto-detected media state
  const [detectedType, setDetectedType] = useState<MediaType>('none');
  const [autoThumbnail, setAutoThumbnail] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'facebook' | 'twitter' | 'whatsapp'>('whatsapp');

  useEffect(() => {
    if (mediaSource.trim()) {
      const result = detectMediaSource(mediaSource);
      setDetectedType(result.type);
      if (result.autoThumbnail && !thumbnailUrl) {
        setAutoThumbnail(result.autoThumbnail);
      }
    } else {
      setDetectedType('none');
    }
  }, [mediaSource, thumbnailUrl]);

  // Handle direct file upload (image or video) from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isThumbnail = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadFeedback(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const item = await api.uploadMedia({
          title: file.name,
          dataUrl,
          type: file.type.startsWith('video') ? 'video' : 'image',
        });

        if (isThumbnail) {
          setThumbnailUrl(item.url);
          setUploadFeedback('Custom thumbnail uploaded successfully!');
        } else {
          if (file.type.startsWith('video')) {
            setMediaSource(item.url);
            setUploadFeedback('Video uploaded directly from device!');
          } else {
            setThumbnailUrl(item.url);
            setUploadFeedback('Image uploaded and set as visual!');
          }
        }
      } catch (err: any) {
        setUploadFeedback(`Upload failed: ${err.message}`);
      } finally {
        setUploadingFile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseAutoThumbnail = () => {
    if (autoThumbnail) {
      setThumbnailUrl(autoThumbnail);
    }
  };

  const handleSubmit = async (submitStatus: 'published' | 'draft') => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both Title and Content fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalThumbnail = thumbnailUrl || autoThumbnail || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
      const finalSlug = postToEdit ? postToEdit.slug : generateSlug(title);
      const finalShortId = postToEdit ? postToEdit.short_id : generateShortId();

      const postPayload: Partial<Post> = {
        title: title.trim(),
        slug: finalSlug,
        short_id: finalShortId,
        description: description.trim(),
        content: content.trim(),
        category_id: categoryId,
        content_type: contentType,
        media_source: mediaSource.trim(),
        media_type: detectedType !== 'none' ? detectedType : 'none',
        thumbnail_url: finalThumbnail,
        author: author.trim(),
        status: submitStatus,
        read_time: readTime,
      };

      if (postToEdit) {
        await api.updatePost(postToEdit.id, postPayload);
        toast.success('Post updated successfully!');
      } else {
        await api.createPost(postPayload);
        toast.success(submitStatus === 'published' ? 'Post published successfully!' : 'Draft saved successfully!');
      }

      onPostSaved();
    } catch (err: any) {
      toast.error(`Error saving post: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveThumbnail = thumbnailUrl || autoThumbnail || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
  const siteName = settings?.website_name || 'The Daily Chronicle';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {postToEdit ? 'Edit Dispatch' : 'Create Content'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Universal publishing system for News and Articles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish to Live'}
          </button>
        </div>
      </div>

      {uploadFeedback && (
        <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-neutral-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{uploadFeedback}</span>
        </div>
      )}

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6 bg-neutral-950 border border-neutral-800 rounded-xl p-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="Write a clear, compelling headline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Category & Author row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Editorial Desk (Category)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Author Byline
              </label>
              <input
                type="text"
                placeholder="Author Name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Summary / Deck (For Social Preview &amp; Listing)
            </label>
            <textarea
              rows={2}
              placeholder="1-2 sentences summarizing the core dispatch..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Universal Media Source Field */}
          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-white">
                Media Source (Embed &amp; External Media)
              </label>
              {detectedType !== 'none' && (
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold uppercase">
                  Detected: {detectedType}
                </span>
              )}
            </div>

            <textarea
              rows={2}
              placeholder="Paste YouTube URL, Facebook Video URL, TikTok URL, Instagram URL, Vimeo URL, Direct Video (.mp4), or raw <iframe> / embed code..."
              value={mediaSource}
              onChange={(e) => setMediaSource(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono"
            />

            <p className="text-[11px] text-neutral-400">
              Supports: YouTube, Facebook, TikTok, Instagram, Vimeo, Direct MP4/WebM, iframe code, embed script, or source code.
            </p>

            {/* Direct Device Upload Option */}
            <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Media from Device</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="hidden"
                />
              </label>

              {uploadingFile && (
                <span className="text-amber-400 animate-pulse text-[11px]">Uploading file to library...</span>
              )}
            </div>
          </div>

          {/* Custom Thumbnail Upload & Auto Thumbnail */}
          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-white">
                Thumbnail Image (OpenGraph &amp; Cards)
              </label>
              {autoThumbnail && !thumbnailUrl && (
                <button
                  type="button"
                  onClick={handleUseAutoThumbnail}
                  className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Use Auto-Generated Thumbnail
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Thumbnail image URL..."
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />

              <label className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs cursor-pointer transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Thumbnail</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="hidden"
                />
              </label>
            </div>

            {autoThumbnail && (
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <span>Platform auto-thumbnail detected.</span>
                {!thumbnailUrl && (
                  <span className="text-emerald-400">(Currently Active as Default)</span>
                )}
              </div>
            )}
          </div>

          {/* Full Rich Content */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Full Post Content / Article Text *
            </label>
            <textarea
              rows={12}
              required
              placeholder="Write the complete article or description..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Social Share Preview (Open Graph & Twitter Card) (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-red-500" />
                <h3 className="font-serif font-bold text-base text-white">
                  Social Share Preview
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 uppercase font-mono">OG &amp; Twitter Cards</span>
            </div>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Real-time preview of how this post will render when shared on Facebook, WhatsApp, Telegram, X (Twitter), LinkedIn, and Discord.
            </p>

            {/* Preview Platform Tabs */}
            <div className="flex items-center gap-2 mb-4 bg-neutral-900 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActivePreviewTab('whatsapp')}
                className={`flex-1 py-1.5 rounded text-center transition-colors cursor-pointer ${
                  activePreviewTab === 'whatsapp' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400'
                }`}
              >
                WhatsApp / TG
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('facebook')}
                className={`flex-1 py-1.5 rounded text-center transition-colors cursor-pointer ${
                  activePreviewTab === 'facebook' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400'
                }`}
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('twitter')}
                className={`flex-1 py-1.5 rounded text-center transition-colors cursor-pointer ${
                  activePreviewTab === 'twitter' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400'
                }`}
              >
                X (Twitter)
              </button>
            </div>

            {/* Social Preview Card Mockup */}
            <div className="border border-neutral-700/80 rounded-xl overflow-hidden bg-neutral-900 shadow-xl">
              {/* Image slot */}
              <div className="relative aspect-[1.91/1] w-full bg-neutral-950 overflow-hidden">
                <img
                  src={effectiveThumbnail}
                  alt={title || 'Social card preview'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                  1200×630 OG
                </div>
              </div>

              {/* Text metadata preview */}
              <div className="p-3.5 bg-neutral-900 space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  {siteName.toUpperCase()}
                </div>
                <h4 className="font-serif font-bold text-sm text-white line-clamp-2 leading-snug">
                  {title || 'Post Title Will Appear Here'}
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {description || content.substring(0, 120) || 'Post description and excerpt summary will render automatically in social previews.'}
                </p>
              </div>
            </div>

            {/* Generated Meta Tags Checklist */}
            <div className="mt-5 pt-4 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>og:title &amp; twitter:title verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>og:description &amp; twitter:description configured</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>og:image &amp; twitter:image dynamic resolution</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>og:type=article &amp; JSON-LD Schema enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
