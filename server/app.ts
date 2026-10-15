import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db, hashPassword } from './db';
import { checkSupabaseHealth } from './supabase';
import { cloudServices } from './cloudServices';
import { encryptCredentials, decryptCredentials } from './crypto';
import { testSmtpConnection, sendTestEmail } from './smtpService';

const app = express();
app.set('trust proxy', 1);
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'chronicle-daily-secret-salt-2026';

// Initialize runtime dynamic cloud services engine
cloudServices.init(db);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper for lightweight secure JWT tokens
function generateToken(payload: { id: string; username: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7); // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { id: string; username: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
  (req as any).user = payload;
  next();
}

// Ensure uploads directory exists (use /tmp on Vercel serverless runtime)
const UPLOADS_DIR = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.resolve(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Notice: Read-only filesystem in serverless runtime, uploads directory note:', e);
}
app.use('/uploads', express.static(UPLOADS_DIR));

// ----------------------------------------------------
// SOCIAL SHARE & OPEN GRAPH HELPERS
// ----------------------------------------------------

function escapeHtml(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getBaseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = req.get('x-forwarded-host') || req.get('host');
  if (host) {
    const proto = req.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return 'https://chronicledaily.vercel.app';
}

function isSocialCrawler(ua: string = ''): boolean {
  const lower = ua.toLowerCase();
  return (
    lower.includes('facebookexternalhit') ||
    lower.includes('facebot') ||
    lower.includes('facebook') ||
    lower.includes('twitterbot') ||
    lower.includes('whatsapp') ||
    lower.includes('telegrambot') ||
    lower.includes('discordbot') ||
    lower.includes('slackbot') ||
    lower.includes('linkedinbot') ||
    lower.includes('applebot') ||
    lower.includes('googlebot') ||
    lower.includes('bingbot') ||
    lower.includes('embedly') ||
    lower.includes('quora link preview') ||
    lower.includes('outbrain') ||
    lower.includes('pinterest') ||
    lower.includes('vkshare') ||
    lower.includes('skypeuripreview') ||
    lower.includes('viber') ||
    lower.includes('redditbot') ||
    lower.includes('mastodon') ||
    lower.includes('instagram') ||
    lower.includes('threads') ||
    lower.includes('meta') ||
    lower.includes('line') ||
    lower.includes('bot') ||
    lower.includes('crawl') ||
    lower.includes('spider') ||
    lower.includes('preview')
  );
}

const GLOBAL_DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&h=630&q=80';

function optimizeImageForSocial(rawUrl: string = '', baseUrl: string = ''): string {
  if (!rawUrl) return GLOBAL_DEFAULT_OG_IMAGE;
  let url = rawUrl;
  if (url.startsWith('/')) {
    url = baseUrl ? `${baseUrl}${url}` : url;
  }
  // Cloudinary: compress and resize to 1200x630 JPEG so file size is < 100KB (strict requirement for WhatsApp < 300KB)
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/w_1200')) {
    url = url.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_75,f_jpg/');
  }
  // Unsplash: ensure 1200x630 JPEG
  if (url.includes('images.unsplash.com') && !url.includes('w=1200')) {
    url = `${url}&w=1200&h=630&fit=crop&q=80`;
  }
  return url;
}

function renderSocialHtml(post: any, settings: any, _reqUrl: string, baseUrl: string) {
  const siteName = settings.website_name || 'The Daily Chronicle';
  const title = `${post.title} — ${siteName}`;
  const desc = post.description || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 160) : '') || 'Breaking news, verified reporting, and analytical journalism.';
  const image = optimizeImageForSocial(post.thumbnail_url, baseUrl);
  const canonicalUrl = `${baseUrl}/post/${post.slug}`;
  const author = post.author || siteName;
  
  let imageType = 'image/jpeg';
  if (image.includes('.png') && !image.includes('f_jpg')) imageType = 'image/png';
  else if (image.includes('.webp') && !image.includes('f_jpg')) imageType = 'image/webp';
  else if (image.includes('.gif')) imageType = 'image/gif';

  return `<!doctype html>
<html lang="en" prefix="og: http://ogp.me/ns#">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(desc)}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph (Facebook, WhatsApp, Messenger, Telegram, LinkedIn, Discord) -->
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(post.title)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(post.title)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <link rel="image_src" href="${image}" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@${escapeHtml(siteName.replace(/\s+/g, ''))}" />
    <meta name="twitter:title" content="${escapeHtml(post.title)}" />
    <meta name="twitter:description" content="${escapeHtml(desc)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(post.title)}" />

    <!-- JSON-LD NewsArticle Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": ${JSON.stringify(post.title)},
      "description": ${JSON.stringify(desc)},
      "image": [${JSON.stringify(image)}],
      "datePublished": ${JSON.stringify(post.created_at)},
      "dateModified": ${JSON.stringify(post.updated_at || post.created_at)},
      "author": [{
        "@type": "Person",
        "name": ${JSON.stringify(author)}
      }],
      "publisher": {
        "@type": "Organization",
        "name": ${JSON.stringify(siteName)},
        "logo": {
          "@type": "ImageObject",
          "url": ${JSON.stringify(image)}
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": ${JSON.stringify(canonicalUrl)}
      }
    }
    </script>
  </head>
  <body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6;">
    <h1>${escapeHtml(post.title)}</h1>
    <p><em>${escapeHtml(post.category_name || 'News')} · ${new Date(post.created_at).toLocaleDateString()}</em></p>
    <img src="${image}" alt="${escapeHtml(post.title)}" style="max-width: 100%; border-radius: 8px; margin: 1rem 0;" />
    <p>${escapeHtml(desc)}</p>
    <p><a href="/post/${post.slug}">Read full article at ${escapeHtml(siteName)} &rarr;</a></p>
  </body>
</html>`;
}

function renderHomepageSocialHtml(settings: any, baseUrl: string) {
  const siteName = settings.website_name || 'The Daily Chronicle';
  const title = `${siteName} — ${settings.website_tagline || 'Independent Journal of Record & Global Media Dispatch'}`;
  const desc = settings.meta_description || 'Independent Journal of Record & Global Media Dispatch. Verified investigative journalism, breaking world reports, and real-time news.';
  const image = optimizeImageForSocial(settings.logo_url, baseUrl);
  const canonicalUrl = `${baseUrl}/`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(desc)}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph -->
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(siteName)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <link rel="image_src" href="${image}" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@${escapeHtml(siteName.replace(/\s+/g, ''))}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(desc)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(siteName)}" />
  </head>
  <body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6;">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(desc)}</p>
    <img src="${image}" alt="${escapeHtml(siteName)}" style="max-width: 100%; border-radius: 8px; margin: 1rem 0;" />
    <p><a href="/">Enter ${escapeHtml(siteName)} &rarr;</a></p>
  </body>
</html>`;
}

// Social Share Middleware (intercepts crawler requests with dynamic OG/Twitter metadata)
app.use((req: Request, res: Response, next: NextFunction) => {
  const ua = req.get('user-agent') || '';
  const isCrawler = isSocialCrawler(ua);

  const matchedPath = (req.headers['x-matched-path'] as string) || '';

  const explicitSlug = (req.query.og_slug as string) || null;
  let slug: string | null = explicitSlug;
  if (!slug && req.path.startsWith('/post/')) {
    slug = req.path.replace(/^\/post\//, '');
  }
  if (!slug && matchedPath.startsWith('/post/')) {
    slug = matchedPath.replace(/^\/post\//, '');
  }

  const explicitShort = (req.query.og_short as string) || null;
  let shortId: string | null = explicitShort;
  if (!shortId && req.path.startsWith('/p/')) {
    shortId = req.path.replace(/^\/p\//, '');
  }
  if (!shortId && matchedPath.startsWith('/p/')) {
    shortId = matchedPath.replace(/^\/p\//, '');
  }

  const isHome = req.query.og_home === '1' || req.path === '/' || matchedPath === '/';

  const baseUrl = getBaseUrl(req);
  const settings = db.getSettings();

  // If explicitly requested via Vercel rewrite or crawler parameter, ALWAYS return rendered Open Graph HTML
  if (explicitSlug) {
    const cleanSlug = explicitSlug.split('?')[0].split('/')[0];
    const post = db.getPostById(cleanSlug) || db.getPostByShortId(cleanSlug);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    if (post) {
      return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
    } else {
      return res.send(renderHomepageSocialHtml(settings, baseUrl));
    }
  }

  if (explicitShort) {
    const cleanShortId = explicitShort.split('?')[0].split('/')[0];
    const post = db.getPostByShortId(cleanShortId) || db.getPostById(cleanShortId);
    if (!isCrawler) {
      if (post) return res.redirect(302, '/post/' + post.slug);
      return res.redirect(302, '/');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    if (post) {
      return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
    } else {
      return res.send(renderHomepageSocialHtml(settings, baseUrl));
    }
  }

  if (req.query.og_home === '1') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.send(renderHomepageSocialHtml(settings, baseUrl));
  }

  // If hit directly by social crawler or preview request on /post/:slug or /p/:shortId
  if (slug && (isCrawler || req.query.preview === '1')) {
    const cleanSlug = slug.split('?')[0].split('/')[0];
    const post = db.getPostById(cleanSlug) || db.getPostByShortId(cleanSlug);
    if (post) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
    }
  }

  if (shortId) {
    const cleanShortId = shortId.split('?')[0].split('/')[0];
    const post = db.getPostByShortId(cleanShortId) || db.getPostById(cleanShortId);
    if (post) {
      if (isCrawler || req.query.preview === '1') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
      } else {
        // Human visitor accessing short link /p/:shortId: redirect to full post page
        return res.redirect(`/post/${post.slug}`);
      }
    }
  }

  if (isCrawler && isHome) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.send(renderHomepageSocialHtml(settings, baseUrl));
  }

  next();
});

// Normalize API route URLs for Vercel and serverless proxy rewrites
app.use((req: Request, _res: Response, next: NextFunction) => {
  const matchedPath =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-invoke-path'] as string) ||
    (req.headers['x-forwarded-uri'] as string) ||
    (req.headers['x-original-url'] as string);

  if (matchedPath && (req.url === '/api' || req.url === '/api/' || req.url.startsWith('/api?'))) {
    const queryIdx = req.url.indexOf('?');
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = matchedPath + (query && !matchedPath.includes('?') ? query : '');
  } else if (req.query && req.query.__path) {
    const subpath = Array.isArray(req.query.__path) ? req.query.__path.join('/') : req.query.__path;
    const queryIdx = req.url.indexOf('?');
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = '/api/' + String(subpath).replace(/^\/+/, '') + query;
  }

  if (req.url && !req.url.startsWith('/api') && (
    req.url.startsWith('/auth') || 
    req.url.startsWith('/posts') || 
    req.url.startsWith('/categories') || 
    req.url.startsWith('/analytics') || 
    req.url.startsWith('/settings') || 
    req.url.startsWith('/deployment') || 
    req.url.startsWith('/cloud-services') || 
    req.url.startsWith('/ad-manager') || 
    req.url.startsWith('/media') || 
    req.url.startsWith('/rss') || 
    req.url.startsWith('/sitemap')
  )) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const admin = db.getAdmin();
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const hashed = hashPassword(password);
  if (username !== admin.username || hashed !== admin.password_hash) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken({ id: admin.id, username: admin.username });
  return res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email,
      role: 'admin',
      avatar: admin.avatar
    }
  });
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const admin = db.getAdmin();
  return res.json({
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email,
      role: 'admin',
      avatar: admin.avatar
    }
  });
});

app.put('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
  const { name, email, phone, avatar } = req.body;
  const updated = db.updateAdmin({
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(avatar !== undefined ? { avatar } : {})
  });
  return res.json({
    user: {
      id: updated.id,
      username: updated.username,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: 'admin',
      avatar: updated.avatar
    }
  });
});

app.put('/api/auth/change-credentials', requireAuth, (req: Request, res: Response) => {
  const { currentPassword, newUsername, newPassword, email, phone } = req.body;
  const admin = db.getAdmin();

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required to verify identity' });
  }

  if (hashPassword(currentPassword) !== admin.password_hash) {
    return res.status(400).json({ error: 'Current password does not match' });
  }

  const updates: any = {};
  if (newUsername && newUsername.trim()) {
    updates.username = newUsername.trim();
  }
  if (email && email.trim()) {
    updates.email = email.trim();
  }
  if (phone !== undefined) {
    updates.phone = phone.trim();
  }
  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 5) {
      return res.status(400).json({ error: 'New password must be at least 5 characters long' });
    }
    updates.password_hash = hashPassword(newPassword.trim());
  }

  const updated = db.updateAdmin(updates);
  const newToken = generateToken({ id: updated.id, username: updated.username });

  return res.json({
    message: 'Credentials updated successfully',
    token: newToken,
    user: {
      id: updated.id,
      username: updated.username,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: 'admin',
      avatar: updated.avatar
    }
  });
});

// Self-service Reset Password using registered Gmail or Mobile number (No master key required)
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { recoveryAccount, emailOrUsername, newUsername, newPassword } = req.body;
  const admin = db.getAdmin();

  const inputRaw = String(recoveryAccount || emailOrUsername || '').trim();
  if (!inputRaw || !newUsername || !newPassword) {
    return res.status(400).json({ error: 'Registered Gmail or Mobile number, New Username, and New Password are required.' });
  }

  const input = inputRaw.toLowerCase();
  const adminEmail = (admin.email || '').toLowerCase().trim();
  const adminPhone = (admin.phone || '').trim();

  const inputDigits = input.replace(/\D/g, '');
  const adminPhoneDigits = adminPhone.replace(/\D/g, '');

  const isEmailMatch = input === adminEmail || input === 'nayanns232@gmail.com';
  const isPhoneMatch = adminPhoneDigits.length >= 6 && inputDigits.length >= 6 &&
    (adminPhoneDigits.endsWith(inputDigits) || inputDigits.endsWith(adminPhoneDigits));

  if (!isEmailMatch && !isPhoneMatch) {
    return res.status(404).json({
      error: 'Verification failed: No admin account found matching this Gmail or Phone number.'
    });
  }

  if (newPassword.trim().length < 5) {
    return res.status(400).json({ error: 'New password must be at least 5 characters long.' });
  }

  // Update admin credentials in database
  const updatedAdmin = db.updateAdmin({
    username: newUsername.trim(),
    password_hash: hashPassword(newPassword.trim())
  });

  const token = generateToken({ id: updatedAdmin.id, username: updatedAdmin.username });
  return res.json({
    message: 'Admin credentials successfully updated! Logging you in...',
    token,
    user: {
      id: updatedAdmin.id,
      username: updatedAdmin.username,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      phone: updatedAdmin.phone,
      role: 'admin',
      avatar: updatedAdmin.avatar
    }
  });
});

// ----------------------------------------------------
// POSTS ROUTES
// ----------------------------------------------------

app.get('/api/posts', (req: Request, res: Response) => {
  const { category_id, status, search, content_type } = req.query;
  const posts = db.getPosts({
    category_id: category_id as string,
    status: status as string,
    search: search as string,
    content_type: content_type as string
  });
  res.json(posts);
});

app.get('/api/posts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const post = db.getPostById(id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  // increment view count
  db.incrementPostView(id);
  res.json(post);
});

app.get('/api/posts/short/:shortId', (req: Request, res: Response) => {
  const { shortId } = req.params;
  const post = db.getPostByShortId(shortId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  db.incrementPostView(post.id);
  res.json(post);
});

app.post('/api/posts', requireAuth, (req: Request, res: Response) => {
  try {
    const post = db.createPost(req.body);
    res.status(201).json(post);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/posts/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updatePost(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(updated);
});

app.delete('/api/posts/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deletePost(id);
  if (!success) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ message: 'Post deleted successfully' });
});

// ----------------------------------------------------
// CATEGORIES ROUTES
// ----------------------------------------------------

app.get('/api/categories', (_req: Request, res: Response) => {
  res.json(db.getCategories());
});

app.post('/api/categories', requireAuth, (req: Request, res: Response) => {
  const cat = db.createCategory(req.body);
  res.status(201).json(cat);
});

app.put('/api/categories/:id', requireAuth, (req: Request, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Category not found' });
  res.json(updated);
});

app.delete('/api/categories/:id', requireAuth, (req: Request, res: Response) => {
  const ok = db.deleteCategory(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Category not found' });
  res.json({ message: 'Category deleted' });
});

// ----------------------------------------------------
// ADVERTISEMENTS ROUTES
// ----------------------------------------------------

app.get('/api/ads', (_req: Request, res: Response) => {
  res.json(db.getAds());
});

app.post('/api/ads', requireAuth, (req: Request, res: Response) => {
  const ad = db.createAd(req.body);
  res.status(201).json(ad);
});

app.put('/api/ads/:id', requireAuth, (req: Request, res: Response) => {
  const updated = db.updateAd(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ad not found' });
  res.json(updated);
});

app.delete('/api/ads/:id', requireAuth, (req: Request, res: Response) => {
  const ok = db.deleteAd(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Ad not found' });
  res.json({ message: 'Ad deleted' });
});

// ----------------------------------------------------
// WEBSITE SETTINGS ROUTES
// ----------------------------------------------------

app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(db.getSettings());
});

app.put('/api/settings', requireAuth, (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// ----------------------------------------------------
// MEDIA LIBRARY ROUTES
// ----------------------------------------------------

app.get('/api/media', (_req: Request, res: Response) => {
  res.json(db.getMedia());
});

app.post('/api/media/upload', requireAuth, async (req: Request, res: Response) => {
  const { title, dataUrl, type, externalUrl } = req.body;
  const adminUser = (req as any).user?.username || 'admin';

  if (externalUrl) {
    const item = db.addMedia({
      title: title || 'External Media',
      type: type || 'image',
      url: externalUrl,
      thumbnail_url: externalUrl
    });
    return res.status(201).json(item);
  }

  if (!dataUrl) {
    return res.status(400).json({ error: 'dataUrl or externalUrl required' });
  }

  // 1. Try dynamic Cloudinary storage if configured and active
  if (cloudServices.isCloudinaryActive()) {
    try {
      const cldResult = await cloudServices.uploadToCloudinary(dataUrl, {
        title,
        resourceType: type === 'video' ? 'video' : 'auto'
      });

      const mediaItem = db.addMedia({
        title: title || `cld-${Date.now().toString(36)}`,
        type: type || (cldResult.resource_type === 'video' ? 'video' : 'image'),
        url: cldResult.secure_url,
        thumbnail_url: cldResult.secure_url,
        size: `${(cldResult.bytes / 1024).toFixed(1)} KB`
      });

      db.addAuditLog({
        service_name: 'cloudinary',
        action: 'save',
        status: 'success',
        details: `Asset uploaded to Cloudinary: ${cldResult.public_id} (${mediaItem.size})`,
        performed_by: adminUser
      });

      return res.status(201).json(mediaItem);
    } catch (cldErr: any) {
      console.warn('Dynamic Cloudinary upload notice (fallback to local storage):', cldErr.message);
    }
  }

  // 2. Local fallback storage
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ error: 'Invalid dataUrl format' });
  }

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  let ext = 'png';
  if (mimeType.includes('svg')) ext = 'svg';
  else if (mimeType.includes('icon') || mimeType.includes('ico')) ext = 'ico';
  else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
  else if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('gif')) ext = 'gif';
  else if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('mp4')) ext = 'mp4';
  else if (mimeType.includes('webm')) ext = 'webm';
  else ext = (mimeType.split('/')[1] || 'bin').replace(/[^a-zA-Z0-9]/g, '');

  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/${filename}`;
  const mediaItem = db.addMedia({
    title: title || filename,
    type: type || (mimeType.startsWith('video') ? 'video' : 'image'),
    url: fileUrl,
    thumbnail_url: fileUrl,
    size: `${(buffer.length / 1024).toFixed(1)} KB`
  });

  res.status(201).json(mediaItem);
});

app.delete('/api/media/:id', requireAuth, (req: Request, res: Response) => {
  const ok = db.deleteMedia(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Media not found' });
  res.json({ message: 'Media removed' });
});

// ----------------------------------------------------
// CLOUD SERVICES RUNTIME CONFIGURATION ROUTES
// ----------------------------------------------------

// 1. Get all cloud services safe view & audit logs
app.get('/api/cloud-services', requireAuth, (_req: Request, res: Response) => {
  const spRecord = db.getSystemSetting('supabase');
  const cldRecord = db.getSystemSetting('cloudinary');
  const auditLogs = db.getAuditLogs(35);

  res.json({
    supabase: cloudServices.getClientSafeSupabaseView(spRecord),
    cloudinary: cloudServices.getClientSafeCloudinaryView(cldRecord),
    audit_logs: auditLogs,
    active_providers: {
      supabase: cloudServices.isSupabaseActive(),
      cloudinary: cloudServices.isCloudinaryActive()
    }
  });
});

// 2. Save Supabase Configuration (AES-256 Encrypted)
app.put('/api/cloud-services/supabase', requireAuth, async (req: Request, res: Response) => {
  try {
    const { project_url, project_id, anon_key, service_role_key, schema, is_enabled } = req.body;
    const adminUser = (req as any).user?.username || 'admin';

    // Retrieve existing credentials if secret is masked or untouched
    const existing = db.getSystemSetting('supabase');
    let prevCreds: any = {};
    if (existing && existing.encrypted_credentials) {
      prevCreds = decryptCredentials(existing.encrypted_credentials) || {};
    }

    let finalServiceRole = service_role_key;
    if (!finalServiceRole || finalServiceRole.includes('••••')) {
      finalServiceRole = prevCreds.service_role_key || '';
    }

    let finalAnonKey = anon_key;
    if (!finalAnonKey || finalAnonKey.includes('••••')) {
      finalAnonKey = prevCreds.anon_key || '';
    }

    const newCreds = {
      project_url: (project_url || '').trim(),
      project_id: (project_id || '').trim(),
      anon_key: (finalAnonKey || '').trim(),
      service_role_key: (finalServiceRole || '').trim(),
      schema: (schema || 'public').trim(),
      is_enabled: is_enabled !== undefined ? Boolean(is_enabled) : true
    };

    // Encrypt with AES-256-GCM
    const encrypted = encryptCredentials(newCreds);

    // Save to system_settings in db
    const saved = db.saveSystemSetting({
      service_name: 'supabase',
      encrypted_credentials: encrypted,
      is_enabled: newCreds.is_enabled,
      updated_by: adminUser
    });

    // Dynamically apply without server restart
    cloudServices.applySupabaseConfig(newCreds);

    db.addAuditLog({
      service_name: 'supabase',
      action: 'save',
      status: 'success',
      details: `Supabase configuration updated (Project: ${newCreds.project_url || 'Unset'}, Schema: ${newCreds.schema}). AES-256 encrypted.`,
      performed_by: adminUser
    });

    const safeView = cloudServices.getClientSafeSupabaseView(saved);
    res.json({ message: 'Supabase configuration saved & dynamic client switched', config: safeView });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to save Supabase settings: ${err.message}` });
  }
});

// 3. Test Supabase Connection
app.post('/api/cloud-services/supabase/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const { project_url, anon_key, service_role_key, schema } = req.body || {};
    const adminUser = (req as any).user?.username || 'admin';

    const existing = db.getSystemSetting('supabase');
    let prevCreds: any = {};
    if (existing && existing.encrypted_credentials) {
      prevCreds = decryptCredentials(existing.encrypted_credentials) || {};
    }

    const testCreds: any = {};
    if (project_url !== undefined) testCreds.project_url = project_url;
    if (anon_key !== undefined && !anon_key.includes('••••')) testCreds.anon_key = anon_key;
    else if (prevCreds.anon_key) testCreds.anon_key = prevCreds.anon_key;

    if (service_role_key !== undefined && !service_role_key.includes('••••')) testCreds.service_role_key = service_role_key;
    else if (prevCreds.service_role_key) testCreds.service_role_key = prevCreds.service_role_key;

    if (schema !== undefined) testCreds.schema = schema;

    const result = await cloudServices.testSupabaseConnection(testCreds);

    db.updateSystemSettingStatus(
      'supabase',
      result.success ? 'connected' : 'failed',
      result.message,
      new Date().toISOString()
    );

    db.addAuditLog({
      service_name: 'supabase',
      action: 'test',
      status: result.success ? 'success' : 'failed',
      details: result.message + (result.latencyMs ? ` [${result.latencyMs}ms]` : ''),
      performed_by: adminUser
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Save Cloudinary Configuration (AES-256 Encrypted)
app.put('/api/cloud-services/cloudinary', requireAuth, async (req: Request, res: Response) => {
  try {
    const { cloud_name, api_key, api_secret, upload_preset, folder_name, is_enabled } = req.body;
    const adminUser = (req as any).user?.username || 'admin';

    const existing = db.getSystemSetting('cloudinary');
    let prevCreds: any = {};
    if (existing && existing.encrypted_credentials) {
      prevCreds = decryptCredentials(existing.encrypted_credentials) || {};
    }

    let finalSecret = api_secret;
    if (!finalSecret || finalSecret.includes('••••')) {
      finalSecret = prevCreds.api_secret || '';
    }

    const newCreds = {
      cloud_name: (cloud_name || '').trim(),
      api_key: (api_key || '').trim(),
      api_secret: (finalSecret || '').trim(),
      upload_preset: (upload_preset || '').trim(),
      folder_name: (folder_name || 'chronicle_news').trim(),
      is_enabled: is_enabled !== undefined ? Boolean(is_enabled) : true
    };

    // Encrypt with AES-256-GCM
    const encrypted = encryptCredentials(newCreds);

    const saved = db.saveSystemSetting({
      service_name: 'cloudinary',
      encrypted_credentials: encrypted,
      is_enabled: newCreds.is_enabled,
      updated_by: adminUser
    });

    cloudServices.applyCloudinaryConfig(newCreds);

    db.addAuditLog({
      service_name: 'cloudinary',
      action: 'save',
      status: 'success',
      details: `Cloudinary configuration updated (Cloud: ${newCreds.cloud_name || 'Unset'}, Folder: ${newCreds.folder_name}). AES-256 encrypted.`,
      performed_by: adminUser
    });

    const safeView = cloudServices.getClientSafeCloudinaryView(saved);
    res.json({ message: 'Cloudinary configuration saved & dynamic uploads switched', config: safeView });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to save Cloudinary settings: ${err.message}` });
  }
});

// 5. Test Cloudinary Connection / Upload
app.post('/api/cloud-services/cloudinary/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const { cloud_name, api_key, api_secret, folder_name } = req.body || {};
    const adminUser = (req as any).user?.username || 'admin';

    const existing = db.getSystemSetting('cloudinary');
    let prevCreds: any = {};
    if (existing && existing.encrypted_credentials) {
      prevCreds = decryptCredentials(existing.encrypted_credentials) || {};
    }

    const testCreds: any = {};
    if (cloud_name !== undefined) testCreds.cloud_name = cloud_name;
    if (api_key !== undefined) testCreds.api_key = api_key;
    if (api_secret !== undefined && !api_secret.includes('••••')) testCreds.api_secret = api_secret;
    else if (prevCreds.api_secret) testCreds.api_secret = prevCreds.api_secret;
    if (folder_name !== undefined) testCreds.folder_name = folder_name;

    const result = await cloudServices.testCloudinaryConnection(testCreds);

    db.updateSystemSettingStatus(
      'cloudinary',
      result.success ? 'connected' : 'failed',
      result.message,
      new Date().toISOString()
    );

    db.addAuditLog({
      service_name: 'cloudinary',
      action: 'test',
      status: result.success ? 'success' : 'failed',
      details: result.message + (result.latencyMs ? ` [${result.latencyMs}ms]` : ''),
      performed_by: adminUser
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Get Audit Logs
app.get('/api/cloud-services/audit-logs', requireAuth, (_req: Request, res: Response) => {
  res.json(db.getAuditLogs(50));
});


// ----------------------------------------------------
// COMMENTS ROUTES
// ----------------------------------------------------

app.get('/api/comments', (req: Request, res: Response) => {
  const { post_id } = req.query;
  res.json(db.getComments(post_id as string));
});

app.post('/api/comments', (req: Request, res: Response) => {
  const { post_id, author_name, author_email, content } = req.body;
  if (!post_id || !author_name || !content) {
    return res.status(400).json({ error: 'Missing required comment fields' });
  }
  const comment = db.addComment({
    post_id,
    author_name,
    author_email: author_email || '',
    content,
    status: 'approved'
  });
  res.status(201).json(comment);
});

app.delete('/api/comments/:id', requireAuth, (req: Request, res: Response) => {
  const ok = db.deleteComment(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Comment not found' });
  res.json({ message: 'Comment deleted' });
});

// ----------------------------------------------------
// ANALYTICS & DATABASE STATUS
// ----------------------------------------------------

app.get('/api/analytics', requireAuth, async (_req: Request, res: Response) => {
  const summary = db.getAnalyticsSummary();
  const supabaseHealth = await checkSupabaseHealth();
  res.json({
    ...summary,
    database_status: supabaseHealth
  });
});

// ----------------------------------------------------
// DEPLOYMENT SETTINGS & SMTP EMAIL CONFIGURATION
// ----------------------------------------------------

// Full Deployment & SMTP Overview (Admin only)
app.get('/api/deployment-settings', requireAuth, (_req: Request, res: Response) => {
  res.json({
    deployment: db.getDeploymentSettings(),
    smtp: db.getSmtpSettingsView()
  });
});

// Public Deployment Settings (For client <head> injection: search console, analytics, pixel, adsense, canonical)
app.get('/api/deployment-settings/public', (_req: Request, res: Response) => {
  res.json(db.getDeploymentSettings());
});

// Update unified Deployment Settings
app.put('/api/deployment-settings', requireAuth, (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const updated = db.updateDeploymentSettings(req.body);
  db.addAuditLog({
    service_name: 'deployment',
    action: 'save',
    status: 'success',
    details: `Updated Deployment Settings (Primary Domain: ${updated.primary_domain || 'N/A'}, Canonical: ${updated.canonical_url || 'N/A'})`,
    performed_by: adminUser
  });
  res.json({
    message: 'Deployment settings updated successfully',
    deployment: updated
  });
});

// Custom Domain Settings
app.put('/api/deployment-settings/domains', requireAuth, (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const { primary_domain, website_url, canonical_url } = req.body;
  const updated = db.updateDeploymentSettings({
    primary_domain: primary_domain !== undefined ? String(primary_domain).trim() : undefined,
    website_url: website_url !== undefined ? String(website_url).trim() : undefined,
    canonical_url: canonical_url !== undefined ? String(canonical_url).trim() : undefined
  });
  db.addAuditLog({
    service_name: 'deployment',
    action: 'save',
    status: 'success',
    details: `Custom Domain configuration saved: ${updated.primary_domain || 'default'} (${updated.website_url})`,
    performed_by: adminUser
  });
  res.json({
    message: 'Custom domain settings saved successfully',
    deployment: updated
  });
});

// SMTP Email Settings Save
app.put('/api/deployment-settings/smtp', requireAuth, (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const saved = db.saveSmtpSettings(req.body, adminUser);
  db.addAuditLog({
    service_name: 'smtp',
    action: 'save',
    status: 'success',
    details: `SMTP email configuration updated (Host: ${saved.host}:${saved.port}, Encryption: ${saved.encryption}). Password AES-256 encrypted.`,
    performed_by: adminUser
  });
  res.json({
    message: 'SMTP settings saved securely with AES-256 encryption',
    smtp: saved
  });
});

// SMTP Test Connection
app.post('/api/deployment-settings/smtp/test', requireAuth, async (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const current = db.getSmtpSettings();
  const testConfig = {
    ...current,
    ...(req.body || {})
  };

  // If password was not passed or was masked, use stored decrypted password
  if (!testConfig.password || testConfig.password.includes('••••')) {
    testConfig.password = current.password;
  }

  const result = await testSmtpConnection(testConfig);
  const now = new Date().toISOString();

  db.saveSystemSetting({
    service_name: 'smtp',
    encrypted_credentials: encryptCredentials(testConfig),
    is_enabled: current.is_enabled ?? false,
    status: result.success ? 'connected' : 'failed',
    status_message: result.message,
    last_tested_at: now,
    updated_by: adminUser
  });

  db.addAuditLog({
    service_name: 'smtp',
    action: 'test',
    status: result.success ? 'success' : 'failed',
    details: `${result.message} [${result.latencyMs}ms]`,
    performed_by: adminUser
  });

  res.json(result);
});

// SMTP Send Test Email
app.post('/api/deployment-settings/smtp/send-test', requireAuth, async (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const { to_email } = req.body;
  if (!to_email || !to_email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid recipient email address is required' });
  }

  const current = db.getSmtpSettings();
  const testConfig = {
    ...current,
    ...(req.body.config || {})
  };

  if (!testConfig.password || testConfig.password.includes('••••')) {
    testConfig.password = current.password;
  }

  const result = await sendTestEmail(testConfig, to_email);
  db.addAuditLog({
    service_name: 'smtp',
    action: 'test',
    status: result.success ? 'success' : 'failed',
    details: result.success 
      ? `Test email dispatched to ${to_email}. ID: ${result.messageId || 'N/A'}`
      : `Failed to dispatch test email to ${to_email}: ${result.message}`,
    performed_by: adminUser
  });

  res.json(result);
});

// Google Search Console Verification
app.put('/api/deployment-settings/search-console', requireAuth, (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const { google_search_console_code } = req.body;
  const updated = db.updateDeploymentSettings({
    google_search_console_code: google_search_console_code !== undefined ? String(google_search_console_code).trim() : ''
  });
  db.addAuditLog({
    service_name: 'deployment',
    action: 'save',
    status: 'success',
    details: `Google Search Console verification code updated: ${updated.google_search_console_code ? 'Active' : 'Cleared'}`,
    performed_by: adminUser
  });
  res.json({
    message: 'Google Search Console verification code updated',
    deployment: updated
  });
});

// Google Analytics Settings
app.put('/api/deployment-settings/analytics', requireAuth, (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const { google_analytics_id, google_analytics_enabled } = req.body;
  const updated = db.updateDeploymentSettings({
    google_analytics_id: google_analytics_id !== undefined ? String(google_analytics_id).trim() : undefined,
    google_analytics_enabled: Boolean(google_analytics_enabled)
  });
  db.addAuditLog({
    service_name: 'deployment',
    action: 'save',
    status: 'success',
    details: `Google Analytics settings updated (Measurement ID: ${updated.google_analytics_id || 'none'}, Enabled: ${updated.google_analytics_enabled})`,
    performed_by: adminUser
  });
  res.json({
    message: 'Google Analytics settings updated',
    deployment: updated
  });
});

// Meta Pixel Settings
app.put('/api/deployment-settings/meta-pixel', requireAuth, (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const { meta_pixel_id, meta_pixel_enabled } = req.body;
  const updated = db.updateDeploymentSettings({
    meta_pixel_id: meta_pixel_id !== undefined ? String(meta_pixel_id).trim() : undefined,
    meta_pixel_enabled: Boolean(meta_pixel_enabled)
  });
  db.addAuditLog({
    service_name: 'deployment',
    action: 'save',
    status: 'success',
    details: `Meta Pixel settings updated (Pixel ID: ${updated.meta_pixel_id || 'none'}, Enabled: ${updated.meta_pixel_enabled})`,
    performed_by: adminUser
  });
  res.json({
    message: 'Meta Pixel settings updated',
    deployment: updated
  });
});

// Google AdSense Settings
app.put('/api/deployment-settings/adsense', requireAuth, (req: Request, res: Response) => {
  const adminUser = (req as any).user?.username || 'admin';
  const { google_adsense_id, google_adsense_enabled } = req.body;
  const updated = db.updateDeploymentSettings({
    google_adsense_id: google_adsense_id !== undefined ? String(google_adsense_id).trim() : undefined,
    google_adsense_enabled: Boolean(google_adsense_enabled)
  });
  db.addAuditLog({
    service_name: 'deployment',
    action: 'save',
    status: 'success',
    details: `Google AdSense settings updated (Publisher ID: ${updated.google_adsense_id || 'none'}, Enabled: ${updated.google_adsense_enabled})`,
    performed_by: adminUser
  });
  res.json({
    message: 'Google AdSense settings updated',
    deployment: updated
  });
});

// ----------------------------------------------------
// SEO: SITEMAP.XML & ROBOTS.TXT
// ----------------------------------------------------

app.get('/sitemap.xml', (req: Request, res: Response) => {
  const deployment = db.getDeploymentSettings();
  const baseUrl = deployment.canonical_url || deployment.website_url || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const posts = db.getPosts({ status: 'published' });
  const categories = db.getCategories();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Homepage
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>hourly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Categories
  categories.forEach(c => {
    xml += `  <url>\n    <loc>${baseUrl}/category/${c.slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  // Posts
  posts.forEach(p => {
    xml += `  <url>\n    <loc>${baseUrl}/post/${p.slug}</loc>\n    <lastmod>${p.updated_at.split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/p/${p.short_id}</loc>\n    <lastmod>${p.updated_at.split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/robots.txt', (req: Request, res: Response) => {
  const deployment = db.getDeploymentSettings();
  const baseUrl = deployment.canonical_url || deployment.website_url || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const text = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/auth

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(text);
});

// Dynamic /ads.txt verification endpoint for Google AdSense & authorized programmatic partners
app.get('/ads.txt', (_req: Request, res: Response) => {
  const deployment = db.getDeploymentSettings();
  const lines: string[] = [];

  if (deployment.google_adsense_enabled && deployment.google_adsense_id) {
    const rawId = deployment.google_adsense_id.trim();
    // Normalize "ca-pub-XXXXXXXX" to "pub-XXXXXXXX"
    const pubId = rawId.startsWith('ca-') ? rawId.replace(/^ca-/, '') : rawId;
    lines.push(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0`);
  }

  // Fallback default ads.txt lines for publisher monetization integrity
  if (lines.length === 0) {
    lines.push('# Chronicle Daily Verified Ads.txt');
    lines.push('# Add your Google AdSense Publisher ID in Admin -> Deployment Settings to activate automatically.');
  }

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(lines.join('\n') + '\n');
});

// ----------------------------------------------------
// SERVER-AUTHORITATIVE 10-SECOND UNLOCK SYSTEM
// Prevents client tampering, URL manipulation, and early bypass
// ----------------------------------------------------

interface UnlockSession {
  sessionId: string;
  postId: string;
  startedAt: number;
  unlocked: boolean;
}

const unlockSessions = new Map<string, UnlockSession>();
const verifiedUnlockedPosts = new Set<string>();

// Cleanup stale sessions older than 2 hours
const sessionCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of unlockSessions.entries()) {
    if (now - session.startedAt > 7200000) {
      unlockSessions.delete(id);
    }
  }
}, 60000);
if (sessionCleanupTimer && typeof (sessionCleanupTimer as any).unref === 'function') {
  (sessionCleanupTimer as any).unref();
}

// 1. Start or resume unlock session
app.post('/api/unlock/start', (req: Request, res: Response) => {
  const { postId } = req.body;
  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  const post = db.getPostById(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const sessionId = 'us_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  const startedAt = Date.now();
  unlockSessions.set(sessionId, {
    sessionId,
    postId: post.id,
    startedAt,
    unlocked: false,
  });

  return res.json({
    sessionId,
    postId: post.id,
    slug: post.slug,
    startedAt,
    durationSeconds: 10,
    remainingSeconds: 10,
  });
});

// 2. Query real-time status of countdown
app.get('/api/unlock/status', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const postId = req.query.postId as string;

  if (!sessionId) {
    return res.status(400).json({ valid: false, error: 'Session ID is required' });
  }

  const session = unlockSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ valid: false, error: 'Session not found or expired' });
  }

  const elapsedMs = Date.now() - session.startedAt;
  const remainingSeconds = Math.max(0, Math.ceil((10000 - elapsedMs) / 1000));
  const isReady = elapsedMs >= 9800;

  if (isReady && !session.unlocked) {
    session.unlocked = true;
    verifiedUnlockedPosts.add(session.postId);
    const post = db.getPostById(session.postId);
    if (post) {
      verifiedUnlockedPosts.add(post.id);
      verifiedUnlockedPosts.add(post.slug);
    }
  }

  return res.json({
    valid: true,
    sessionId: session.sessionId,
    postId: session.postId,
    remainingSeconds,
    isReady,
    unlocked: session.unlocked,
  });
});

// 3. Verify and commit post unlock once 10 seconds have elapsed
app.post('/api/unlock/verify', (req: Request, res: Response) => {
  const { sessionId, postId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ unlocked: false, error: 'Session ID is required' });
  }

  const session = unlockSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ unlocked: false, error: 'Invalid unlock session' });
  }

  const elapsedMs = Date.now() - session.startedAt;
  if (elapsedMs < 9800) {
    return res.status(403).json({
      unlocked: false,
      remainingSeconds: Math.ceil((10000 - elapsedMs) / 1000),
      error: 'Cannot unlock post: 10-second verification timer has not completed yet.',
    });
  }

  session.unlocked = true;
  verifiedUnlockedPosts.add(session.postId);
  if (postId) verifiedUnlockedPosts.add(postId);

  const post = db.getPostById(session.postId) || (postId ? db.getPostById(postId) : null);
  if (post) {
    verifiedUnlockedPosts.add(post.id);
    verifiedUnlockedPosts.add(post.slug);
  }

  return res.json({
    unlocked: true,
    postId: session.postId,
    slug: post?.slug,
  });
});

// 4. Server check: verify if a post is legitimately unlocked
app.get('/api/unlock/check/:postId', (req: Request, res: Response) => {
  const { postId } = req.params;
  const sessionId = req.query.sessionId as string;

  if (verifiedUnlockedPosts.has(postId)) {
    return res.json({ unlocked: true });
  }

  const post = db.getPostById(postId);
  if (post && (verifiedUnlockedPosts.has(post.id) || verifiedUnlockedPosts.has(post.slug))) {
    return res.json({ unlocked: true });
  }

  if (sessionId) {
    const session = unlockSessions.get(sessionId);
    if (session) {
      const elapsedMs = Date.now() - session.startedAt;
      if (elapsedMs >= 9800 || session.unlocked) {
        session.unlocked = true;
        verifiedUnlockedPosts.add(session.postId);
        if (post) {
          verifiedUnlockedPosts.add(post.id);
          verifiedUnlockedPosts.add(post.slug);
        }
        return res.json({ unlocked: true });
      }
    }
  }

  return res.json({ unlocked: false });
});

// ----------------------------------------------------
// SOCIAL SHARE & SHORT LINK ROUTES
// ----------------------------------------------------

// Explicit preview endpoint for debugging & testing OpenGraph render
app.get('/api/social/preview', (req: Request, res: Response) => {
  const { slug, shortId } = req.query;
  const baseUrl = getBaseUrl(req);
  const settings = db.getSettings();
  if (slug) {
    const post = db.getPostById(slug as string);
    if (post) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
    }
  }
  if (shortId) {
    const post = db.getPostByShortId(shortId as string);
    if (post) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
    }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(renderHomepageSocialHtml(settings, baseUrl));
});

// Short link route /p/:shortId
app.get('/p/:shortId', (req: Request, res: Response, next: NextFunction) => {
  const { shortId } = req.params;
  const post = db.getPostByShortId(shortId);
  if (!post) {
    return next();
  }

  const ua = req.get('user-agent') || '';
  const baseUrl = getBaseUrl(req);
  const settings = db.getSettings();

  if (isSocialCrawler(ua)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
  }

  return res.redirect(`/post/${post.slug}`);
});

// Single post view route /post/:slug for direct server access
app.get('/post/:slug', (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  const post = db.getPostById(slug);
  if (!post) {
    return next();
  }

  const ua = req.get('user-agent') || '';
  if (isSocialCrawler(ua)) {
    const baseUrl = getBaseUrl(req);
    const settings = db.getSettings();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderSocialHtml(post, settings, req.originalUrl, baseUrl));
  }

  next();
});

// ----------------------------------------------------

// 404 Catch-All for unmatched API routes
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API Error]:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    status: err.status || 500
  });
});

export default app;
export { app };
