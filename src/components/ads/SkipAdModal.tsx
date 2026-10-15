import React, { useState, useEffect } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { Post } from '../../types';
import { Lock, ExternalLink, Sparkles } from 'lucide-react';

interface SkipAdModalProps {
  post?: Post;
  postId?: string;
  onUnlocked?: () => void;
  previewOpacity?: number;
  previewMode?: boolean;
  onClosePreview?: () => void;
}

const DEFAULT_SMART_LINK = 'https://www.profitableratecpmnetwork.com/u7c83wtb?key=8ad40353f84fe993feb17e6ca4a03326';
export const GLOBAL_UNLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const GLOBAL_UNLOCK_KEY = 'chronicle_all_posts_unlocked_until';

/**
 * Checks whether the global unlock pass is currently active
 */
export const isAllPostsUnlocked = (): boolean => {
  try {
    const expiry = Number(localStorage.getItem(GLOBAL_UNLOCK_KEY) || 0);
    if (expiry > Date.now()) {
      return true;
    }
    if (expiry > 0 && expiry <= Date.now()) {
      localStorage.removeItem(GLOBAL_UNLOCK_KEY);
    }
  } catch {}
  return false;
};

/**
 * Unlocks ALL posts across the website for the reader
 */
export const setAllPostsUnlockedFor6Hours = () => {
  try {
    const expiryTime = Date.now() + GLOBAL_UNLOCK_DURATION_MS;
    localStorage.setItem(GLOBAL_UNLOCK_KEY, String(expiryTime));
    document.cookie = `chronicle_all_posts_unlocked_until=${expiryTime}; path=/; max-age=${24 * 60 * 60}`;

    // Broadcast across tabs
    try {
      const channel = new BroadcastChannel('chronicle_unlock_channel');
      channel.postMessage({ type: 'ALL_UNLOCKED', expiryTime });
      channel.close();
    } catch {}

    window.dispatchEvent(new Event('storage'));
  } catch {}
};

export const SkipAdModal: React.FC<SkipAdModalProps> = ({ 
  post,
  postId, 
  onUnlocked,
  previewOpacity,
  previewMode = false,
  onClosePreview 
}) => {
  const { settings } = useWebsite();

  const effectivePostId = post?.id || postId;
  const effectiveSlug = post?.slug || '';

  // Synchronously check if all posts are unlocked for 6 hours or this post is passed
  const checkIsUnlocked = (): boolean => {
    if (previewMode) return false;

    // 1. Check 6-Hour Global Pass (Unlocks ALL posts across the website)
    if (isAllPostsUnlocked()) {
      return true;
    }

    // 2. Check legacy / session passes
    if (effectivePostId) {
      try {
        if (sessionStorage.getItem(`unlocked_post_${effectivePostId}`) === 'true') {
          return true;
        }
        const storedTime = localStorage.getItem(`unlocked_time_${effectivePostId}`);
        if (storedTime && Date.now() - Number(storedTime) < GLOBAL_UNLOCK_DURATION_MS) {
          return true;
        }
      } catch {}
    }

    return false;
  };

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => checkIsUnlocked());

  // Listen to cross-tab unlock broadcasts and storage changes
  useEffect(() => {
    if (previewMode) return;

    const handleStorageChange = () => {
      const unlocked = checkIsUnlocked();
      setIsUnlocked(unlocked);
      if (unlocked && onUnlocked) onUnlocked();
    };

    window.addEventListener('storage', handleStorageChange);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('chronicle_unlock_channel');
      channel.onmessage = (e) => {
        if (e.data?.type === 'ALL_UNLOCKED') {
          setIsUnlocked(true);
          if (onUnlocked) onUnlocked();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, [onUnlocked, previewMode]);

  // Ensure state resets accurately when switching between different articles
  useEffect(() => {
    if (previewMode || !effectivePostId) return;

    const unlockedState = checkIsUnlocked();
    setIsUnlocked(unlockedState);
    if (unlockedState && onUnlocked) {
      onUnlocked();
    }
  }, [effectivePostId, effectiveSlug, previewMode]);

  if (!previewMode && (!settings?.skip_ad_enabled || isUnlocked)) {
    return null;
  }

  // Normalize opacity from settings (e.g. 0.7 or 70)
  const rawOpacity = previewOpacity !== undefined 
    ? previewOpacity 
    : (settings?.skip_ad_opacity !== undefined ? Number(settings.skip_ad_opacity) : 0.88);

  const parsed = Number(rawOpacity);
  const normalizedOpacity = !isNaN(parsed)
    ? (parsed > 1 ? parsed / 100 : parsed)
    : 0.88;
  const clampedOpacity = Math.max(0, Math.min(1, normalizedOpacity));

  const smartLink = settings?.skip_ad_link || DEFAULT_SMART_LINK;

  const handleSkipAdClick = () => {
    if (previewMode) {
      if (onClosePreview) onClosePreview();
      return;
    }

    // Unlocks ALL posts for the next 6 hours!
    setAllPostsUnlockedFor6Hours();

    if (effectivePostId) {
      try {
        sessionStorage.setItem(`unlocked_post_${effectivePostId}`, 'true');
        localStorage.setItem(`unlocked_time_${effectivePostId}`, String(Date.now()));
        localStorage.setItem(`unlocked_post_${effectivePostId}`, 'true');
      } catch {}
    }

    // Reveal full article
    setIsUnlocked(true);
    if (onUnlocked) onUnlocked();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-2.5 sm:p-6 transition-colors duration-300"
      style={{
        backgroundColor: `rgba(15, 23, 42, ${clampedOpacity})`,
      }}
    >
      {/* Modal Card - Compact on mobile, full-size on tablet & desktop */}
      <div className="relative w-[85%] max-w-[280px] sm:w-full sm:max-w-md my-auto bg-neutral-900/95 border border-neutral-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center text-white shadow-2xl backdrop-blur-xl transition-all">
        {/* Preview close button */}
        {previewMode && onClosePreview && (
          <button
            type="button"
            onClick={onClosePreview}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] sm:text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded cursor-pointer"
          >
            Close Preview ✕
          </button>
        )}

        {/* Circular Gold Lock Indicator */}
        <div className="w-9 h-9 sm:w-14 sm:h-14 mx-auto mb-2.5 sm:mb-4 rounded-full bg-neutral-800/90 border border-neutral-700/80 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
          <Lock className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
        </div>

        {/* Title */}
        <h3 className="font-serif text-sm sm:text-2xl font-bold tracking-tight mb-1 sm:mb-2 text-neutral-100">
          Exclusive Article Content
        </h3>
        
        {/* Description */}
        <p className="text-[10px] sm:text-sm text-neutral-300 mb-3 sm:mb-6 leading-snug sm:leading-relaxed max-w-[230px] sm:max-w-sm mx-auto">
          This comprehensive dispatch is supported by our sponsor network. Click Skip Ad below to unlock and continue reading.
        </p>

        {/* Direct Red SKIP AD Button */}
        <a
          href={smartLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSkipAdClick}
          className="w-full group relative inline-flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 sm:py-3.5 sm:px-8 text-[11px] sm:text-sm font-bold tracking-wider uppercase text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg sm:rounded-xl shadow-lg shadow-red-600/30 transition-all transform active:scale-98 cursor-pointer select-none min-h-[36px] sm:min-h-[46px]"
        >
          <span>SKIP AD</span>
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-90 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </a>

        {/* Prompt below button */}
        <p className="mt-2 sm:mt-3 text-[9px] sm:text-xs text-neutral-400 font-medium leading-tight flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Instant free reader pass</span>
        </p>

        {/* Footer */}
        <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[8px] sm:text-xs text-neutral-500">
          <span className="truncate max-w-[60%] text-left">
            {settings?.website_name || 'The Daily Chronicle'} Gate
          </span>
          <span className="text-neutral-400 font-mono shrink-0">100% Free Access</span>
        </div>
      </div>
    </div>
  );
};
