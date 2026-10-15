import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DeploymentSettings } from '../../types';

export const DeploymentHeadTags: React.FC = () => {
  const [config, setConfig] = useState<DeploymentSettings | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDeployment = async () => {
      try {
        const data = await api.getPublicDeploymentSettings();
        if (isMounted && data) {
          setConfig(data);
        }
      } catch (err) {
        // Fallback gracefully without breaking UI
        console.warn('[DeploymentHeadTags] Unable to load deployment settings:', err);
      }
    };

    loadDeployment();
    // Re-check periodically or on storage event
    const handleStorage = () => loadDeployment();
    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!config) return;

    // 1. Google Search Console Verification Meta Tag
    const gscMetaId = 'gsc-verification-meta';
    let gscMeta = document.getElementById(gscMetaId) as HTMLMetaElement | null;
    if (config.google_search_console_code && config.google_search_console_code.trim()) {
      if (!gscMeta) {
        gscMeta = document.createElement('meta');
        gscMeta.id = gscMetaId;
        gscMeta.name = 'google-site-verification';
        document.head.appendChild(gscMeta);
      }
      // If user pasted full tag `<meta name="google-site-verification" content="xxx" />`, extract content
      const match = config.google_search_console_code.match(/content=["']([^"']+)["']/);
      const codeVal = match ? match[1] : config.google_search_console_code.trim();
      gscMeta.content = codeVal;
    } else if (gscMeta) {
      gscMeta.remove();
    }

    // 2. Canonical URL Link Tag
    const canonicalId = 'dynamic-canonical-link';
    let canonicalLink = document.getElementById(canonicalId) as HTMLLinkElement | null;
    if (config.canonical_url && config.canonical_url.trim()) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.id = canonicalId;
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = config.canonical_url.trim();
    } else if (canonicalLink) {
      canonicalLink.remove();
    }

    // 3. Google Analytics (gtag.js)
    const gaScriptId = 'dynamic-ga-script';
    const gaInlineId = 'dynamic-ga-inline';
    let gaScript = document.getElementById(gaScriptId) as HTMLScriptElement | null;
    let gaInline = document.getElementById(gaInlineId) as HTMLScriptElement | null;

    if (config.google_analytics_enabled && config.google_analytics_id && config.google_analytics_id.trim()) {
      const gaId = config.google_analytics_id.trim();
      if (!gaScript) {
        gaScript = document.createElement('script');
        gaScript.id = gaScriptId;
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
        document.head.appendChild(gaScript);
      } else {
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      }

      if (!gaInline) {
        gaInline = document.createElement('script');
        gaInline.id = gaInlineId;
        gaInline.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `;
        document.head.appendChild(gaInline);
      }
    } else {
      if (gaScript) gaScript.remove();
      if (gaInline) gaInline.remove();
    }

    // 4. Meta Pixel (Facebook Pixel)
    const pixelScriptId = 'dynamic-meta-pixel';
    let pixelScript = document.getElementById(pixelScriptId) as HTMLScriptElement | null;

    if (config.meta_pixel_enabled && config.meta_pixel_id && config.meta_pixel_id.trim()) {
      const pixelId = config.meta_pixel_id.trim();
      if (!pixelScript) {
        pixelScript = document.createElement('script');
        pixelScript.id = pixelScriptId;
        pixelScript.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(pixelScript);
      }
    } else if (pixelScript) {
      pixelScript.remove();
    }

    // 5. Google AdSense Global Script
    const adsenseScriptId = 'dynamic-google-adsense';
    let adsenseScript = document.getElementById(adsenseScriptId) as HTMLScriptElement | null;

    if (config.google_adsense_enabled && config.google_adsense_id && config.google_adsense_id.trim()) {
      const pubId = config.google_adsense_id.trim();
      if (!adsenseScript) {
        adsenseScript = document.createElement('script');
        adsenseScript.id = adsenseScriptId;
        adsenseScript.async = true;
        adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pubId)}`;
        adsenseScript.crossOrigin = 'anonymous';
        document.head.appendChild(adsenseScript);
      } else {
        adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pubId)}`;
      }
    } else if (adsenseScript) {
      adsenseScript.remove();
    }
  }, [config]);

  return null;
};
