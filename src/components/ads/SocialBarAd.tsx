import React, { useEffect, useRef, useState } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { X, Sparkles } from 'lucide-react';

const SOCIAL_BAR_SRC = 'https://pl20654735.profitableratecpmnetwork.com/b2/c4/dd/b2c4ddb89f881de77ddd596f9bfa41a7.js';

export const SocialBarAd: React.FC = () => {
  const { getAdByPosition } = useWebsite();
  const ad = getAdByPosition('social_bar');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!ad || !ad.is_active || isDismissed || !containerRef.current) return;

    try {
      const script = document.createElement('script');
      script.src = SOCIAL_BAR_SRC;
      script.async = true;
      script.onerror = () => { /* safely ignore network/adblock error */ };
      containerRef.current.appendChild(script);
    } catch (err) {
      console.warn('Social Bar Ad notice:', err);
    }
  }, [ad, isDismissed]);

  if (!ad || !ad.is_active || isDismissed) {
    return null;
  }

  return (
    <div
      role="complementary"
      aria-label="Sponsored Notification"
      className="fixed bottom-0 inset-x-0 z-40 bg-neutral-900/95 text-white border-t border-neutral-700/80 px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between transition-all"
    >
      <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
          <span className="uppercase tracking-wider">Trending Updates</span>
        </div>
        <div ref={containerRef} className="flex-1 flex items-center justify-center text-xs text-neutral-300">
          <span>Stay informed with the latest global dispatches and exclusive news alerts.</span>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss announcement"
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
