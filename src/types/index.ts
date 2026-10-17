export type ContentType = 
  | 'news' 
  | 'drama' 
  | 'movies' 
  | 'funny' 
  | 'entertainment' 
  | 'short_video' 
  | 'article';

export type MediaType = 
  | 'youtube' 
  | 'facebook' 
  | 'tiktok' 
  | 'instagram' 
  | 'vimeo' 
  | 'video_url' 
  | 'embed_code' 
  | 'image' 
  | 'none';

export interface Post {
  id: string;
  short_id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category_id: string;
  category_name?: string;
  content_type: ContentType;
  media_source: string;
  media_type: MediaType;
  thumbnail_url: string;
  status: 'published' | 'draft';
  views: number;
  author: string;
  created_at: string;
  updated_at: string;
  read_time?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  post_count?: number;
}

export type AdPosition = 
  | 'header_728x90' 
  | 'sidebar_160x300' 
  | 'sidebar_300x250' 
  | 'between_content_468x60' 
  | 'mobile_bottom_320x50' 
  | 'native_feed' 
  | 'social_bar' 
  | 'popunder' 
  | 'skip_ad';

export interface Ad {
  id: string;
  name: string;
  position: AdPosition;
  code: string;
  is_active: boolean;
  width?: number | string;
  height?: number | string;
  description?: string;
  created_at: string;
}

export interface WebsiteSettings {
  website_name: string;
  website_tagline: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_design: 'classic' | 'minimal' | 'editorial';
  footer_design: 'columns' | 'compact';
  font_family: 'playfair' | 'instrument' | 'merriweather' | 'sans';
  social_links: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    telegram: string;
    whatsapp: string;
  };
  contact_info: {
    email: string;
    phone: string;
    address: string;
  };
  copyright_text: string;
  comments_enabled: boolean;
  skip_ad_enabled: boolean;
  skip_ad_opacity: number;
  skip_ad_link: string;
  meta_keywords: string;
  meta_description: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'thumbnail';
  url: string;
  thumbnail_url?: string;
  size?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  name: string;
  role: 'admin';
  avatar?: string;
  recovery_key?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
  status: 'approved' | 'pending';
}

export interface AnalyticsSummary {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  daily_views: { date: string; views: number }[];
  views_by_category: { category: string; views: number }[];
  recent_posts: Post[];
  top_posts: Post[];
  ad_status: { position: AdPosition; is_active: boolean; name: string }[];
}

export type CloudServiceStatus = 'connected' | 'failed' | 'not_configured' | 'testing';

export interface SupabaseConfigView {
  service_name: 'supabase';
  project_url: string;
  project_id: string;
  anon_key: string;
  service_role_key_masked: string;
  has_service_role_key: boolean;
  schema: string;
  is_enabled: boolean;
  status: CloudServiceStatus;
  status_message?: string;
  last_tested_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface CloudinaryConfigView {
  service_name: 'cloudinary';
  cloud_name: string;
  api_key: string;
  api_secret_masked: string;
  has_api_secret: boolean;
  upload_preset?: string;
  folder_name: string;
  is_enabled: boolean;
  status: CloudServiceStatus;
  status_message?: string;
  last_tested_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface CloudServiceAuditLog {
  id: string;
  service_name: string;
  action: 'save' | 'test' | 'toggle' | 'reset';
  status: 'success' | 'failed';
  details: string;
  performed_by: string;
  timestamp: string;
}

export interface CloudServicesOverview {
  supabase: SupabaseConfigView;
  cloudinary: CloudinaryConfigView;
  audit_logs: CloudServiceAuditLog[];
}

export interface DeploymentSettings {
  primary_domain: string;
  website_url: string;
  canonical_url: string;
  google_search_console_code: string;
  google_analytics_id: string;
  google_analytics_enabled: boolean;
  meta_pixel_id: string;
  meta_pixel_enabled: boolean;
  google_adsense_id: string;
  google_adsense_enabled: boolean;
}

export interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password?: string;
  encryption: 'tls' | 'ssl' | 'none';
  from_email: string;
  from_name: string;
  is_enabled: boolean;
  status?: CloudServiceStatus;
  status_message?: string;
  last_tested_at?: string;
}

export interface SmtpSettingsView {
  host: string;
  port: number;
  username: string;
  password_masked: string;
  has_password: boolean;
  encryption: 'tls' | 'ssl' | 'none';
  from_email: string;
  from_name: string;
  is_enabled: boolean;
  status?: CloudServiceStatus;
  status_message?: string;
  last_tested_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface DeploymentOverview {
  deployment: DeploymentSettings;
  smtp: SmtpSettingsView;
}


