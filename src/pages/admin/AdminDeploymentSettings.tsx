import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { 
  Globe, 
  Mail, 
  SearchCode, 
  BarChart, 
  Share2, 
  Megaphone, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Key, 
  Send, 
  Server, 
  ExternalLink,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { DeploymentSettings, SmtpSettingsView } from '../../types';

export const AdminDeploymentSettings: React.FC = () => {
  const { toast } = useWebsite();
  const [loading, setLoading] = useState(true);

  // Group A: Custom Domain Settings
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [savingDomains, setSavingDomains] = useState(false);

  // Group B: SMTP Email Settings
  const [smtpConfig, setSmtpConfig] = useState<SmtpSettingsView | null>(null);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpEncryption, setSmtpEncryption] = useState<'tls' | 'ssl' | 'none'>('tls');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpIsEnabled, setSmtpIsEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Group C: Google Search Console Verification
  const [searchConsoleCode, setSearchConsoleCode] = useState('');
  const [savingSearchConsole, setSavingSearchConsole] = useState(false);

  // Group D: Google Analytics Settings
  const [analyticsId, setAnalyticsId] = useState('');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [savingAnalytics, setSavingAnalytics] = useState(false);

  // Group E: Meta Pixel Settings
  const [pixelId, setPixelId] = useState('');
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [savingPixel, setSavingPixel] = useState(false);

  // Group F: Google AdSense Settings
  const [adsenseId, setAdsenseId] = useState('');
  const [adsenseEnabled, setAdsenseEnabled] = useState(false);
  const [savingAdsense, setSavingAdsense] = useState(false);

  // Load all Deployment & SMTP settings on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDeploymentSettings();
      const dep = data.deployment;
      const smtp = data.smtp;

      // Populate Domain
      setPrimaryDomain(dep.primary_domain || '');
      setWebsiteUrl(dep.website_url || '');
      setCanonicalUrl(dep.canonical_url || '');

      // Populate Search Console
      setSearchConsoleCode(dep.google_search_console_code || '');

      // Populate Analytics
      setAnalyticsId(dep.google_analytics_id || '');
      setAnalyticsEnabled(Boolean(dep.google_analytics_enabled));

      // Populate Meta Pixel
      setPixelId(dep.meta_pixel_id || '');
      setPixelEnabled(Boolean(dep.meta_pixel_enabled));

      // Populate Google AdSense
      setAdsenseId(dep.google_adsense_id || '');
      setAdsenseEnabled(Boolean(dep.google_adsense_enabled));

      // Populate SMTP
      if (smtp) {
        setSmtpConfig(smtp);
        setSmtpHost(smtp.host || '');
        setSmtpPort(smtp.port || 587);
        setSmtpUsername(smtp.username || '');
        setSmtpPassword(smtp.password_masked || '');
        setSmtpEncryption(smtp.encryption || 'tls');
        setSmtpFromEmail(smtp.from_email || '');
        setSmtpFromName(smtp.from_name || '');
        setSmtpIsEnabled(Boolean(smtp.is_enabled));
      }
    } catch (err: any) {
      toast.error(`Failed to load deployment settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ----------------------------------------------------
  // HANDLERS FOR EACH CONFIGURATION GROUP
  // ----------------------------------------------------

  // Group A: Save Custom Domain Settings
  const handleSaveDomains = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDomains(true);
    try {
      await api.saveDomainSettings({
        primary_domain: primaryDomain.trim(),
        website_url: websiteUrl.trim(),
        canonical_url: canonicalUrl.trim(),
      });
      toast.success('Custom domain settings updated successfully!');
      // Dispatch storage event so client head updates
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      toast.error(`Domain update failed: ${err.message}`);
    } finally {
      setSavingDomains(false);
    }
  };

  // Group B: Save SMTP Configuration
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpHost) {
      toast.error('SMTP Host is required');
      return;
    }
    setSavingSmtp(true);
    try {
      const res = await api.saveSmtpSettings({
        host: smtpHost.trim(),
        port: Number(smtpPort),
        username: smtpUsername.trim(),
        password: smtpPassword,
        encryption: smtpEncryption,
        from_email: smtpFromEmail.trim(),
        from_name: smtpFromName.trim(),
        is_enabled: smtpIsEnabled,
      });
      setSmtpConfig(res.smtp);
      setSmtpPassword(res.smtp.password_masked);
      toast.success('SMTP configuration saved and encrypted with AES-256!');
    } catch (err: any) {
      toast.error(`SMTP save failed: ${err.message}`);
    } finally {
      setSavingSmtp(false);
    }
  };

  // Group B: Test SMTP Connection
  const handleTestSmtpConnection = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await api.testSmtpConnection({
        host: smtpHost.trim(),
        port: Number(smtpPort),
        username: smtpUsername.trim(),
        password: smtpPassword,
        encryption: smtpEncryption,
      });
      setSmtpTestResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const fail = { success: false, message: err.message || 'Connection test failed' };
      setSmtpTestResult(fail);
      toast.error(fail.message);
    } finally {
      setTestingSmtp(false);
    }
  };

  // Group B: Send Test Email
  const handleSendTestEmail = async () => {
    if (!testRecipientEmail || !testRecipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }
    setSendingTestMail(true);
    setTestMailResult(null);
    try {
      const res = await api.sendTestEmail({
        to_email: testRecipientEmail.trim(),
        config: {
          host: smtpHost.trim(),
          port: Number(smtpPort),
          username: smtpUsername.trim(),
          password: smtpPassword,
          encryption: smtpEncryption,
          from_email: smtpFromEmail.trim(),
          from_name: smtpFromName.trim(),
        },
      });
      setTestMailResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const fail = { success: false, message: err.message || 'Failed to dispatch test email' };
      setTestMailResult(fail);
      toast.error(fail.message);
    } finally {
      setSendingTestMail(false);
    }
  };

  // Group C: Save Search Console
  const handleSaveSearchConsole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSearchConsole(true);
    try {
      await api.saveSearchConsole({
        google_search_console_code: searchConsoleCode.trim(),
      });
      toast.success('Google Search Console verification code updated!');
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      toast.error(`Verification update failed: ${err.message}`);
    } finally {
      setSavingSearchConsole(false);
    }
  };

  // Group D: Save Google Analytics
  const handleSaveAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAnalytics(true);
    try {
      await api.saveAnalyticsSettings({
        google_analytics_id: analyticsId.trim(),
        google_analytics_enabled: analyticsEnabled,
      });
      toast.success('Google Analytics settings saved!');
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      toast.error(`Analytics update failed: ${err.message}`);
    } finally {
      setSavingAnalytics(false);
    }
  };

  // Group E: Save Meta Pixel
  const handleSavePixel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPixel(true);
    try {
      await api.saveMetaPixelSettings({
        meta_pixel_id: pixelId.trim(),
        meta_pixel_enabled: pixelEnabled,
      });
      toast.success('Meta Pixel settings saved!');
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      toast.error(`Meta Pixel update failed: ${err.message}`);
    } finally {
      setSavingPixel(false);
    }
  };

  // Group F: Save Google AdSense
  const handleSaveAdsense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdsense(true);
    try {
      await api.saveAdSenseSettings({
        google_adsense_id: adsenseId.trim(),
        google_adsense_enabled: adsenseEnabled,
      });
      toast.success('Google AdSense publisher configuration saved!');
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      toast.error(`AdSense update failed: ${err.message}`);
    } finally {
      setSavingAdsense(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Loading Deployment Configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Server className="w-7 h-7 text-sky-400" />
              <span>Deployment Settings</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-3xl">
              Configure production domains, AES-256 encrypted SMTP email delivery, Google Search Console verification, and marketing analytics tags dynamically without touching code or environment variables.
            </p>
          </div>
          <button
            onClick={loadData}
            className="self-start sm:self-center px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Config</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ==================================================== */}
        {/* CARD A: CUSTOM DOMAIN SETTINGS */}
        {/* ==================================================== */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-950/60 border border-sky-800/60 rounded-lg text-sky-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Custom Domain Settings</h3>
                <p className="text-[11px] text-neutral-400">Production hostname, canonical origin, and sitemap domain</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
              DNS Routing
            </span>
          </div>

          <form onSubmit={handleSaveDomains} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Primary Domain
              </label>
              <input
                type="text"
                value={primaryDomain}
                onChange={(e) => setPrimaryDomain(e.target.value)}
                placeholder="e.g. chronicle-daily.org"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Host header identification for web traffic and multi-region routing.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Website URL (Full Origin)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://chronicle-daily.org"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Base URL used for news sitemaps, robots.txt, and transactional links.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Canonical URL
              </label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://chronicle-daily.org"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Self-referencing canonical tag injected into &lt;head&gt; to consolidate search ranking.</p>
            </div>

            {/* Registrar notice */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 flex items-start gap-2.5 text-[11px] text-neutral-400 leading-relaxed">
              <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-300">DNS Configuration Notice:</strong> To point your domain here, add an <strong>A Record</strong> pointing to your server's public IP address, or a <strong>CNAME Record</strong> pointing to your cluster hostname at your DNS registrar (e.g. Cloudflare, Namecheap, GoDaddy).
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingDomains}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingDomains ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{savingDomains ? 'Saving Domains...' : 'Save Domain Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ==================================================== */}
        {/* CARD B: SMTP EMAIL SETTINGS */}
        {/* ==================================================== */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">SMTP Email Settings</h3>
                <p className="text-[11px] text-neutral-400">Outbound mail gateway with AES-256 encrypted credentials</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                smtpConfig?.status === 'connected'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : smtpConfig?.status === 'failed'
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
              }`}>
                {smtpConfig?.status === 'connected' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>{smtpConfig?.status === 'connected' ? 'Connected' : smtpConfig?.status === 'failed' ? 'Failed' : 'Not Tested'}</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveSmtp} className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Enable Outbound Emailing</div>
                <div className="text-[11px] text-neutral-400">Activate SMTP delivery for reader alerts and system notices</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpIsEnabled}
                  onChange={(e) => setSmtpIsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com or mail.domain.com"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Port
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="user@domain.com or API key"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Encryption Type
                </label>
                <select
                  value={smtpEncryption}
                  onChange={(e) => setSmtpEncryption(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="tls">STARTTLS / TLS (Port 587)</option>
                  <option value="ssl">SSL / SMTPS (Port 465)</option>
                  <option value="none">None / Plain (Port 25)</option>
                </select>
              </div>
            </div>

            {/* Password Field with AES-256 Shield & Eye */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  SMTP Password / App Secret
                </label>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> AES-256 Stored
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="Enter SMTP password or App Password"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                  title={showPassword ? 'Mask password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Leave unchanged to keep existing encrypted password.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  From Email
                </label>
                <input
                  type="email"
                  value={smtpFromEmail}
                  onChange={(e) => setSmtpFromEmail(e.target.value)}
                  placeholder="noreply@chronicle-daily.org"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  From Name
                </label>
                <input
                  type="text"
                  value={smtpFromName}
                  onChange={(e) => setSmtpFromName(e.target.value)}
                  placeholder="The Daily Chronicle"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Test Connection Result Box */}
            {smtpTestResult && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                smtpTestResult.success 
                  ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300' 
                  : 'bg-red-950/50 border border-red-800/80 text-red-300'
              }`}>
                {smtpTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
                <div className="space-y-0.5">
                  <div className="font-semibold">{smtpTestResult.success ? 'SMTP Connection Succeeded' : 'SMTP Connection Failed'}</div>
                  <div className="text-[11px] opacity-90">{smtpTestResult.message}</div>
                  {smtpTestResult.latencyMs !== undefined && (
                    <div className="text-[10px] font-mono text-neutral-400">Ping latency: {smtpTestResult.latencyMs}ms</div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestSmtpConnection}
                disabled={testingSmtp || !smtpHost}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                <span>{testingSmtp ? 'Testing Ping...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                disabled={savingSmtp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{savingSmtp ? 'Saving...' : 'Save SMTP Settings'}</span>
              </button>
            </div>
          </form>

          {/* Sub-box: Send Test Email */}
          <div className="border-t border-neutral-800/80 pt-4 mt-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send Test Email</span>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={testRecipientEmail}
                onChange={(e) => setTestRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTestMail || !testRecipientEmail}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {sendingTestMail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>{sendingTestMail ? 'Dispatching...' : 'Send'}</span>
              </button>
            </div>
            {testMailResult && (
              <div className={`p-2.5 rounded-lg text-xs ${
                testMailResult.success ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60' : 'bg-red-950/40 text-red-300 border border-red-800/60'
              }`}>
                {testMailResult.message}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* CARD C: GOOGLE SEARCH CONSOLE VERIFICATION */}
        {/* ==================================================== */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-950/60 border border-amber-800/60 rounded-lg text-amber-400">
                <SearchCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Google Search Console</h3>
                <p className="text-[11px] text-neutral-400">Automated HTML tag ownership verification in &lt;head&gt;</p>
              </div>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              searchConsoleCode ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
            }`}>
              {searchConsoleCode ? 'Tag Active' : 'Not Set'}
            </span>
          </div>

          <form onSubmit={handleSaveSearchConsole} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Verification Code / Token
              </label>
              <input
                type="text"
                value={searchConsoleCode}
                onChange={(e) => setSearchConsoleCode(e.target.value)}
                placeholder="e.g. 7q8XmH4kKxL990z8X7P-v1 or full <meta .../> tag"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Enter your Google Search Console verification code or token. The tag <code>&lt;meta name="google-site-verification" content="..."&gt;</code> is automatically injected into every public page.
              </p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg text-[11px] text-neutral-400 font-mono space-y-1">
              <div className="text-neutral-500 font-sans uppercase text-[10px] font-bold">Dynamic DOM Preview</div>
              <div className="text-amber-300">
                &lt;meta name="google-site-verification" content="{searchConsoleCode ? searchConsoleCode.replace(/<[^>]*>?/gm, '').trim() : 'YOUR_VERIFICATION_CODE'}" /&gt;
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSearchConsole}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingSearchConsole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{savingSearchConsole ? 'Saving...' : 'Save Verification Code'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ==================================================== */}
        {/* CARD D: ANALYTICS SETTINGS (GOOGLE ANALYTICS) */}
        {/* ==================================================== */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-950/60 border border-blue-800/60 rounded-lg text-blue-400">
                <BarChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Google Analytics (GA4)</h3>
                <p className="text-[11px] text-neutral-400">Client-side web measurement tag (gtag.js)</p>
              </div>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              analyticsEnabled && analyticsId ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
            }`}>
              {analyticsEnabled && analyticsId ? 'Tracking Active' : 'Disabled'}
            </span>
          </div>

          <form onSubmit={handleSaveAnalytics} className="space-y-4">
            <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Enable Google Analytics</div>
                <div className="text-[11px] text-neutral-400">When enabled, gtag.js loads automatically on all pages</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Google Analytics Measurement ID
              </label>
              <input
                type="text"
                value={analyticsId}
                onChange={(e) => setAnalyticsId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Example: G-XXXXXXXXXX (found under Google Analytics Data Streams).</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingAnalytics}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingAnalytics ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BarChart className="w-3.5 h-3.5" />}
                <span>{savingAnalytics ? 'Saving...' : 'Save Analytics Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ==================================================== */}
        {/* CARD E: META PIXEL SETTINGS */}
        {/* ==================================================== */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-950/60 border border-purple-800/60 rounded-lg text-purple-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Meta Pixel (Facebook Pixel)</h3>
                <p className="text-[11px] text-neutral-400">Audience tracking and conversion analytics script</p>
              </div>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              pixelEnabled && pixelId ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
            }`}>
              {pixelEnabled && pixelId ? 'Pixel Active' : 'Disabled'}
            </span>
          </div>

          <form onSubmit={handleSavePixel} className="space-y-4">
            <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Enable Meta Pixel</div>
                <div className="text-[11px] text-neutral-400">Loads fbevents.js and records PageView events</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pixelEnabled}
                  onChange={(e) => setPixelEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Meta Pixel ID
              </label>
              <input
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="e.g. 123456789012345"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Your 15-16 digit Meta Pixel Dataset identifier.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPixel}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingPixel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{savingPixel ? 'Saving...' : 'Save Meta Pixel'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ==================================================== */}
        {/* CARD F: GOOGLE ADSENSE SETTINGS */}
        {/* ==================================================== */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Google AdSense Publisher</h3>
                <p className="text-[11px] text-neutral-400">Global auto-ads and verified publisher script</p>
              </div>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              adsenseEnabled && adsenseId ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
            }`}>
              {adsenseEnabled && adsenseId ? 'AdSense Active' : 'Disabled'}
            </span>
          </div>

          <form onSubmit={handleSaveAdsense} className="space-y-4">
            <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Enable Google AdSense</div>
                <div className="text-[11px] text-neutral-400">Loads adsbygoogle.js globally with your publisher client ID</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adsenseEnabled}
                  onChange={(e) => setAdsenseEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Publisher ID (ca-pub-...)
              </label>
              <input
                type="text"
                value={adsenseId}
                onChange={(e) => setAdsenseId(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Example: ca-pub-1234567890123456 (found in Google AdSense Account info).</p>
            </div>

            <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-3 text-[11px] text-neutral-400 leading-relaxed">
              <strong className="text-neutral-300">Monetization Integrity:</strong> Enabling Google AdSense provides global publisher verification. All existing custom placements (Header 728×90, Sidebar, In-Content, Native, and Skip-Ad) continue working uninterrupted.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingAdsense}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingAdsense ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
                <span>{savingAdsense ? 'Saving...' : 'Save AdSense Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
