import React, { useState, useEffect } from 'react';
import { Ad, AdPosition } from '../../types';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { Megaphone, Edit3, Plus, Trash2, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Sparkles, Eye, Lock } from 'lucide-react';
import { SkipAdModal } from '../../components/ads/SkipAdModal';

export const AdminAdManager: React.FC = () => {
  const { ads, refreshAds, settings, refreshSettings, toast, confirm } = useWebsite();
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [position, setPosition] = useState<AdPosition>('header_728x90');
  const [code, setCode] = useState('');
  const [width, setWidth] = useState<string>('728');
  const [height, setHeight] = useState<string>('90');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Skip Ad settings
  const [skipAdEnabled, setSkipAdEnabled] = useState(settings?.skip_ad_enabled ?? true);
  const [skipAdOpacity, setSkipAdOpacity] = useState(settings?.skip_ad_opacity ?? 0.88);
  const [skipAdLink, setSkipAdLink] = useState(settings?.skip_ad_link || 'https://www.profitableratecpmnetwork.com/u7c83wtb?key=8ad40353f84fe993feb17e6ca4a03326');
  const [savingSettings, setSavingSettings] = useState(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  // Synchronize state whenever settings loads or updates
  useEffect(() => {
    if (settings) {
      if (settings.skip_ad_enabled !== undefined) setSkipAdEnabled(settings.skip_ad_enabled);
      if (settings.skip_ad_opacity !== undefined) {
        const val = Number(settings.skip_ad_opacity);
        setSkipAdOpacity(val > 1 ? val / 100 : val);
      }
      if (settings.skip_ad_link) setSkipAdLink(settings.skip_ad_link);
    }
  }, [settings]);

  const startEdit = (ad: Ad) => {
    setEditingAd(ad);
    setName(ad.name);
    setPosition(ad.position);
    setCode(ad.code);
    setWidth(ad.width ? String(ad.width) : '');
    setHeight(ad.height ? String(ad.height) : '');
    setIsActive(ad.is_active);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingAd(null);
    setName('');
    setPosition('header_728x90');
    setCode('');
    setWidth('728');
    setHeight('90');
    setIsActive(true);
  };

  const handleToggleAd = async (ad: Ad) => {
    try {
      await api.updateAd(ad.id, { is_active: !ad.is_active });
      await refreshAds();
      toast.success(`Slot [${ad.position}] is now ${!ad.is_active ? 'active' : 'paused'}`);
    } catch (err: any) {
      toast.error(`Toggle failed: ${err.message}`);
    }
  };

  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingAd) {
        await api.updateAd(editingAd.id, {
          name: name.trim(),
          position,
          code: code.trim(),
          width: width ? Number(width) || width : undefined,
          height: height ? Number(height) || height : undefined,
          is_active: isActive,
        });
        toast.success(`Ad slot "${name}" updated successfully`);
      } else {
        await api.createAd({
          name: name.trim(),
          position,
          code: code.trim(),
          width: width ? Number(width) || width : undefined,
          height: height ? Number(height) || height : undefined,
          is_active: isActive,
        });
        toast.success(`Ad slot "${name}" created successfully`);
      }
      await refreshAds();
      cancelEdit();
    } catch (err: any) {
      toast.error(`Ad save failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = (id: string, adName: string) => {
    confirm({
      title: 'Delete Ad Placement',
      message: `Delete advertisement slot "${adName}"? The live placement will be removed.`,
      confirmLabel: 'Delete Ad',
      onConfirm: async () => {
        try {
          await api.deleteAd(id);
          await refreshAds();
          toast.success(`Advertisement "${adName}" deleted`);
        } catch (err: any) {
          toast.error(`Delete failed: ${err.message}`);
        }
      },
    });
  };

  const handleSaveSkipAdSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateSettings({
        skip_ad_enabled: skipAdEnabled,
        skip_ad_opacity: Number(skipAdOpacity),
        skip_ad_link: skipAdLink.trim(),
      });
      await refreshSettings();
      toast.success('Skip Ad monetization parameters saved successfully!');
    } catch (err: any) {
      toast.error(`Failed to save skip ad settings: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const positionsList: { id: AdPosition; label: string; desc: string }[] = [
    { id: 'header_728x90', label: 'Header Leaderboard (728×90)', desc: 'Rendered below the top navigation ribbon' },
    { id: 'sidebar_300x250', label: 'Sidebar Medium Rectangle (300×250)', desc: 'Rendered on the right desktop column' },
    { id: 'sidebar_160x300', label: 'Sidebar Skyscraper (160×300)', desc: 'Rendered on article sidebars' },
    { id: 'between_content_468x60', label: 'Between Content (468×60)', desc: 'Rendered inside the home category grid and in articles' },
    { id: 'mobile_bottom_320x50', label: 'Mobile Bottom (320×50)', desc: 'Sticky or bottom banner for mobile screens' },
    { id: 'native_feed', label: 'Native Feed Banner', desc: 'Embedded seamlessly inside the news article feed' },
    { id: 'social_bar', label: 'Floating Social Bar', desc: 'Pinned to the bottom of the viewport' },
    { id: 'popunder', label: 'Homepage Hidden Popunder', desc: 'Fires on first user click anywhere on homepage' },
    { id: 'skip_ad', label: 'Smart Link Skip Ad Gate', desc: 'Interstitial overlay on single post view' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Advertisement &amp; Monetization Manager
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Full control over ad placements, raw script tags, popunder click triggers, native feeds, and smart links
        </p>
      </div>

      {/* 1. Skip Ad System Configuration Box */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif font-bold text-lg text-white">
            Skip Ad Smart Link Gate Settings
          </h3>
        </div>

        <form onSubmit={handleSaveSkipAdSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Enabled toggle */}
            <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800">
              <div>
                <span className="text-xs font-bold text-white block">Skip Ad Gate</span>
                <span className="text-[11px] text-neutral-400">Lock post until user clicks Skip Ad</span>
              </div>
              <button
                type="button"
                onClick={() => setSkipAdEnabled(!skipAdEnabled)}
                className="cursor-pointer"
              >
                {skipAdEnabled ? (
                  <ToggleRight className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-neutral-600" />
                )}
              </button>
            </div>

            {/* Opacity slider */}
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
              <div className="flex justify-between text-xs font-semibold text-white mb-1.5">
                <span>Overlay Opacity</span>
                <span className="font-mono text-amber-400">
                  {Math.round((skipAdOpacity > 1 ? skipAdOpacity / 100 : skipAdOpacity) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.00"
                step="0.05"
                value={skipAdOpacity > 1 ? skipAdOpacity / 100 : skipAdOpacity}
                onChange={(e) => setSkipAdOpacity(parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                <span>5% (Transparent)</span>
                <span>100% (Solid Dark)</span>
              </div>
            </div>

            {/* Smart Link Input */}
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Monetization Smart Link URL
              </label>
              <input
                type="url"
                required
                value={skipAdLink}
                onChange={(e) => setSkipAdLink(e.target.value)}
                className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Real-time Overlay Transparency Visualizer */}
          <div className="mt-3 p-3.5 bg-neutral-900/70 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Real-Time Overlay Opacity Preview</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFullscreenPreview(true)}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Test Fullscreen Overlay</span>
              </button>
            </div>
            
            <div className="relative h-28 rounded-md overflow-hidden border border-neutral-700/80 shadow-inner">
              {/* Sample article content background simulating live page */}
              <div className="absolute inset-0 p-3 bg-white text-neutral-800 text-[11px] leading-relaxed select-none">
                <div className="font-bold text-xs text-neutral-950 mb-1">
                  Global Energy Transition &amp; Autonomous Quantum Semiconductors
                </div>
                <p className="line-clamp-3 text-neutral-700 text-[10px]">
                  Scientists confirmed sustained cryogenic photonic coherence across room-temperature wafers. The international treaty sets binding thresholds on autonomous grid telemetry, providing continuous verifiable verification across continental networks.
                </p>
              </div>

              {/* Live Overlay with exact background alpha applied in real time */}
              <div 
                className="absolute inset-0 flex items-center justify-center transition-colors duration-150 p-2"
                style={{
                  backgroundColor: `rgba(15, 23, 42, ${skipAdOpacity > 1 ? skipAdOpacity / 100 : skipAdOpacity})`,
                }}
              >
                <div className="px-3 py-1.5 bg-neutral-900/95 border border-neutral-700 rounded-lg text-xs text-white font-medium shadow-xl flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exclusive Article Content</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                    {Math.round((skipAdOpacity > 1 ? skipAdOpacity / 100 : skipAdOpacity) * 100)}% Opacity
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500">
              Drag the slider above: Lower opacity makes the overlay more transparent/lighter (revealing article text). Higher opacity makes it darker/more opaque.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Update Skip Ad Controls'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Ad Slots Grid & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ad Form (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
            <h3 className="font-serif font-bold text-base text-white">
              {editingAd ? 'Edit Ad Slot' : 'Add New Ad Slot'}
            </h3>
            {editingAd && (
              <span className="text-[10px] text-amber-400 font-mono">Editing: {editingAd.id}</span>
            )}
          </div>

          <form onSubmit={handleSubmitAd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Ad Slot Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Header Leaderboard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Placement Position *
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as AdPosition)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              >
                {positionsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Width (px)
                </label>
                <input
                  type="text"
                  placeholder="728"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Height (px)
                </label>
                <input
                  type="text"
                  placeholder="90"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Exact Ad Script / HTML Code *
              </label>
              <textarea
                rows={6}
                required
                placeholder="Paste the raw ad network script, iframe, or URL..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Scripts are injected dynamically and evaluated safely without page reloads.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_check"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded"
              />
              <label htmlFor="is_active_check" className="text-xs text-neutral-300 cursor-pointer">
                Enable this Ad Slot on Live Website
              </label>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {editingAd ? 'Save Ad Code' : 'Add Ad Slot'}
              </button>
              {editingAd && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Ads List (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-white">
              Configured Ad Slots ({ads.length})
            </h3>
            <span className="text-[11px] text-neutral-500">Live Network Placements</span>
          </div>

          <div className="divide-y divide-neutral-900">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 flex items-start justify-between gap-4 hover:bg-neutral-900/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm truncate">{ad.name}</span>
                    <button
                      onClick={() => handleToggleAd(ad)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        ad.is_active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {ad.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="text-[11px] text-neutral-400 font-mono">
                    Position: <span className="text-red-400">{ad.position}</span>
                    {ad.width && ad.height && ` · Size: ${ad.width}×${ad.height}`}
                  </div>

                  <div className="mt-2 p-2 bg-neutral-900 rounded border border-neutral-800/80 font-mono text-[10px] text-neutral-400 line-clamp-2 break-all">
                    {ad.code}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(ad)}
                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Code"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAd(ad.id, ad.name)}
                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Ad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Preview */}
      {showFullscreenPreview && (
        <SkipAdModal
          previewMode={true}
          previewOpacity={skipAdOpacity > 1 ? skipAdOpacity / 100 : skipAdOpacity}
          onClosePreview={() => setShowFullscreenPreview(false)}
        />
      )}
    </div>
  );
};
