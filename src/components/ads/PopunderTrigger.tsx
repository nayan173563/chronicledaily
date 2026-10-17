import React, { useEffect, useRef } from 'react';
import { useWebsite } from '../../context/WebsiteContext';

const DEFAULT_POPUNDER_SCRIPT = 'https://pl20627952.profitableratecpmnetwork.com/0e/5f/b9/0e5fb9407ed47dd6605faa50654a4022.js';
const DEFAULT_POPUNDER_DIRECT_LINK = 'https://www.profitableratecpmnetwork.com/u7c83wtb?key=8ad40353f84fe993feb17e6ca4a03326';

// Frequency Capping Rules: Exactly 4-hour cooldown, maximum 6 times in 24 hours
export const POPUNDER_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
export const POPUNDER_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours rolling window
export const POPUNDER_MAX_DAILY = 6; // 6 times per 24 hours
export const POPUNDER_HISTORY_KEY = 'chronicle_popunder_history';
export const POPUNDER_LAST_FIRED_KEY = 'chronicle_popunder_last_fired';

/**
 * Calculates current 24-hour popunder quota and cooldown eligibility
 */
export const getPopunderDailyStatus = () => {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(POPUNDER_HISTORY_KEY);
    const history: number[] = raw ? JSON.parse(raw) : [];
    // Keep only timestamps within last 24 hours
    const recent = history.filter((ts) => now - ts < POPUNDER_WINDOW_MS);
    const lastFired = Number(localStorage.getItem(POPUNDER_LAST_FIRED_KEY) || 0);

    const inCooldown = lastFired > 0 && now - lastFired < POPUNDER_COOLDOWN_MS;
    const isQuotaExceeded = recent.length >= POPUNDER_MAX_DAILY;

    return {
      allowed: !inCooldown && !isQuotaExceeded,
      countInLast24h: recent.length,
      maxDaily: POPUNDER_MAX_DAILY,
      inCooldown,
      cooldownRemainingMs: inCooldown ? POPUNDER_COOLDOWN_MS - (now - lastFired) : 0,
      recentTimestamps: recent,
    };
  } catch {
    return {
      allowed: true,
      countInLast24h: 0,
      maxDaily: POPUNDER_MAX_DAILY,
      inCooldown: false,
      cooldownRemainingMs: 0,
      recentTimestamps: [],
    };
  }
};

export const PopunderTrigger: React.FC = () => {
  const { getAdByPosition, settings } = useWebsite();
  const ad = getAdByPosition('popunder');
  const firedInSessionRef = useRef(false);

  useEffect(() => {
    // 1. Strict Isolation: NEVER run inside the admin panel or backend routes
    const isCurrentRouteAdmin = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      return (
        pathname.startsWith('/admin') ||
        hash.includes('/admin') ||
        document.body.classList.contains('admin-mode')
      );
    };

    if (isCurrentRouteAdmin()) {
      // Actively purge any popunder scripts that may exist in the DOM
      document
        .querySelectorAll('script[data-popunder="true"], script[src*="profitableratecpmnetwork"], script[src*="popunder"]')
        .forEach((el) => el.remove());
      return;
    }

    // Check if popunder ad is explicitly deactivated in database
    if (ad && ad.is_active === false) {
      return;
    }

    // Check frequency cap: If 4-hour cooldown is active or user reached 6 times in 24 hours, do not mount/trigger
    const dailyStatus = getPopunderDailyStatus();
    if (!dailyStatus.allowed) {
      return;
    }

    // Determine ad network script and target direct monetization link
    let scriptSrc = DEFAULT_POPUNDER_SCRIPT;
    let inlineScriptContent = '';

    if (ad?.code) {
      const codeTrimmed = ad.code.trim();
      if (codeTrimmed.includes('<script')) {
        const srcMatch = codeTrimmed.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          scriptSrc = srcMatch[1].startsWith('//') ? `https:${srcMatch[1]}` : srcMatch[1];
        } else {
          // Inline script without src
          const contentMatch = codeTrimmed.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
          if (contentMatch && contentMatch[1]) {
            inlineScriptContent = contentMatch[1];
          }
        }
      } else if (codeTrimmed.startsWith('http')) {
        // Direct link provided in code field
        scriptSrc = '';
      }
    }

    // Target direct CPM monetized link
    let targetDirectUrl = settings?.skip_ad_link || DEFAULT_POPUNDER_DIRECT_LINK;
    if (ad?.code && ad.code.trim().startsWith('http')) {
      targetDirectUrl = ad.code.trim();
    }

    // 2. Mount external network script on frontend (if not already present)
    if (scriptSrc && !document.querySelector(`script[data-popunder="true"][src="${scriptSrc}"]`)) {
      try {
        const s = document.createElement('script');
        s.src = scriptSrc;
        s.async = true;
        s.setAttribute('data-popunder', 'true');
        s.setAttribute('data-cfasync', 'false');
        s.onerror = () => {
          /* safely ignore ad-blocker network blocks */
        };
        document.head.appendChild(s);
      } catch (e) {
        console.warn('Popunder script mount note:', e);
      }
    }

    if (inlineScriptContent && !document.querySelector('script[data-popunder-inline="true"]')) {
      try {
        const s = document.createElement('script');
        s.type = 'text/javascript';
        s.text = inlineScriptContent;
        s.setAttribute('data-popunder-inline', 'true');
        document.head.appendChild(s);
      } catch (e) {
        console.warn('Inline popunder mount note:', e);
      }
    }

    // 3. Fallback Click Popunder Trigger for Public Frontend Visitors
    const handleVisitorClick = (e: MouseEvent) => {
      // Strict guard: if user clicked on admin interface or navigated to admin, abort immediately
      if (isCurrentRouteAdmin()) {
        return;
      }

      // Do not trigger if already fired in this session
      if (firedInSessionRef.current) return;

      // Check rolling 24h frequency cap & 4h cooldown
      const currentStatus = getPopunderDailyStatus();
      if (!currentStatus.allowed) {
        return;
      }

      // Do not intercept clicks on buttons or form submissions that require immediate UI response
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, input, select, textarea, [role="button"]')) {
        // Allow the button action first, but still trigger popunder without blocking
      }

      firedInSessionRef.current = true;

      try {
        const now = Date.now();
        const updatedHistory = [...currentStatus.recentTimestamps, now];
        localStorage.setItem(POPUNDER_HISTORY_KEY, JSON.stringify(updatedHistory));
        localStorage.setItem(POPUNDER_LAST_FIRED_KEY, String(now));
      } catch {}

      // Trigger popunder window synchronously in user gesture
      try {
        const pop = window.open(targetDirectUrl, '_blank');
        if (pop) {
          // Background attempt without throwing
          try {
            pop.blur();
            window.focus();
          } catch {}
        }
      } catch (err) {
        console.warn('Popunder trigger note:', err);
      }
    };

    // Attach click listener on public window
    window.addEventListener('click', handleVisitorClick, { capture: false });

    return () => {
      window.removeEventListener('click', handleVisitorClick, { capture: false });
    };
  }, [ad, settings]);

  return null;
};
