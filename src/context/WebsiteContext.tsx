import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebsiteSettings, Category, Ad, AdminUser } from '../types';
import { api, tokenStorage } from '../services/api';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface WebsiteContextType {
  settings: WebsiteSettings | null;
  categories: Category[];
  ads: Ad[];
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshAds: () => Promise<void>;
  loginAdmin: (token: string, user: AdminUser) => void;
  logoutAdmin: () => void;
  updateAdminUser: (user: AdminUser) => void;
  getAdByPosition: (position: string) => Ad | undefined;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
  confirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }) => void;
}

const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined);

export const WebsiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const toast = {
    success: (msg: string) => showToast('success', msg),
    error: (msg: string) => showToast('error', msg),
    info: (msg: string) => showToast('info', msg),
  };

  const confirm = (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        options.onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      applyThemeVariables(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const refreshCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const refreshAds = async () => {
    try {
      const data = await api.getAds();
      setAds(data);
    } catch (err) {
      console.error('Failed to load ads:', err);
    }
  };

  const checkAuth = async () => {
    const token = tokenStorage.get();
    if (!token) return;
    try {
      const { user } = await api.getMe();
      setAdminUser(user);
    } catch {
      tokenStorage.clear();
      setAdminUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.allSettled([
        refreshSettings(),
        refreshCategories(),
        refreshAds(),
        checkAuth(),
      ]);
      setIsLoading(false);
    };
    init();
  }, []);

  const applyThemeVariables = (s: WebsiteSettings) => {
    const root = document.documentElement;
    if (s.primary_color) root.style.setProperty('--color-primary', s.primary_color);
    if (s.secondary_color) root.style.setProperty('--color-secondary', s.secondary_color);
    if (s.accent_color) root.style.setProperty('--color-accent', s.accent_color);

    // Dynamic font switching
    let fontHeading = "'Playfair Display', serif";
    let fontBody = "'Plus Jakarta Sans', sans-serif";

    if (s.font_family === 'instrument') {
      fontHeading = "'Instrument Serif', serif";
      fontBody = "'Plus Jakarta Sans', sans-serif";
    } else if (s.font_family === 'merriweather') {
      fontHeading = "'Merriweather', serif";
      fontBody = "'Inter', sans-serif";
    } else if (s.font_family === 'sans') {
      fontHeading = "'Plus Jakarta Sans', sans-serif";
      fontBody = "'Inter', sans-serif";
    }

    root.style.setProperty('--font-heading', fontHeading);
    root.style.setProperty('--font-body', fontBody);

    // Favicon update
    if (s.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = s.favicon_url;
    }
  };

  const loginAdmin = (token: string, user: AdminUser) => {
    tokenStorage.set(token);
    setAdminUser(user);
  };

  const logoutAdmin = () => {
    tokenStorage.clear();
    setAdminUser(null);
  };

  const updateAdminUser = (user: AdminUser) => {
    setAdminUser(user);
  };

  const getAdByPosition = (position: string): Ad | undefined => {
    return ads.find((a) => a.position === position && a.is_active);
  };

  return (
    <WebsiteContext.Provider
      value={{
        settings,
        categories,
        ads,
        adminUser,
        isAdminLoggedIn: Boolean(adminUser),
        isLoading,
        refreshSettings,
        refreshCategories,
        refreshAds,
        loginAdmin,
        logoutAdmin,
        updateAdminUser,
        getAdByPosition,
        toast,
        confirm,
      }}
    >
      {children}

      {/* In-App Toast Notifications (Avoids window.alert) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-xl border text-xs font-medium transition-all transform animate-in fade-in slide-in-from-top-2 ${
              t.type === 'success'
                ? 'bg-neutral-900 text-white border-emerald-500/50'
                : t.type === 'error'
                ? 'bg-neutral-900 text-white border-red-500/50'
                : 'bg-neutral-900 text-white border-neutral-700'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
            <span className="flex-1 leading-relaxed">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* In-App Confirm Modal (Avoids window.confirm) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-neutral-200 p-6 text-neutral-900 animate-in fade-in zoom-in-95">
            <h3 className="font-serif font-bold text-lg text-neutral-950 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer"
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors cursor-pointer"
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </WebsiteContext.Provider>
  );
};

export const useWebsite = () => {
  const context = useContext(WebsiteContext);
  if (!context) {
    throw new Error('useWebsite must be used within a WebsiteProvider');
  }
  return context;
};
