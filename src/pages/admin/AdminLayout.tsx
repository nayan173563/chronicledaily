import React, { useState } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { 
  LayoutDashboard, 
  PenTool, 
  FileText, 
  Layers, 
  Image as ImageIcon, 
  Megaphone, 
  Cloud,
  Server,
  Settings, 
  SearchCode, 
  BarChart3, 
  UserCircle, 
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Shield,
  Sun,
  Moon
} from 'lucide-react';

export type AdminTab = 
  | 'dashboard' 
  | 'create_content' 
  | 'all_posts' 
  | 'categories' 
  | 'media_library' 
  | 'ad_manager' 
  | 'cloud_services'
  | 'deployment_settings'
  | 'website_settings' 
  | 'seo_settings' 
  | 'analytics' 
  | 'profile';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigateHome,
  children,
}) => {
  const { adminUser, logoutAdmin, settings } = useWebsite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin Theme Mode: 'dark' (Default Dark Mode) | 'light' (Normal Mode)
  const [adminTheme, setAdminTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('chronicle_admin_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setAdminTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('chronicle_admin_theme', nextTheme);
      } catch {}
      return nextTheme;
    });
  };

  // Ensure zero popunders can ever execute or remain inside Admin Workspace
  React.useEffect(() => {
    document.querySelectorAll('script[data-popunder="true"], script[src*="profitableratecpmnetwork"], script[src*="popunder"]').forEach((el) => el.remove());
    const originalOpen = window.open;
    window.open = () => null;
    return () => {
      window.open = originalOpen;
    };
  }, []);

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create_content' as AdminTab, label: 'Create Content', icon: PenTool },
    { id: 'all_posts' as AdminTab, label: 'All Posts', icon: FileText },
    { id: 'categories' as AdminTab, label: 'Categories', icon: Layers },
    { id: 'media_library' as AdminTab, label: 'Media Library', icon: ImageIcon },
    { id: 'ad_manager' as AdminTab, label: 'Advertisement Manager', icon: Megaphone },
    { id: 'cloud_services' as AdminTab, label: 'Cloud Services', icon: Cloud },
    { id: 'deployment_settings' as AdminTab, label: 'Deployment Settings', icon: Server },
    { id: 'website_settings' as AdminTab, label: 'Website Settings', icon: Settings },
    { id: 'seo_settings' as AdminTab, label: 'SEO Settings', icon: SearchCode },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
    { id: 'profile' as AdminTab, label: 'Profile', icon: UserCircle },
  ];

  const currentTabItem = navItems.find((item) => item.id === currentTab);

  const handleTabClick = (tab: AdminTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${
        adminTheme === 'light' ? 'admin-theme-light bg-slate-50 text-slate-900' : 'admin-theme-dark bg-neutral-900 text-neutral-100'
      }`}
    >
      {/* ============================================================ */}
      {/* 1. ADMIN SIDEBAR                                            */}
      {/* ============================================================ */}
      
      {/* Mobile Top Strip */}
      <div className="md:hidden bg-neutral-950 border-b border-neutral-800 p-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-serif font-bold text-sm text-white">
            {settings?.website_name || 'Chronicle'} Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
            title={`Switch to ${adminTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
          >
            {adminTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            onClick={logoutAdmin}
            title="Log Out"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-400 hover:text-white bg-red-950/60 border border-red-900/60 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md bg-neutral-900 text-neutral-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`w-full md:w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0 ${
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="font-serif text-lg font-bold tracking-tight text-white truncate max-w-[170px]">
              {settings?.website_name || 'The Daily Chronicle'}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-red-500 font-bold">
              Editorial Console
            </div>
          </div>
          <button
            onClick={onNavigateHome}
            title="View Live Portal"
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* User profile, Theme Switcher & Logout */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80">
          {/* Appearance Mode Switcher */}
          <div className="flex items-center justify-between p-2 mb-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
            <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
              {adminTheme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>Mode</span>
            </span>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-200 transition-colors cursor-pointer border border-neutral-700"
            >
              <span>{adminTheme === 'dark' ? 'Dark' : 'Light'}</span>
              <span className="text-[9px] text-neutral-400">(Switch)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-hidden mb-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-200 shrink-0">
              {adminUser?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {adminUser?.name || adminUser?.username || 'Admin'}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono truncate">
                @{adminUser?.username || 'admin'}
              </div>
            </div>
          </div>

          {/* Prominent Sidebar Logout Button */}
          <button
            onClick={logoutAdmin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs active:scale-98"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN ADMIN WORKSPACE                                      */}
      {/* ============================================================ */}
      <main className="flex-1 min-w-0 bg-neutral-900 overflow-y-auto flex flex-col">
        {/* Workspace Top Sticky Navigation Header */}
        <header className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight">
              {currentTabItem?.label || 'Dashboard'}
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
              Admin Portal
            </span>
          </div>

          {/* Top Actions: Theme Switcher, View Site & Log Out (Hidden on mobile devices; visible on desktop) */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle (Dark Mode / Light Mode) */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                adminTheme === 'light'
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
              title={`Switch to ${adminTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
            >
              {adminTheme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={onNavigateHome}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <span>View Live Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Top Bar Log Out Button */}
            <button
              onClick={logoutAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:text-white bg-red-950/50 hover:bg-red-600 border border-red-900/60 hover:border-red-600 rounded-lg transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
              title="End session and log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
