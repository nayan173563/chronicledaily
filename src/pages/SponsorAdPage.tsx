import React, { useState, useEffect, useRef } from 'react';
import { useWebsite } from '../context/WebsiteContext';
import { api } from '../services/api';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';
import { setAllPostsUnlockedFor6Hours } from '../components/ads/SkipAdModal';

interface SponsorAdPageProps {
  postId: string;
  slug: string;
  returnUrl?: string;
  onBackToArticle?: () => void;
}

const DEFAULT_SMART_LINK = 'https://www.profitableratecpmnetwork.com/u7c83wtb?key=8ad40353f84fe993feb17e6ca4a03326';

export const SponsorAdPage: React.FC<SponsorAdPageProps> = ({
  postId,
  slug,
  returnUrl,
  onBackToArticle,
}) => {
  const { settings } = useWebsite();
  const [secondsLeft, setSecondsLeft] = useState<number>(10);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const hasFinishedRef = useRef(false);

  const effectiveReturnUrl = returnUrl || (slug ? `/post/${slug}` : '/');
  const smartLink = settings?.skip_ad_link || DEFAULT_SMART_LINK;
  const websiteName = settings?.website_name || 'Sportzfy';

  // 1. Initialize server-authoritative unlock session
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        if (postId) {
          const res = await api.startUnlockSession(postId);
          if (isMounted && res.sessionId) {
            setSessionId(res.sessionId);
          }
        }
      } catch (err: any) {
        console.warn('[SponsorAdPage] Unable to start server unlock session:', err);
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, [postId]);

  // 2. 10-Second Live Countdown Timer (Closing in 10s)
  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        handleCompleteUnlock();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  // 3. Complete Unlock & Return to Post Page
  const handleCompleteUnlock = async () => {
    try {
      if (sessionId && postId) {
        await api.verifyUnlockSession(sessionId, postId);
      }
    } catch (err: any) {
      console.warn('[SponsorAdPage] Verification notice:', err?.message);
    } finally {
      // Mark as unlocked in sessionStorage, localStorage, and cookies across all identifiers
      const keys = [postId, slug].filter(Boolean);
      for (const k of keys) {
        try {
          sessionStorage.setItem(`unlocked_post_${k}`, 'true');
          localStorage.setItem(`unlocked_post_${k}`, 'true');
          document.cookie = `unlocked_post_${k}=true; path=/; max-age=86400`;
        } catch {}
      }
      try {
        setAllPostsUnlockedFor6Hours();
        localStorage.setItem('chronicle_last_unlocked_post', postId || slug || '');
        localStorage.setItem('chronicle_last_unlocked_time', String(Date.now()));
      } catch {}

      // Cross-tab broadcast to instantly notify the article tab
      try {
        const channel = new BroadcastChannel('chronicle_ad_channel');
        channel.postMessage({ type: 'UNLOCKED', postId, slug });
        channel.close();
      } catch {}

      window.dispatchEvent(new Event('storage'));

      // Automatically return to post page (Panel 3)
      setTimeout(() => {
        returnToOriginalPost(true);
      }, 300);
    }
  };

  // Return to original post (unlocked = true if completed, false if user closes early)
  const returnToOriginalPost = (isUnlocked: boolean = false) => {
    const targetUrl = isUnlocked
      ? `${effectiveReturnUrl}${effectiveReturnUrl.includes('?') ? '&' : '?'}unlocked=true`
      : effectiveReturnUrl;

    if (onBackToArticle) {
      onBackToArticle();
    } else {
      window.location.href = targetUrl;
    }
  };

  // Early close by user before 10s: keeps post locked!
  const handleEarlyClose = () => {
    returnToOriginalPost(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col overflow-hidden">
      {/* ============================================================ */}
      {/* TOP BAR: BRAND + [Closing in 10s] BADGE + CLOSE BUTTON (PANEL 2) */}
      {/* ============================================================ */}
      <header className="h-12 bg-neutral-900/95 border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between shadow-md shrink-0 select-none">
        
        {/* Left: Brand Name / Logo */}
        <div className="flex items-center gap-2">
          <span className="font-serif font-black text-base sm:text-lg text-white tracking-wide bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            {websiteName}
          </span>
          <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
            Ad Sponsor
          </span>
        </div>

        {/* Right: [Closing in 10s] Badge + [X] Close Button (Exactly like Panel 2) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick link to direct ad if user wants full tab */}
          <a
            href={smartLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-neutral-800/60 border border-neutral-700/60"
            title="Open in new window"
          >
            <span className="hidden sm:inline">Direct Ad</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Red-Bordered Countdown Pill Badge: [ Closing in 10s ] */}
          <div className="px-3 py-1 bg-black/90 border border-red-500/90 rounded-md shadow-sm shadow-red-500/20 flex items-center justify-center">
            <span className="text-[11px] sm:text-xs font-bold font-mono text-white tracking-wide">
              {secondsLeft > 0 ? (
                <>Closing in <span className="text-red-400">{secondsLeft}s</span></>
              ) : (
                <span className="text-emerald-400">Closing...</span>
              )}
            </span>
          </div>

          {/* Close [X] Button (Early close: returns to post locked) */}
          <button
            onClick={handleEarlyClose}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-neutral-800 hover:bg-red-900/60 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close early (Post remains locked)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN SCREEN: LIVE ADVERTISER CONTENT (PANEL 2) */}
      {/* ============================================================ */}
      <main className="flex-1 w-full h-[calc(100vh-48px)] relative bg-white overflow-hidden flex flex-col">
        <iframe
          src={smartLink}
          title="Sponsored Advertisement"
          className="w-full flex-1 border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </main>
    </div>
  );
};
