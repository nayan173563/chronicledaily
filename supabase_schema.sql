-- ====================================================================
-- Professional Full Stack News Website - Master Database Schema
-- Compatible with Supabase (PostgreSQL 15+)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(30) DEFAULT '#0f172a',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id VARCHAR(80) PRIMARY KEY,
    short_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(350) UNIQUE NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    content_type VARCHAR(50) DEFAULT 'news', -- 'news' | 'drama' | 'movies' | 'funny' | 'entertainment' | 'short_video' | 'article'
    media_source TEXT,
    media_type VARCHAR(50) DEFAULT 'none', -- 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'vimeo' | 'video_url' | 'embed_code' | 'image' | 'none'
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'published', -- 'published' | 'draft'
    views BIGINT DEFAULT 0,
    author VARCHAR(120) DEFAULT 'Chief Editor',
    read_time VARCHAR(50) DEFAULT '4 min read',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_short_id ON public.posts(short_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 5. ADVERTISEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.ads (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    position VARCHAR(50) NOT NULL, -- 'header_728x90', 'sidebar_160x300', 'sidebar_300x250', 'between_content_468x60', 'mobile_bottom_320x50', 'native_feed', 'social_bar', 'popunder', 'skip_ad'
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    width VARCHAR(20),
    height VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current_settings',
    website_name VARCHAR(200) NOT NULL,
    website_tagline TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(30) DEFAULT '#0f172a',
    secondary_color VARCHAR(30) DEFAULT '#475569',
    accent_color VARCHAR(30) DEFAULT '#b91c1c',
    header_design VARCHAR(50) DEFAULT 'editorial',
    footer_design VARCHAR(50) DEFAULT 'columns',
    font_family VARCHAR(50) DEFAULT 'playfair',
    social_links JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    copyright_text TEXT,
    comments_enabled BOOLEAN DEFAULT true,
    skip_ad_enabled BOOLEAN DEFAULT true,
    skip_ad_opacity NUMERIC(3,2) DEFAULT 0.88,
    skip_ad_link TEXT,
    meta_keywords TEXT,
    meta_description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. MEDIA LIBRARY TABLE
CREATE TABLE IF NOT EXISTS public.media (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'image' | 'video' | 'thumbnail'
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    size VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id VARCHAR(50) PRIMARY KEY,
    post_id VARCHAR(80) REFERENCES public.posts(id) ON DELETE CASCADE,
    author_name VARCHAR(120) NOT NULL,
    author_email VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- 9. ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.analytics (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    page_views BIGINT DEFAULT 0,
    unique_visitors BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published posts, categories, ads, settings, and comments (Idempotent safe)
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Ads" ON public.ads;
CREATE POLICY "Public Read Ads" ON public.ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Settings" ON public.settings;
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Comments" ON public.comments;
CREATE POLICY "Public Read Comments" ON public.comments FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Public Submit Comments" ON public.comments;
CREATE POLICY "Public Submit Comments" ON public.comments FOR INSERT WITH CHECK (true);

-- Allow full administrative permissions
DROP POLICY IF EXISTS "Admin Full Access Posts" ON public.posts;
CREATE POLICY "Admin Full Access Posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Full Access Categories" ON public.categories;
CREATE POLICY "Admin Full Access Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Full Access Settings" ON public.settings;
CREATE POLICY "Admin Full Access Settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Full Access Ads" ON public.ads;
CREATE POLICY "Admin Full Access Ads" ON public.ads FOR ALL USING (true) WITH CHECK (true);
