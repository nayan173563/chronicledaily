import React, { useEffect, useRef, useState } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { AdPosition } from '../../types';

interface AdSlotProps {
  position: AdPosition;
  className?: string;
  fallbackLabel?: string;
  minHeight?: number | string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  position,
  className = '',
  minHeight,
}) => {
  const { getAdByPosition, isAdminLoggedIn } = useWebsite();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadError, setLoadError] = useState(false);

  const ad = getAdByPosition(position);

  useEffect(() => {
    if (!ad || !ad.is_active || !iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDoc) return;

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
  </style>
  <script>
    // Guard against external script crashes & ad-blocker network rejections
    window.onerror = function() { return true; };
    window.onunhandledrejection = function(e) { if (e && e.preventDefault) e.preventDefault(); return true; };
  </script>
</head>
<body>
  ${ad.code}
</body>
</html>`;

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    } catch (err) {
      console.warn(`Ad slot ${position} sandbox notice:`, err);
      setLoadError(true);
    }
  }, [ad?.code, ad?.is_active, position]);

  if (!ad || !ad.is_active) {
    if (isAdminLoggedIn) {
      return (
        <div className={`border border-dashed border-neutral-300 bg-neutral-50/50 rounded p-3 text-center text-xs text-neutral-400 ${className}`}>
          <span>Ad slot [{position}] is currently inactive. Enable in Advertisement Manager.</span>
        </div>
      );
    }
    return null;
  }

  const slotWidth = ad.width ? `${ad.width}px` : '100%';
  const slotHeight = ad.height ? `${ad.height}px` : (minHeight ? `${minHeight}px` : 'auto');

  return (
    <div className={`ad-wrapper relative my-4 flex flex-col items-center justify-center overflow-hidden transition-opacity ${className}`}>
      {/* Editorial sponsored label (WCAG & Google Ad policy compliant) */}
      <div className="w-full flex items-center justify-center gap-2 mb-1.5 text-[10px] uppercase tracking-widest text-neutral-400 select-none">
        <span>Advertisement</span>
        {ad.width && ad.height && (
          <span className="text-neutral-300 font-mono">({ad.width}×{ad.height})</span>
        )}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: ad.width ? `${ad.width}px` : '100%',
          minHeight: minHeight || (ad.height ? `${ad.height}px` : undefined),
        }}
        className="flex items-center justify-center overflow-hidden"
      >
        <iframe
          ref={iframeRef}
          title={`Ad Placement ${position}`}
          tabIndex={-1}
          style={{
            width: slotWidth,
            height: slotHeight,
            maxWidth: '100%',
            border: 'none',
            overflow: 'hidden',
          }}
          scrolling="no"
        />
      </div>
    </div>
  );
};
