import React, { useState, useRef } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { api } from '../../services/api';
import { 
  Settings, 
  Palette, 
  Type, 
  Layout, 
  Share2, 
  Phone, 
  Sparkles, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  Globe,
  ExternalLink
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { settings, refreshSettings, toast } = useWebsite();

  const [websiteName, setWebsiteName] = useState(settings?.website_name || '');
  const [websiteTagline, setWebsiteTagline] = useState(settings?.website_tagline || '');
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '');
  const [faviconUrl, setFaviconUrl] = useState(settings?.favicon_url || '');
  const [primaryColor, setPrimaryColor] = useState(settings?.primary_color || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondary_color || '#475569');
  const [accentColor, setAccentColor] = useState(settings?.accent_color || '#b91c1c');
  const [headerDesign, setHeaderDesign] = useState<'classic' | 'minimal' | 'editorial'>(settings?.header_design || 'editorial');
  const [footerDesign, setFooterDesign] = useState<'columns' | 'compact'>(settings?.footer_design || 'columns');
  const [fontFamily, setFontFamily] = useState<'playfair' | 'instrument' | 'merriweather' | 'sans'>(settings?.font_family || 'playfair');

  // Social media links
  const [facebook, setFacebook] = useState(settings?.social_links?.facebook || '');
  const [twitter, setTwitter] = useState(settings?.social_links?.twitter || '');
  const [instagram, setInstagram] = useState(settings?.social_links?.instagram || '');
  const [youtube, setYoutube] = useState(settings?.social_links?.youtube || '');
  const [telegram, setTelegram] = useState(settings?.social_links?.telegram || '');
  const [whatsapp, setWhatsapp] = useState(settings?.social_links?.whatsapp || '');

  // Contact info
  const [contactEmail, setContactEmail] = useState(settings?.contact_info?.email || '');
  const [contactPhone, setContactPhone] = useState(settings?.contact_info?.phone || '');
  const [contactAddress, setContactAddress] = useState(settings?.contact_info?.address || '');

  // Copyright & Comments
  const [copyrightText, setCopyrightText] = useState(settings?.copyright_text || '');
  const [commentsEnabled, setCommentsEnabled] = useState(settings?.comments_enabled ?? true);

  // File upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Logo file size must be under 8MB');
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const item = await api.uploadMedia({
          title: `Logo - ${file.name}`,
          dataUrl: reader.result as string,
          type: 'image',
        });
        setLogoUrl(item.url);
        toast.success(`Logo "${file.name}" uploaded successfully! Click "Save" to apply.`);
      } catch (err: any) {
        toast.error(`Logo upload error: ${err.message}`);
      } finally {
        setUploadingLogo(false);
        if (logoFileRef.current) logoFileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Favicon file upload handler
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Favicon file size must be under 2MB');
      return;
    }

    setUploadingFavicon(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const item = await api.uploadMedia({
          title: `Favicon - ${file.name}`,
          dataUrl: reader.result as string,
          type: 'image',
        });
        setFaviconUrl(item.url);
        toast.success(`Favicon "${file.name}" uploaded successfully! Click "Save" to apply.`);
      } catch (err: any) {
        toast.error(`Favicon upload error: ${err.message}`);
      } finally {
        setUploadingFavicon(false);
        if (faviconFileRef.current) faviconFileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateSettings({
        website_name: websiteName.trim(),
        website_tagline: websiteTagline.trim(),
        logo_url: logoUrl.trim(),
        favicon_url: faviconUrl.trim(),
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        header_design: headerDesign,
        footer_design: footerDesign,
        font_family: fontFamily,
        social_links: {
          facebook: facebook.trim(),
          twitter: twitter.trim(),
          instagram: instagram.trim(),
          youtube: youtube.trim(),
          telegram: telegram.trim(),
          whatsapp: whatsapp.trim(),
        },
        contact_info: {
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          address: contactAddress.trim(),
        },
        copyright_text: copyrightText.trim(),
        comments_enabled: commentsEnabled,
      });

      await refreshSettings();
      setSaveSuccess(true);
      toast.success('Website configuration & branding updated instantly!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(`Settings update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Complete Website Settings
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Change branding, design themes, fonts, social handles, and contact coordinates without editing code
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50 self-start sm:self-auto"
        >
          {isSaving ? (
            'Saving Settings...'
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Saved Instantly!</span>
            </>
          ) : (
            'Save All Changes'
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Identity & Visual Assets */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-white">
            <Layout className="w-4 h-4 text-red-500" />
            <h3 className="font-serif font-bold text-base">Branding &amp; Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Website Name *
              </label>
              <input
                type="text"
                required
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Website Tagline / Motto
              </label>
              <input
                type="text"
                value={websiteTagline}
                onChange={(e) => setWebsiteTagline(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Logo & Favicon Upload & URL Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-neutral-800/80">
            {/* 1. Website Logo Section */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-neutral-800 border border-neutral-700 rounded-md text-red-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Website Brand Logo
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Shown across header masthead & mobile brand rails
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo</span>
                      </>
                    )}
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      title="Clear logo"
                      className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Logo Live Visual Preview Container */}
              <div className="relative rounded-lg border border-neutral-800 bg-neutral-950/80 p-4 flex flex-col items-center justify-center min-h-[110px] overflow-hidden">
                {logoUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2.5 bg-white/5 border border-white/10 rounded-md backdrop-blur-xs flex items-center justify-center max-w-full">
                      <img
                        src={logoUrl}
                        alt="Brand Logo Preview"
                        className="max-h-14 max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Logo Asset
                    </span>
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 space-y-1">
                    <ImageIcon className="w-6 h-6 mx-auto opacity-40" />
                    <p className="text-xs text-neutral-400 font-medium">No custom logo uploaded</p>
                    <p className="text-[10px] text-neutral-500">
                      Standard journalistic text title &ldquo;{websiteName || 'Chronicle Daily'}&rdquo; will be displayed
                    </p>
                  </div>
                )}
              </div>

              {/* Logo URL Input (Direct paste or generated from upload) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Logo Image URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Upload image above or paste URL: https://.../logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono pr-8"
                  />
                  {logoUrl && (
                    <a
                      href={logoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                      title="Open logo image"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Supports PNG, SVG, JPG, WebP. Recommended: Transparent background, height 40–80px, max 8MB.
                </p>
              </div>
            </div>

            {/* 2. Website Favicon Section */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-neutral-800 border border-neutral-700 rounded-md text-amber-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Website Favicon Icon
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Browser tabs, bookmark bars & mobile home shortcuts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={faviconFileRef}
                    type="file"
                    accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/jpeg"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingFavicon}
                    onClick={() => faviconFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {uploadingFavicon ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Favicon</span>
                      </>
                    )}
                  </button>

                  {faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setFaviconUrl('')}
                      title="Clear favicon"
                      className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Realistic Browser Tab Mockup Preview */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-3 min-h-[110px] flex flex-col justify-center">
                <div className="text-[10px] uppercase font-semibold text-neutral-500 mb-1.5 text-center">
                  Browser Tab Live Simulation
                </div>
                
                {/* Simulated Chrome / Safari Tab Bar */}
                <div className="w-full max-w-xs mx-auto bg-neutral-900 border border-neutral-750 rounded-t-lg pt-1 px-1 shadow-inner">
                  <div className="flex items-center gap-2 bg-neutral-800 text-white px-3 py-1.5 rounded-t-md border-t border-x border-neutral-700 text-xs shadow-xs">
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt="Favicon Preview"
                        className="w-4 h-4 object-contain rounded-xs shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    )}
                    <span className="truncate text-[11px] font-medium max-w-[170px]">
                      {websiteName || 'Chronicle Daily'}
                    </span>
                    <span className="ml-auto text-[10px] text-neutral-400 hover:text-white">✕</span>
                  </div>
                </div>

                <div className="text-center mt-2">
                  <span className={`text-[10px] font-mono ${faviconUrl ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {faviconUrl ? '● Custom Favicon Active' : 'Default Browser Globe Icon'}
                  </span>
                </div>
              </div>

              {/* Favicon URL Input (Direct paste or generated from upload) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Favicon Icon URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Upload icon above or paste URL: https://.../favicon.ico"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono pr-8"
                  />
                  {faviconUrl && (
                    <a
                      href={faviconUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                      title="Open favicon"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Supports .ico, .png, .svg. Standard size: 32×32, 48×48 or 64×64 pixels, max 2MB.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Color Scheme & Typography */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-white">
            <Palette className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif font-bold text-base">Color Palette &amp; Typography</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-8 bg-neutral-900 border border-neutral-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Secondary Structural Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-8 bg-neutral-900 border border-neutral-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Accent Highlight Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-8 bg-neutral-900 border border-neutral-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Font Family Selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Font Family Pairing
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { id: 'playfair', title: 'Playfair Display', sub: 'Traditional broadsheet editorial serif' },
                { id: 'instrument', title: 'Instrument Serif', sub: 'Contemporary high-contrast monograph' },
                { id: 'merriweather', title: 'Merriweather', sub: 'Warm literary book serif' },
                { id: 'sans', title: 'Plus Jakarta Sans', sub: 'Modern clean digital agency typeface' },
              ].map((f) => (
                <div
                  key={f.id}
                  onClick={() => setFontFamily(f.id as any)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    fontFamily === f.id
                      ? 'bg-neutral-900 border-red-500 shadow-sm'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-white text-xs">{f.title}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Header & Footer Layout Variants */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-white">
            <Layout className="w-4 h-4 text-sky-500" />
            <h3 className="font-serif font-bold text-base">Header &amp; Footer Layout Design</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Header Design Variant
              </label>
              <div className="space-y-2">
                {[
                  { id: 'editorial', label: 'Editorial Masthead', desc: 'Prominent centered newspaper masthead with date & utility ribbon' },
                  { id: 'classic', label: 'Classic Portal', desc: 'Category navigation rail with breaking news ticker' },
                  { id: 'minimal', label: 'Modern Minimalist', desc: 'Single sleek row with brand wordmark and nav links' },
                ].map((h) => (
                  <label
                    key={h.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      headerDesign === h.id ? 'bg-neutral-900 border-red-500' : 'bg-neutral-900/40 border-neutral-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="header_design"
                      checked={headerDesign === h.id}
                      onChange={() => setHeaderDesign(h.id as any)}
                      className="mt-1 accent-red-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{h.label}</div>
                      <div className="text-[11px] text-neutral-400">{h.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Footer Design Variant
              </label>
              <div className="space-y-2">
                {[
                  { id: 'columns', label: 'Multi-Column Broadcaster', desc: '5-column structured footer with desks, contact coordinates, and social icons' },
                  { id: 'compact', label: 'Compact Minimal', desc: 'Quiet inline links and simple copyright strip' },
                ].map((f) => (
                  <label
                    key={f.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      footerDesign === f.id ? 'bg-neutral-900 border-red-500' : 'bg-neutral-900/40 border-neutral-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="footer_design"
                      checked={footerDesign === f.id}
                      onChange={() => setFooterDesign(f.id as any)}
                      className="mt-1 accent-red-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{f.label}</div>
                      <div className="text-[11px] text-neutral-400">{f.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Social Media Links */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-white">
            <Share2 className="w-4 h-4 text-emerald-500" />
            <h3 className="font-serif font-bold text-base">Social Media Profiles</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Facebook URL</label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Twitter / X URL</label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Instagram URL</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">YouTube Channel URL</label>
              <input
                type="url"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Telegram Channel / Bot</label>
              <input
                type="url"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">WhatsApp Channel / Group</label>
              <input
                type="url"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* 5. Contact Coordinates & Copyright */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-white">
            <Phone className="w-4 h-4 text-rose-500" />
            <h3 className="font-serif font-bold text-base">Contact Information &amp; Legal</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Editorial Desk Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Newsroom Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Physical Bureau Address</label>
              <input
                type="text"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Copyright Notice Text</label>
            <input
              type="text"
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="comments_enabled_check"
              checked={commentsEnabled}
              onChange={(e) => setCommentsEnabled(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded"
            />
            <label htmlFor="comments_enabled_check" className="text-xs text-neutral-300 cursor-pointer">
              Enable Reader Discussions &amp; Comments on Articles
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving Changes...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
