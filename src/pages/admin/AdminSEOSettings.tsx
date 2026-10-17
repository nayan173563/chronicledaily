import React, { useState } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { api } from '../../services/api';
import { SearchCode, ExternalLink, Check, FileCode, Globe, ShieldCheck } from 'lucide-react';

export const AdminSEOSettings: React.FC = () => {
  const { settings, refreshSettings, toast } = useWebsite();

  const [metaKeywords, setMetaKeywords] = useState(settings?.meta_keywords || '');
  const [metaDescription, setMetaDescription] = useState(settings?.meta_description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    try {
      await api.updateSettings({
        meta_keywords: metaKeywords.trim(),
        meta_description: metaDescription.trim(),
      });
      await refreshSettings();
      setSuccess(true);
      toast.success('Search engine & metadata tags updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      toast.error(`SEO update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Search Engine Optimization (SEO) &amp; Crawlers
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Automated Open Graph, Twitter Cards, XML Sitemap, Robots.txt, and Google Schema Markup
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Default Meta Description (120-160 characters)
              </label>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief search engine snippet for the homepage..."
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
              <div className="text-[11px] text-neutral-500 mt-1 flex justify-between">
                <span>Optimal length: 120-160 chars</span>
                <span className="font-mono text-neutral-400">{metaDescription.length} chars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Meta Keywords (Comma Separated)
              </label>
              <input
                type="text"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="breaking news, world dispatches, geopolitics, technology, investigative journalism"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Updating SEO...' : success ? 'SEO Saved!' : 'Save SEO Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Crawler Endpoints (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* XML Sitemap */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Dynamic XML Sitemap</h4>
              </div>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
              >
                <span>/sitemap.xml</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Auto-generated XML sitemap incorporating all published articles, category index routes, and canonical URL protocols with change frequencies.
            </p>
          </div>

          {/* Robots.txt */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white">
                <Globe className="w-4 h-4 text-sky-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Robots.txt Direct Endpoint</h4>
              </div>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono"
              >
                <span>/robots.txt</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Directs Googlebot and search crawlers while protecting the private editorial console.
            </p>
          </div>

          {/* Structured Data Verification */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-white mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Schema.org NewsArticle Ready</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every post embeds JSON-LD NewsArticle metadata containing headline, author bylines, publication timestamps, and high-resolution OpenGraph cards for rich search results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
