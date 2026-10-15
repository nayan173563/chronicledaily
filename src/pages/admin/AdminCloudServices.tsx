import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { 
  Cloud, 
  Database, 
  Image as ImageIcon, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Key, 
  Folder, 
  Layers, 
  FileCode, 
  Activity, 
  Sparkles, 
  AlertTriangle,
  Flame,
  Box,
  HardDrive,
  CloudFog,
  ServerCog
} from 'lucide-react';
import { SupabaseConfigView, CloudinaryConfigView, CloudServiceAuditLog, CloudServiceStatus } from '../../types';

export const AdminCloudServices: React.FC = () => {
  const { toast } = useWebsite();

  const [loading, setLoading] = useState(true);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfigView | null>(null);
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfigView | null>(null);
  const [auditLogs, setAuditLogs] = useState<CloudServiceAuditLog[]>([]);

  // Supabase Form State
  const [sbUrl, setSbUrl] = useState('');
  const [sbProjectId, setSbProjectId] = useState('');
  const [sbAnonKey, setSbAnonKey] = useState('');
  const [sbServiceRoleKey, setSbServiceRoleKey] = useState('');
  const [sbSchema, setSbSchema] = useState('public');
  const [sbIsEnabled, setSbIsEnabled] = useState(true);
  const [showSbAnonKey, setShowSbAnonKey] = useState(false);
  const [showSbServiceKey, setShowSbServiceKey] = useState(false);
  const [savingSb, setSavingSb] = useState(false);
  const [testingSb, setTestingSb] = useState(false);
  const [sbTestResult, setSbTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  // Cloudinary Form State
  const [cldCloudName, setCldCloudName] = useState('');
  const [cldApiKey, setCldApiKey] = useState('');
  const [cldApiSecret, setCldApiSecret] = useState('');
  const [cldUploadPreset, setCldUploadPreset] = useState('');
  const [cldFolderName, setCldFolderName] = useState('chronicle_news');
  const [cldIsEnabled, setCldIsEnabled] = useState(true);
  const [showCldSecret, setShowCldSecret] = useState(false);
  const [savingCld, setSavingCld] = useState(false);
  const [testingCld, setTestingCld] = useState(false);
  const [cldTestResult, setCldTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const fetchCloudServices = async () => {
    try {
      setLoading(true);
      const res = await api.getCloudServices();
      setSupabaseConfig(res.supabase);
      setCloudinaryConfig(res.cloudinary);
      setAuditLogs(res.audit_logs || []);

      // Populate Supabase form
      if (res.supabase) {
        setSbUrl(res.supabase.project_url || '');
        setSbProjectId(res.supabase.project_id || '');
        setSbAnonKey(res.supabase.anon_key || '');
        setSbServiceRoleKey(res.supabase.service_role_key_masked || '');
        setSbSchema(res.supabase.schema || 'public');
        setSbIsEnabled(res.supabase.is_enabled ?? true);
      }

      // Populate Cloudinary form
      if (res.cloudinary) {
        setCldCloudName(res.cloudinary.cloud_name || '');
        setCldApiKey(res.cloudinary.api_key || '');
        setCldApiSecret(res.cloudinary.api_secret_masked || '');
        setCldUploadPreset(res.cloudinary.upload_preset || '');
        setCldFolderName(res.cloudinary.folder_name || 'chronicle_news');
        setCldIsEnabled(res.cloudinary.is_enabled ?? true);
      }
    } catch (err: any) {
      console.error('Failed to load cloud services:', err);
      toast.error(`Failed to load cloud settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudServices();
  }, []);

  // ----------------------------------------------------
  // SUPABASE HANDLERS
  // ----------------------------------------------------

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl.trim()) {
      toast.error('Supabase Project URL is required');
      return;
    }

    try {
      setSavingSb(true);
      const res = await api.saveSupabaseConfig({
        project_url: sbUrl.trim(),
        project_id: sbProjectId.trim(),
        anon_key: sbAnonKey.trim(),
        service_role_key: sbServiceRoleKey.trim(),
        schema: sbSchema.trim() || 'public',
        is_enabled: sbIsEnabled,
      });

      setSupabaseConfig(res.config);
      setSbServiceRoleKey(res.config.service_role_key_masked);
      setShowSbServiceKey(false);
      toast.success('Supabase configuration saved & dynamic client switched!');
      
      // Refresh audit logs
      const logs = await api.getCloudAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSavingSb(false);
    }
  };

  const handleTestSupabase = async () => {
    try {
      setTestingSb(true);
      setSbTestResult(null);
      const res = await api.testSupabase({
        project_url: sbUrl.trim(),
        anon_key: sbAnonKey.trim(),
        service_role_key: sbServiceRoleKey.trim(),
        schema: sbSchema.trim() || 'public',
      });

      setSbTestResult(res);
      if (res.success) {
        toast.success(`Supabase connection verified! (${res.latencyMs || 0}ms)`);
        setSupabaseConfig(prev => prev ? { ...prev, status: 'connected', last_tested_at: new Date().toISOString() } : null);
      } else {
        toast.error(`Connection check failed: ${res.message}`);
        setSupabaseConfig(prev => prev ? { ...prev, status: 'failed', last_tested_at: new Date().toISOString() } : null);
      }

      const logs = await api.getCloudAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setSbTestResult({ success: false, message: err.message });
      toast.error(`Test execution failed: ${err.message}`);
    } finally {
      setTestingSb(false);
    }
  };

  // ----------------------------------------------------
  // CLOUDINARY HANDLERS
  // ----------------------------------------------------

  const handleSaveCloudinary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cldCloudName.trim() || !cldApiKey.trim()) {
      toast.error('Cloud Name and API Key are required');
      return;
    }

    try {
      setSavingCld(true);
      const res = await api.saveCloudinaryConfig({
        cloud_name: cldCloudName.trim(),
        api_key: cldApiKey.trim(),
        api_secret: cldApiSecret.trim(),
        upload_preset: cldUploadPreset.trim(),
        folder_name: cldFolderName.trim() || 'chronicle_news',
        is_enabled: cldIsEnabled,
      });

      setCloudinaryConfig(res.config);
      setCldApiSecret(res.config.api_secret_masked);
      setShowCldSecret(false);
      toast.success('Cloudinary configuration saved & active account switched!');

      const logs = await api.getCloudAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSavingCld(false);
    }
  };

  const handleTestCloudinary = async () => {
    try {
      setTestingCld(true);
      setCldTestResult(null);
      const res = await api.testCloudinary({
        cloud_name: cldCloudName.trim(),
        api_key: cldApiKey.trim(),
        api_secret: cldApiSecret.trim(),
        folder_name: cldFolderName.trim(),
      });

      setCldTestResult(res);
      if (res.success) {
        toast.success(`Cloudinary ping verified! (${res.latencyMs || 0}ms)`);
        setCloudinaryConfig(prev => prev ? { ...prev, status: 'connected', last_tested_at: new Date().toISOString() } : null);
      } else {
        toast.error(`Cloudinary check failed: ${res.message}`);
        setCloudinaryConfig(prev => prev ? { ...prev, status: 'failed', last_tested_at: new Date().toISOString() } : null);
      }

      const logs = await api.getCloudAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setCldTestResult({ success: false, message: err.message });
      toast.error(`Test execution failed: ${err.message}`);
    } finally {
      setTestingCld(false);
    }
  };

  const renderStatusBadge = (status?: CloudServiceStatus, testing = false) => {
    if (testing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Testing Connection...
        </span>
      );
    }

    if (status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Connected
        </span>
      );
    }

    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
        <Clock className="w-3 h-3" />
        Not Configured
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
        <RefreshCw className="w-8 h-8 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Decrypting & Loading Runtime Cloud Architecture...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-600/10 text-red-400 border border-red-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              AES-256 Encrypted Runtime Engine • Zero Downtime
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Cloud Services & Dynamic Infrastructure
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Switch Supabase projects and Cloudinary accounts on-the-fly directly from this dashboard.
              Credentials are encrypted using AES-256 and applied instantly without editing code, modifying <code className="text-neutral-300">.env</code>, or redeploying the application.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchCloudServices}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-neutral-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-800/80">
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Active Database</div>
            <div className="text-sm font-semibold text-white mt-1 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              {supabaseConfig?.status === 'connected' ? 'Supabase PostgreSQL' : 'Local Persistent Storage'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Media Engine</div>
            <div className="text-sm font-semibold text-white mt-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              {cloudinaryConfig?.status === 'connected' ? `Cloudinary (${cloudinaryConfig.cloud_name})` : 'Local Disk /uploads'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Key Security</div>
            <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              AES-256-GCM / PBKDF2
            </div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Server Role Key</div>
            <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              Server-Side Only (Never Exposed)
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Card 1 (Supabase) & Card 2 (Cloudinary) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ==================================================== */}
        {/* CARD 1: SUPABASE CONFIGURATION                       */}
        {/* ==================================================== */}
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="p-6 border-b border-neutral-800 bg-neutral-950/70 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-serif">Supabase Configuration</h2>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  PostgreSQL database, real-time subscriptions & backend auth
                </p>
              </div>
            </div>
            <div>
              {renderStatusBadge(supabaseConfig?.status, testingSb)}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveSupabase} className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Project URL */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Supabase Project URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={sbUrl}
                    onChange={(e) => {
                      setSbUrl(e.target.value);
                      try {
                        const parsed = new URL(e.target.value);
                        const host = parsed.hostname.split('.')[0];
                        if (host) setSbProjectId(host);
                      } catch {
                        // ignore parsing error
                      }
                    }}
                    required
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Found in your Supabase Dashboard under Project Settings &gt; API
                </p>
              </div>

              {/* Project ID & Schema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Supabase Project ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. jxlywopgq..."
                    value={sbProjectId}
                    onChange={(e) => setSbProjectId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Database Schema
                  </label>
                  <input
                    type="text"
                    placeholder="public"
                    value={sbSchema}
                    onChange={(e) => setSbSchema(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Supabase Anon Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Supabase Anon Key (Public)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSbAnonKey(!showSbAnonKey)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showSbAnonKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showSbAnonKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSbAnonKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={sbAnonKey}
                    onChange={(e) => setSbAnonKey(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Supabase Service Role Key */}
              <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-red-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <label className="text-xs font-semibold text-neutral-200">
                      Supabase Service Role Key
                    </label>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                      Server-Only
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSbServiceKey(!showSbServiceKey)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showSbServiceKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showSbServiceKey ? 'Reveal' : 'Mask'}
                  </button>
                </div>
                <input
                  type={showSbServiceKey ? 'text' : 'password'}
                  placeholder={supabaseConfig?.has_service_role_key ? '•••••••••••••••••••••••••••••• (Stored & Encrypted)' : 'Paste service_role secret...'}
                  value={sbServiceRoleKey}
                  onChange={(e) => setSbServiceRoleKey(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono"
                />
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Bypasses Row-Level Security for administrative synchronization. Never exposed to browser or client scripts.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-neutral-800">
                <div>
                  <div className="text-xs font-semibold text-white">Enable Dynamic Supabase Client</div>
                  <div className="text-[11px] text-neutral-400">Routes live backend database calls through this Supabase project</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sbIsEnabled}
                    onChange={(e) => setSbIsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Test Connection Result Box */}
              {sbTestResult && (
                <div className={`p-3 rounded-lg border text-xs ${
                  sbTestResult.success 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                    : 'bg-red-950/30 border-red-500/30 text-red-300'
                }`}>
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    {sbTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    {sbTestResult.success ? 'Supabase Live Verification Succeeded' : 'Supabase Verification Notice'}
                  </div>
                  <p className="text-[11px] opacity-90">{sbTestResult.message}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions & Metadata */}
            <div className="pt-5 border-t border-neutral-800 mt-6 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {supabaseConfig?.updated_at 
                    ? `Last updated: ${new Date(supabaseConfig.updated_at).toLocaleString()}` 
                    : 'Never updated'}
                </span>
                <span>By: {supabaseConfig?.updated_by || 'system'}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={testingSb || !sbUrl}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {testingSb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-emerald-400" />}
                  {testingSb ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  type="submit"
                  disabled={savingSb}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingSb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {savingSb ? 'Applying AES...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ==================================================== */}
        {/* CARD 2: CLOUDINARY CONFIGURATION                     */}
        {/* ==================================================== */}
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="p-6 border-b border-neutral-800 bg-neutral-950/70 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-serif">Cloudinary Configuration</h2>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  High-speed global media CDN, image compression & asset uploads
                </p>
              </div>
            </div>
            <div>
              {renderStatusBadge(cloudinaryConfig?.status, testingCld)}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveCloudinary} className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Cloud Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Cloud Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. daily-chronicle-news"
                  value={cldCloudName}
                  onChange={(e) => setCldCloudName(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors font-mono"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Your Cloudinary unique cloud identifier
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Cloudinary API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 849281729481923"
                  value={cldApiKey}
                  onChange={(e) => setCldApiKey(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {/* API Secret (Encrypted) */}
              <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-sky-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    <label className="text-xs font-semibold text-neutral-200">
                      Cloudinary API Secret <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                      Server-Only
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCldSecret(!showCldSecret)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showCldSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showCldSecret ? 'Reveal' : 'Mask'}
                  </button>
                </div>
                <input
                  type={showCldSecret ? 'text' : 'password'}
                  placeholder={cloudinaryConfig?.has_api_secret ? '•••••••••••••••••••••••• (Stored & Encrypted)' : 'Paste Cloudinary API Secret...'}
                  value={cldApiSecret}
                  onChange={(e) => setCldApiSecret(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Encrypted at rest using AES-256. Decrypted strictly in memory on the server during upload requests.
                </p>
              </div>

              {/* Upload Preset & Folder Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Default Folder Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="chronicle_news"
                      value={cldFolderName}
                      onChange={(e) => setCldFolderName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Upload Preset (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. news_uploads"
                    value={cldUploadPreset}
                    onChange={(e) => setCldUploadPreset(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-neutral-800">
                <div>
                  <div className="text-xs font-semibold text-white">Enable Cloudinary Media Storage</div>
                  <div className="text-[11px] text-neutral-400">All newly uploaded images & videos will automatically upload to this cloud</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cldIsEnabled}
                    onChange={(e) => setCldIsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Test Connection Result Box */}
              {cldTestResult && (
                <div className={`p-3 rounded-lg border text-xs ${
                  cldTestResult.success 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                    : 'bg-red-950/30 border-red-500/30 text-red-300'
                }`}>
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    {cldTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    {cldTestResult.success ? 'Cloudinary Verification Succeeded' : 'Cloudinary Verification Notice'}
                  </div>
                  <p className="text-[11px] opacity-90">{cldTestResult.message}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions & Metadata */}
            <div className="pt-5 border-t border-neutral-800 mt-6 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {cloudinaryConfig?.updated_at 
                    ? `Last updated: ${new Date(cloudinaryConfig.updated_at).toLocaleString()}` 
                    : 'Never updated'}
                </span>
                <span>By: {cloudinaryConfig?.updated_by || 'system'}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestCloudinary}
                  disabled={testingCld || !cldCloudName || !cldApiKey}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {testingCld ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-sky-400" />}
                  {testingCld ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  type="submit"
                  disabled={savingCld}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingCld ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {savingCld ? 'Applying AES...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ==================================================== */}
      {/* EXTENSIBLE FUTURE CLOUD SERVICES SECTION             */}
      {/* ==================================================== */}
      <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              <ServerCog className="w-4 h-4 text-red-500" />
              Modular Cloud Architecture (Future Services Ready)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              The <code className="text-neutral-300 font-mono">system_settings</code> schema allows slotting new cloud providers seamlessly without changing code.
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
            Pre-Architected Slots
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Firebase Suite</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Firestore, Auth & Edge</div>
              <div className="mt-2 text-[10px] text-amber-400/80 font-medium">Ready for schema mapping</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Amazon S3</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">AWS Bucket & CloudFront</div>
              <div className="mt-2 text-[10px] text-orange-400/80 font-medium">Ready for schema mapping</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Google Drive API</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Workspace Archive Storage</div>
              <div className="mt-2 text-[10px] text-blue-400/80 font-medium">Ready for schema mapping</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <CloudFog className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">DigitalOcean Spaces</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">S3-Compatible Object Store</div>
              <div className="mt-2 text-[10px] text-cyan-400/80 font-medium">Ready for schema mapping</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* AUDIT LOG & COMPLIANCE HISTORY                       */}
      {/* ==================================================== */}
      <div className="rounded-xl bg-neutral-950 border border-neutral-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">Security & Runtime Audit Log</h3>
              <p className="text-xs text-neutral-400">Chronological ledger of credentials changes, connection audits & upload events</p>
            </div>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {auditLogs.length} events logged
          </span>
        </div>

        <div className="divide-y divide-neutral-800/60 max-h-80 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No audit records recorded yet. Configuration updates and connection checks will be logged here.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-neutral-900/30 transition-colors flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                        {log.service_name}
                      </span>
                      <span className="font-medium text-neutral-300">
                        Action: {log.action.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-neutral-400 mt-1 text-[11px] leading-relaxed break-all">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-neutral-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    by @{log.performed_by}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
