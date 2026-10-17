# Professional Full Stack News Website & Media Portal

A complete, production-grade Full Stack News Portal and Media Network built with **React, TypeScript, Express, Supabase (PostgreSQL), and Cloudinary**, featuring an all-inclusive **Admin Panel** where the entire website can be fully controlled without touching code.

---

## 🚀 Key Features

### 1. Complete Admin Panel (Full Website Control)
- **Website Settings**:
  - Live Website Name & Tagline
  - Custom Logo & Favicon
  - Primary, Secondary, and Accent Color Themes
  - Header Design Variants (*Editorial Masthead*, *Classic Portal*, *Modern Minimalist*)
  - Footer Design Variants (*Multi-Column*, *Compact*)
  - Font Family Switching (*Playfair Display*, *Instrument Serif*, *Merriweather*, *Plus Jakarta Sans*)
  - Social Media Links (*Facebook, Twitter/X, Instagram, YouTube, Telegram, WhatsApp*)
  - Bureau Contact Information & Legal Copyright
  - All changes apply instantly on the live portal!

### 2. Universal Content Publishing System ("Create Content")
- A unified publishing engine supporting:
  - **News**
  - **Drama**
  - **Movies**
  - **Funny Videos**
  - **Entertainment**
  - **Short Videos**
  - **In-Depth Articles**
- **Smart Media Source (Embed & External Media)**:
  - Automatically detects & responsively displays:
    - YouTube URLs & Shorts
    - Facebook Videos & Reels
    - TikTok URLs
    - Instagram Posts & Reels
    - Vimeo URLs
    - Direct MP4 / WebM / OGG Video URLs
    - Raw `<iframe>` codes, embed scripts, and HTML source
- **Device Upload & Auto-Thumbnail**:
  - Upload photos and videos directly from your phone, tablet, or desktop.
  - Custom thumbnail upload or auto-extracted thumbnail from platform/video.

### 3. Skip Ad Monetization System (Smart Link)
- Activates exclusively when a visitor opens a post.
- Dark backdrop blur with **Admin-Controlled Overlay Opacity** (e.g. 88%).
- Central action button opening the mandatory Smart Link:
  `https://www.profitableratecpmnetwork.com/u7c83wtb?key=8ad40353f84fe993feb17e6ca4a03326`
- Notice: *Click "Skip Ad" to view a short ad and unlock this content.*
- Automatically unlocks and reveals the full article after interaction.

### 4. Required Advertisement Codes & Manager
All network ads are integrated cleanly:
- **Popunder Ad**: Hidden click trigger attached to the Homepage.
- **Native Banner Ad**: Embedded naturally inside the Homepage editorial feed.
- **Social Bar Ad**: Floating bottom bar with dismiss option.
- **Banner Ad 1 (728×90)**: Below Top Header.
- **Banner Ad 2 (160×300)**: Article & category sidebars.
- **Banner Ad 3 (300×250)**: Sidebar medium rectangle.
- **Banner Ad 4 (468×60)**: Between content in-feed.
- **Banner Ad 5 (320×50)**: Mobile bottom sticky banner.
- **Dedicated Advertisement Manager**: Add, edit, toggle on/off, or change positions of any ad slot without writing code!

### 5. Automatic Short Link System
- Every published post receives an automatic short URL:
  `https://yourdomain.com/p/a1b2c3`
- Instant **Copy Link** and **Copy Short Link** buttons for every dispatch.

### 6. Social Share Previews (Open Graph & Twitter Cards)
- Server-side and client-side dynamic Open Graph & Twitter Cards:
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type=article`
  - `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
  - JSON-LD `NewsArticle` Schema.org markup.
- Automatic rich preview cards on Facebook, WhatsApp, Telegram, X, Discord, LinkedIn, and iMessage.

### 7. Performance, SEO & Security
- **Dynamic XML Sitemap**: `/sitemap.xml`
- **Dynamic Robots.txt**: `/robots.txt`
- **JWT Authentication**: Secure Bearer tokens & session verification.
- **Admin Security**: Change username and password directly from the Admin Panel.

---

## 📂 Project Structure

```
├── server.ts                 # Full-stack Express backend with API routes, SSR social previews & Vite middlewares
├── server/
│   ├── db.ts                 # Persistent database manager & default seeds
│   └── supabase.ts           # Supabase PostgreSQL client adapter
├── supabase_schema.sql       # Full PostgreSQL database schema for Supabase
├── src/
│   ├── main.tsx              # React DOM entry point
│   ├── App.tsx               # Main application router & view manager
│   ├── index.css             # Tailwind CSS & dynamic editorial theme variables
│   ├── types/
│   │   └── index.ts          # Comprehensive TypeScript interfaces
│   ├── services/
│   │   ├── api.ts            # Client API client & JWT token management
│   │   └── mediaDetector.ts  # Universal media detection & auto-thumbnail generator
│   ├── context/
│   │   └── WebsiteContext.tsx# Global settings, theme variables, and auth state
│   ├── components/
│   │   ├── layout/           # Header, Navigation, Footer
│   │   ├── news/             # HeroSection, NewsCard, MediaViewer, CategoryFeed, BreakingTicker
│   │   ├── ads/              # AdSlot, SkipAdModal, PopunderTrigger, SocialBarAd
│   │   └── seo/              # SEOHead (Dynamic meta tags & JSON-LD schema)
│   └── pages/
│       ├── HomePage.tsx      # Master homepage with 3-tier editorial salience
│       ├── ArticlePage.tsx   # Single post view with Skip Ad & comments
│       ├── CategoryPage.tsx  # Desk / Category filtered archive
│       ├── SearchPage.tsx    # Live keyword search & category filters
│       └── admin/            # Complete 10-tab Admin Console
└── README.md
```

---

## 🔐 Default Admin Credentials

Upon initial launch, you can sign in to the Admin Console using:

- **Login URL**: `/admin` (or click "Staff Login" in top header / footer)
- **Username**: `admin`
- **Password**: `admin123`

*You can update your username and password anytime in **Admin Console &rarr; Profile**.*

---

## 🗄️ Supabase PostgreSQL Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Paste the contents of `supabase_schema.sql` and run the query.
4. Copy your project URL and API keys to your `.env` file:
   ```env
   SUPABASE_URL="https://xxxxxxxx.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

*Note: The website works out-of-the-box using the built-in persistent local database (`data/news_db.json`), so Supabase is entirely optional.*

---

## ☁️ Cloudinary Integration

To route uploaded media assets to Cloudinary:
1. Obtain your Cloudinary credentials from your [Cloudinary Console](https://cloudinary.com).
2. Configure `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

---

## 🚢 Deployment Guide (Vercel & Node.js)

### Deploying to Vercel
1. Push this repository to GitHub or GitLab.
2. In the Vercel dashboard, click **Add New Project** and import the repository.
3. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables in Vercel Project Settings:
   - `JWT_SECRET`
   - `APP_URL`
   - `SUPABASE_URL` (optional)
   - `SUPABASE_ANON_KEY` (optional)
5. Deploy!
