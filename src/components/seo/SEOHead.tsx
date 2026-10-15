import React, { useEffect } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { Post } from '../../types';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  post?: Post;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  post,
}) => {
  const { settings } = useWebsite();

  useEffect(() => {
    const siteName = settings?.website_name || 'The Daily Chronicle';
    const finalTitle = title ? `${title} — ${siteName}` : `${siteName} — Independent Journal of Record`;
    const finalDesc = description || settings?.meta_description || 'Global investigative journalism, analytical reports, and daily dispatches.';
    let finalImage = image || (post?.thumbnail_url) || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&h=630&q=80';
    if (finalImage.includes('res.cloudinary.com') && finalImage.includes('/upload/') && !finalImage.includes('/w_1200')) {
      finalImage = finalImage.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_75,f_jpg/');
    }
    const finalUrl = url || window.location.href;

    document.title = finalTitle;

    // Helper to update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      let el = document.querySelector(isProperty ? `meta[property='${name}']` : `meta[name='${name}']`);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    updateMeta('description', finalDesc);
    if (settings?.meta_keywords) {
      updateMeta('keywords', settings.meta_keywords);
    }

    // OpenGraph
    updateMeta('og:title', finalTitle, true);
    updateMeta('og:description', finalDesc, true);
    updateMeta('og:image', finalImage, true);
    updateMeta('og:image:secure_url', finalImage, true);
    updateMeta('og:image:type', 'image/jpeg', true);
    updateMeta('og:image:width', '1200', true);
    updateMeta('og:image:height', '630', true);
    updateMeta('og:url', finalUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', siteName, true);

    // Twitter Cards
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDesc);
    updateMeta('twitter:image', finalImage);

    // Schema.org Structured Data
    const oldSchema = document.getElementById('json-ld-schema');
    if (oldSchema) oldSchema.remove();

    const script = document.createElement('script');
    script.id = 'json-ld-schema';
    script.type = 'application/ld+json';

    if (post) {
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: post.title,
        description: post.description || post.content.substring(0, 160),
        image: [finalImage],
        datePublished: post.created_at,
        dateModified: post.updated_at || post.created_at,
        author: [{
          '@type': 'Person',
          name: post.author || siteName,
        }],
        publisher: {
          '@type': 'NewsMediaOrganization',
          name: siteName,
          logo: {
            '@type': 'ImageObject',
            url: settings?.logo_url || finalImage,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': finalUrl,
        },
      });
    } else {
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsMediaOrganization',
        name: siteName,
        url: window.location.origin,
        description: finalDesc,
      });
    }

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('json-ld-schema');
      if (el) el.remove();
    };
  }, [title, description, image, url, type, post, settings]);

  return null;
};
