import { MediaType } from '../types';

export interface MediaDetectionResult {
  type: MediaType;
  embedUrl?: string;
  autoThumbnail?: string;
  rawInput: string;
  isEmbedCode: boolean;
}

export function detectMediaSource(input: string): MediaDetectionResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { type: 'none', rawInput: '', isEmbedCode: false };
  }

  // Check if it's raw HTML / iframe / script embed code
  if (trimmed.startsWith('<iframe') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<script') || trimmed.includes('<div') || trimmed.startsWith('<object') || trimmed.startsWith('<embed')) {
    // Try to extract src if iframe
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    const iframeSrc = srcMatch ? srcMatch[1] : undefined;
    
    // Auto thumbnail fallback for iframe
    return {
      type: 'embed_code',
      embedUrl: iframeSrc,
      autoThumbnail: '',
      rawInput: trimmed,
      isEmbedCode: true
    };
  }

  // 1. YouTube Detection
  // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ or /shorts/dQw4w9WgXcQ
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`,
      autoThumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // 2. Vimeo Detection
  // e.g. https://vimeo.com/76979871
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+))/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const vimeoId = vimeoMatch[3];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      autoThumbnail: `https://vumbnail.com/${vimeoId}.jpg`,
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // 3. TikTok Detection
  // e.g. https://www.tiktok.com/@scout2015/video/6718335390845095173
  const tiktokMatch = trimmed.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)(\d+)/i);
  if (tiktokMatch && tiktokMatch[1]) {
    const tiktokId = tiktokMatch[1];
    return {
      type: 'tiktok',
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokId}`,
      autoThumbnail: '',
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // 4. Instagram Detection
  // e.g. https://www.instagram.com/p/B_XyZ123/ or /reel/B_XyZ123/
  const igMatch = trimmed.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
  if (igMatch && igMatch[1]) {
    const igId = igMatch[1];
    return {
      type: 'instagram',
      embedUrl: `https://www.instagram.com/p/${igId}/embed`,
      autoThumbnail: '',
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // 5. Facebook Video Detection
  // e.g. https://www.facebook.com/watch/?v=12345 or facebook.com/.../videos/12345/
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    return {
      type: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=0`,
      autoThumbnail: '',
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // 6. Direct Video URL (.mp4, .webm, .ogg, .m3u8)
  if (trimmed.match(/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i)) {
    return {
      type: 'video_url',
      embedUrl: trimmed,
      autoThumbnail: '',
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // 7. Direct Image URL (.jpg, .jpeg, .png, .webp, .gif, .svg)
  if (trimmed.match(/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i)) {
    return {
      type: 'image',
      embedUrl: trimmed,
      autoThumbnail: trimmed,
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // Generic iframe wrapper for other URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      type: 'video_url',
      embedUrl: trimmed,
      autoThumbnail: '',
      rawInput: trimmed,
      isEmbedCode: false
    };
  }

  // Fallback
  return {
    type: 'embed_code',
    embedUrl: undefined,
    autoThumbnail: '',
    rawInput: trimmed,
    isEmbedCode: true
  };
}

/**
 * Generate a short 6-character alphanumeric ID
 */
export function generateShortId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
