import React, { useState, useEffect } from 'react';
import { MediaItem } from '../../types';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { Upload, Copy, Check, Trash2, Image as ImageIcon, Video, Plus, ExternalLink } from 'lucide-react';

export const AdminMediaLibrary: React.FC = () => {
  const { toast, confirm } = useWebsite();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add external URL modal/inputs
  const [externalUrl, setExternalUrl] = useState('');
  const [externalTitle, setExternalTitle] = useState('');
  const [externalType, setExternalType] = useState<'image' | 'video'>('image');

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const data = await api.getMedia();
      setMediaList(data);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const item = await api.uploadMedia({
          title: file.name,
          dataUrl: reader.result as string,
          type: file.type.startsWith('video') ? 'video' : 'image',
        });
        setMediaList([item, ...mediaList]);
        toast.success(`Uploaded "${file.name}" successfully`);
      } catch (err: any) {
        toast.error(`Upload error: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalUrl.trim()) return;

    try {
      const item = await api.uploadMedia({
        title: externalTitle.trim() || 'External Media',
        externalUrl: externalUrl.trim(),
        type: externalType,
      });
      setMediaList([item, ...mediaList]);
      setExternalUrl('');
      setExternalTitle('');
      toast.success('External media asset linked successfully');
    } catch (err: any) {
      toast.error(`Error saving external media: ${err.message}`);
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    const fullUrl = item.url.startsWith('http') ? item.url : `${window.location.origin}${item.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    toast.info('Media URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: 'Delete Media Asset',
      message: 'Are you sure you want to delete this media asset? This cannot be undone.',
      confirmLabel: 'Delete Asset',
      onConfirm: async () => {
        try {
          await api.deleteMedia(id);
          setMediaList(mediaList.filter((m) => m.id !== id));
          toast.success('Media asset removed');
        } catch (err: any) {
          toast.error(`Delete failed: ${err.message}`);
        }
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Media Asset Library
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Store, view, and reuse photos, videos, and thumbnails across editorial articles
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md self-start sm:self-auto">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Media File'}</span>
          <input
            type="file"
            accept="image/*,video/*"
            disabled={uploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Add External URL Bar */}
      <form onSubmit={handleAddExternal} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col md:flex-row gap-3 items-center">
        <input
          type="url"
          required
          placeholder="Or paste external media URL (Cloudinary, CDN, Unsplash, Video)..."
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 w-full"
        />
        <input
          type="text"
          placeholder="Media Label / Caption"
          value={externalTitle}
          onChange={(e) => setExternalTitle(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 w-full md:w-48"
        />
        <select
          value={externalType}
          onChange={(e) => setExternalType(e.target.value as any)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none w-full md:w-32"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 w-full md:w-auto"
        >
          Add to Library
        </button>
      </form>

      {/* Media Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-400 animate-pulse">
          Loading media library...
        </div>
      ) : mediaList.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 text-xs bg-neutral-950 rounded-xl border border-neutral-800">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
          <p className="font-serif text-sm">Media library is empty.</p>
          <p className="text-neutral-500 mt-1">Upload files or register external CDN URLs to reuse across articles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="group bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              {/* Preview */}
              <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] uppercase font-bold flex items-center gap-1">
                  {item.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  <span>{item.type}</span>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-3 space-y-2">
                <div className="text-xs font-semibold text-white truncate" title={item.title}>
                  {item.title}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {new Date(item.created_at).toLocaleDateString()} {item.size && `· ${item.size}`}
                </div>

                <div className="pt-2 border-t border-neutral-900 flex items-center justify-between">
                  <button
                    onClick={() => handleCopyUrl(item)}
                    className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-neutral-400" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
