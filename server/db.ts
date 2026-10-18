import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as nodeModule from 'module';
const nodeRequire = typeof require !== 'undefined' ? require : (nodeModule.createRequire || (nodeModule.default && nodeModule.default.createRequire))(import.meta.url);
let bundledDbData: any = null;
try {
  bundledDbData = nodeRequire('../data/news_db.json');
} catch (e) {
  bundledDbData = null;
}
import { Post, Category, Ad, WebsiteSettings, MediaItem, Comment, DeploymentSettings, SmtpSettings, SmtpSettingsView } from '../src/types';
import { encryptCredentials, decryptCredentials, maskKey } from './crypto';
import { cloudServices } from './cloudServices';

const SEED_FILE = path.resolve(process.cwd(), 'data', 'news_db.json');
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
const DB_FILE = process.env.VERCEL ? path.join(DATA_DIR, 'news_db.json') : SEED_FILE;

export interface DatabaseSchema {
  admin: {
    id: string;
    username: string;
    password_hash: string;
    email: string;
    phone?: string;
    name: string;
    avatar: string;
    recovery_key?: string;
  };
  settings: WebsiteSettings;
  deployment_settings?: DeploymentSettings;
  categories: Category[];
  posts: Post[];
  ads: Ad[];
  media: MediaItem[];
  comments: Comment[];
  system_settings: {
    id: string;
    service_name: string;
    encrypted_credentials: string;
    is_enabled: boolean;
    status?: 'connected' | 'failed' | 'not_configured' | 'testing';
    status_message?: string;
    last_tested_at?: string;
    updated_at: string;
    updated_by: string;
  }[];
  audit_logs: {
    id: string;
    service_name: string;
    action: 'save' | 'test' | 'toggle' | 'reset';
    status: 'success' | 'failed';
    details: string;
    performed_by: string;
    timestamp: string;
  }[];
  analytics: {
    total_views: number;
    daily_views: { [dateKey: string]: number };
    post_views: { [postId: string]: number };
  };
}

export function hashPassword(password: string): string {
  const salt = 'chronicle_salt_2026_secure';
  const derived = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
  return `pbkdf2$10000$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;
  if (storedHash.startsWith('pbkdf2$10000$')) {
    const salt = 'chronicle_salt_2026_secure';
    const derived = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
    return storedHash === `pbkdf2$10000$${derived}`;
  }
  // Backward compatibility with legacy SHA-256 hash
  const legacyHash = crypto.createHash('sha256').update(password + '_chronicle_salt_2026').digest('hex');
  return legacyHash === storedHash;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'National', slug: 'national', description: 'Domestic governance, policy, civic updates and national developments', color: '#1E3A8A' },
  { id: 'cat-2', name: 'International', slug: 'international', description: 'Global geopolitics, international relations and world affairs', color: '#0F766E' },
  { id: 'cat-3', name: 'Politics', slug: 'politics', description: 'Legislative hearings, elections, political analysis and debates', color: '#B91C1C' },
  { id: 'cat-4', name: 'Sports', slug: 'sports', description: 'Championship highlights, athletic analysis, and global tournaments', color: '#C2410C' },
  { id: 'cat-5', name: 'Entertainment', slug: 'entertainment', description: 'Pop culture, red carpet premieres, and celebrity features', color: '#7E22CE' },
  { id: 'cat-6', name: 'Technology', slug: 'technology', description: 'Artificial intelligence, deep tech breakthroughs, and scientific compute', color: '#2563EB' },
  { id: 'cat-7', name: 'Funny', slug: 'funny', description: 'Hilarious viral clips, internet memes, and lighthearted satire', color: '#EAB308' },
  { id: 'cat-8', name: 'Drama', slug: 'drama', description: 'High-stakes serialized productions, theatrical recaps, and stories', color: '#BE185D' },
  { id: 'cat-9', name: 'Movies', slug: 'movies', description: 'Cinema reviews, theatrical box office dispatches, and director spotlights', color: '#4338CA' },
];

const DEFAULT_ADS: Ad[] = [
  {
    id: 'ad-header',
    name: 'Top Header Leaderboard (728×90)',
    position: 'header_728x90',
    width: 728,
    height: 90,
    is_active: true,
    code: `<script>
atOptions={
'key':'7ebbe04197a14538d45f70e760f68a3f',
'format':'iframe',
'height':90,
'width':728,
'params':{}
};
</script>
<script src="https://www.highrevenueformat.com/7ebbe04197a14538d45f70e760f68a3f/invoke.js"></script>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-sidebar-160x300',
    name: 'Sidebar Skyscraper (160×300)',
    position: 'sidebar_160x300',
    width: 160,
    height: 300,
    is_active: true,
    code: `<script>
atOptions={
'key':'589a9400a510f9963e4e458538cb351d',
'format':'iframe',
'height':300,
'width':160,
'params':{}
};
</script>
<script src="https://www.highrevenueformat.com/589a9400a510f9963e4e458538cb351d/invoke.js"></script>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-sidebar-300x250',
    name: 'Sidebar Medium Rectangle (300×250)',
    position: 'sidebar_300x250',
    width: 300,
    height: 250,
    is_active: true,
    code: `<script>
atOptions={
'key':'0e09b0c245656a60b6d301dd99919ef0',
'format':'iframe',
'height':250,
'width':300,
'params':{}
};
</script>
<script src="https://www.highrevenueformat.com/0e09b0c245656a60b6d301dd99919ef0/invoke.js"></script>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-between-content',
    name: 'Between Content In-Feed Banner (468×60)',
    position: 'between_content_468x60',
    width: 468,
    height: 60,
    is_active: true,
    code: `<script>
atOptions={
'key':'b21410fad7b56068484dba3f5c35d1ca',
'format':'iframe',
'height':60,
'width':468,
'params':{}
};
</script>
<script src="https://www.highrevenueformat.com/b21410fad7b56068484dba3f5c35d1ca/invoke.js"></script>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-mobile-bottom',
    name: 'Mobile Bottom Sticky Banner (320×50)',
    position: 'mobile_bottom_320x50',
    width: 320,
    height: 50,
    is_active: true,
    code: `<script>
atOptions={
'key':'11985295471a3c84d6a142bbb77fbaf1',
'format':'iframe',
'height':50,
'width':320,
'params':{}
};
</script>
<script src="https://www.highrevenueformat.com/11985295471a3c84d6a142bbb77fbaf1/invoke.js"></script>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-native-feed',
    name: 'Native In-Feed Sponsored Placement',
    position: 'native_feed',
    is_active: true,
    code: `<script async="async" data-cfasync="false" src="https://pl20628124.profitableratecpmnetwork.com/d664d2cc860385fa5df7ceb172eacf6b/invoke.js"></script>
<div id="container-d664d2cc860385fa5df7ceb172eacf6b"></div>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-social-bar',
    name: 'Floating Bottom Social Bar',
    position: 'social_bar',
    is_active: true,
    code: `<script src="https://pl20654735.profitableratecpmnetwork.com/b2/c4/dd/b2c4ddb89f881de77ddd596f9bfa41a7.js"></script>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-popunder',
    name: 'Homepage Hidden Click Popunder Trigger',
    position: 'popunder',
    is_active: true,
    code: `<script src="https://pl20627952.profitableratecpmnetwork.com/0e/5f/b9/0e5fb9407ed47dd6605faa50654a4022.js"></script>`,
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-skip-ad',
    name: 'Smart Link Skip Ad Gate',
    position: 'skip_ad',
    is_active: true,
    code: `https://www.profitableratecpmnetwork.com/u7c83wtb?key=8ad40353f84fe993feb17e6ca4a03326`,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS: WebsiteSettings = {
  website_name: 'The Daily Chronicle',
  website_tagline: 'Independent Journal of Record & Global Media Dispatch',
  logo_url: '',
  favicon_url: '',
  primary_color: '#0f172a', // Slate 900
  secondary_color: '#475569', // Slate 600
  accent_color: '#b91c1c', // Crimson Red
  header_design: 'editorial', // 'classic' | 'minimal' | 'editorial'
  footer_design: 'columns',
  font_family: 'playfair',
  social_links: {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    telegram: 'https://telegram.org',
    whatsapp: 'https://whatsapp.com'
  },
  contact_info: {
    email: 'editorial@chronicle-daily.org',
    phone: '+1 (555) 234-8900',
    address: '450 Lexington Avenue, 18th Floor, New York, NY 10017'
  },
  copyright_text: '© 2026 The Daily Chronicle Publishing Group Inc. All rights reserved. Registered with International Press Association.',
  comments_enabled: true,
  skip_ad_enabled: true,
  skip_ad_opacity: 0.88,
  skip_ad_link: 'https://www.profitableratecpmnetwork.com/u7c83wtb?key=8ad40353f84fe993feb17e6ca4a03326',
  meta_keywords: 'breaking news, world politics, international diplomacy, technology news, investigative reporting, entertainment dispatch, box office cinema',
  meta_description: 'The Daily Chronicle provides verified investigative journalism, high-resolution media reports, and breaking world dispatches.'
};

const DEFAULT_POSTS: Post[] = [
  {
    id: 'post-1',
    short_id: 'n7k2m9',
    title: 'Global Summit Reaches Historic Treaty on Autonomous Oceanic Carbon Sequestration',
    slug: 'global-summit-oceanic-carbon-sequestration',
    description: 'Ministers from 64 maritime nations convene in Geneva to ratify unified protocols governing deep-sea mineral rights and algorithmic oceanic bioreactors.',
    content: `GENEVA — In what international observers are characterizing as the most consequential environmental treaty of the decade, delegates representing 64 maritime powers finalized the Geneva Accords on Automated Oceanic Remediation early Saturday morning.

The treaty establishes strict jurisdictional oversight regarding autonomous robotic fleets deploying mineral-based alkalinity enhancement across international waters. The framework sets binding limits on high-seas micro-dosing and requires real-time cryptographic telemetry to be transmitted publicly to the International Maritime Organization.

"We have crossed the threshold from speculative geo-engineering to regulated planetary stewardship," stated Elena Vance, lead negotiator for the Mediterranean Environmental Council. "The technology is no longer in laboratory limbo; it is currently operating in the South Pacific, and today's framework guarantees accountability."

Key points of the consensus include:
- Mandatory open-source data telemetry for all robotic surface buoys.
- A moratorium on unverified ocean-bottom iron fertilizations until 2030.
- A multi-billion-dollar restitution reserve sponsored by high-emission nations to support island territories.

The agreement comes following an eighteen-month scientific review confirming that controlled calcification can accelerate ocean carbon absorption without disrupting pelagic food webs. Commercial deployments are scheduled to transition under the newly formed council starting next quarter.`,
    category_id: 'cat-2',
    category_name: 'International',
    content_type: 'news',
    media_source: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    media_type: 'youtube',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 14280,
    author: 'Julian Sterling',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    read_time: '5 min read'
  },
  {
    id: 'post-2',
    short_id: 't8x4w1',
    title: 'Silicon Architecture Revolution: Next-Generation Photonic Neural Compute Achieves 100x Efficiency',
    slug: 'next-gen-photonic-neural-compute-breakthrough',
    description: 'A coalition of academic laboratories and semiconductor fabrication consortiums confirms first commercial wafer utilizing coherent laser interconnects.',
    content: `SANTA CLARA — Optical computing researchers have cleared what many believed was an insurmountable engineering hurdle: maintaining phase coherence across 4,096 optical tensor cores on standard commercial silicon-on-insulator wafers.

The newly demonstrated processor replaces metal copper interconnects with laser waveguides, reducing thermal throttling and power consumption by roughly two orders of magnitude compared to current leading accelerator architectures.

During benchmark testing supervised by the National Supercomputing Facility, the 16nm hybrid photonic unit completed large language training operations at 180 teraflops per watt, effectively solving the grid-level power constraints that have plagued modern hyperscale datacenter expansion.

Industry analysts predict the architecture could reach pilot data centers as early as late 2027, drastically altering the capital expenditure landscape for cloud infrastructure providers globally.`,
    category_id: 'cat-6',
    category_name: 'Technology',
    content_type: 'news',
    media_source: 'https://www.youtube.com/watch?v=0hbb33w4mXk',
    media_type: 'youtube',
    thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 9410,
    author: 'Dr. Sarah Lin',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    read_time: '4 min read'
  },
  {
    id: 'post-3',
    short_id: 'p3m9z8',
    title: 'Bipartisan Senate Panel Clears Comprehensive Federal Privacy & Digital Rights Act',
    slug: 'senate-panel-clears-privacy-digital-rights-act',
    description: 'The landmark legislation establishes strict algorithmic disclosure requirements, outlaws unauthorized biometric surveillance, and codifies consumer data deletion rights.',
    content: `WASHINGTON — Following months of closed-door negotiations between committee leaders, the Senate Judiciary Committee voted 19-3 on Thursday to send the American Digital Integrity and Privacy Act to the full Senate floor.

The bill represents the most significant overhaul of federal privacy guidelines in thirty years. It pre-empts a patchwork of conflicting state statutes while establishing rigorous standards modeled in part after European directives, with specific protections for algorithmic transparency and minors.

Chief among the bill's provisions is a statutory requirement that any commercial model making consequential legal, financial, or employment evaluations must provide human-interpretable audit logs upon formal inquiry.

"The era of opaque commercial data scraping without explicit affirmative consent is closing," remarked Ranking Member Senator Marcus Hayes during the post-vote briefing. The floor vote is anticipated within the next fortnight.`,
    category_id: 'cat-3',
    category_name: 'Politics',
    content_type: 'news',
    media_source: '',
    media_type: 'none',
    thumbnail_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 6520,
    author: 'Caroline Vance',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    read_time: '6 min read'
  },
  {
    id: 'post-4',
    short_id: 's2k1v5',
    title: 'World Athletics Championship: Underdog Relay Squad Breaks 16-Year Continental Record',
    slug: 'underdog-relay-breaks-continental-record',
    description: 'A masterclass in baton passing precision stuns the Olympic Stadium in Tokyo as the four-man contingent clocks 37.04 seconds in the final sprint.',
    content: `TOKYO — In an electrifying conclusion to the 4x100m relay finals, the four sprinters shattered decades of sports predictions by delivering flawless exchange zones and winning the gold medal with a record-setting split of 37.04 seconds.

Entering the tournament seeded fifth, the team credited intensive biometric stride synchronization and aerodynamic wind-tunnel testing conducted over winter training camp for their explosive transitions.

"We knew we couldn't rely solely on straight-line foot speed against the favorites," team captain Ronald Chen explained while draped in his country's flag. "Our entire advantage came from preserving velocity inside the 20-meter passing zone."

The silver medal went to the defending champions who finished merely 0.08 seconds behind in a photo finish that brought the 65,000 spectators to their feet.`,
    category_id: 'cat-4',
    category_name: 'Sports',
    content_type: 'news',
    media_source: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    media_type: 'youtube',
    thumbnail_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 8190,
    author: 'Marcus Brody',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    read_time: '3 min read'
  },
  {
    id: 'post-5',
    short_id: 'e9j7q3',
    title: 'Inside the Venice Biennale: A Monolithic Cinema Experience Filmed on 70mm Celluloid',
    slug: 'venice-biennale-70mm-cinema-experience',
    description: 'Director Clara Thorne unveils a three-hour sensory epic exploring forgotten arctic soundscapes and mechanical decay.',
    content: `VENICE — In the cavernous brick halls of the Arsenale, attendees at this year's International Exhibition were treated to the premier of *The Permafrost Echo*, an extraordinary cinematic installation captured entirely on rare 70mm Kodak stock.

The piece abandons traditional narrative dialogue in favor of hydrophone recordings taken beneath Greenland glaciers, juxtaposed against sweeping vistas of decommissioned radio telescope arrays.

Critics have lauded the film's refusal to succumb to rapid algorithmic editing tropes, calling it "a cathedral of light and reverberation that demands undivided physical attention." The exhibition runs through November before traveling to Tokyo and London.`,
    category_id: 'cat-9',
    category_name: 'Movies',
    content_type: 'movies',
    media_source: 'https://vimeo.com/76979871',
    media_type: 'vimeo',
    thumbnail_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 4830,
    author: 'Helena Berg',
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    read_time: '4 min read'
  },
  {
    id: 'post-6',
    short_id: 'f4h8c2',
    title: 'The Viral Golden Retriever Who Learned How to Ride the Tokyo Metro Escalators',
    slug: 'viral-golden-retriever-tokyo-escalators',
    description: 'Meet Hachi, the disciplined service dog whose polite etiquette and tail-wagging subway journeys have captivated over 40 million viewers worldwide.',
    content: `TOKYO — Commuters navigating the bustling Shibuya station corridors have grown accustomed to an endearing morning sight: a calm golden retriever named Hachi, who stands perfectly still on the right side of the escalator, allowing hurried commuters to pass on the left.

Trained as an emotional support companion for a local university professor, Hachi's innate habit of waiting for his signal before boarding the train has become a viral sensation across social networks.

"He takes public transit etiquette more seriously than most human passengers," remarked one amused station attendant. "He looks forward to his morning commute like it's his daily shift at work."`,
    category_id: 'cat-7',
    category_name: 'Funny',
    content_type: 'funny',
    media_source: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    media_type: 'youtube',
    thumbnail_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 22400,
    author: 'Kenji Sato',
    created_at: new Date(Date.now() - 3600000 * 32).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 32).toISOString(),
    read_time: '2 min read'
  },
  {
    id: 'post-7',
    short_id: 'd1w9y4',
    title: 'The Royal Theater Stages Provocative Modern Reimagining of Shakespeare’s Coriolanus',
    slug: 'royal-theater-coriolanus-modern-drama',
    description: 'Set within a hyper-militarized near future of media conglomerates, the new production highlights the volatile intersection of populism and patrician pride.',
    content: `LONDON — Director Simon McBurney’s electrifying new staging of *Coriolanus* at the Olivier Theatre strips away the conventional Roman togas in favor of tactical gear, television news monitors, and live handheld cameras projected onto a thirty-foot LED wall.

Starring award-winning actor David Oyelowo in the title role, the production presents the protagonist not simply as a disdainful patrician, but as a traumatized war machine unable to navigate the cynical artifice of modern electoral politics.

Audience members are surrounded by roving cameramen filming crowd reactions, forcing the spectators themselves to confront their complicity in the political spectacle. The sold-out run has extended its booking through late autumn.`,
    category_id: 'cat-8',
    category_name: 'Drama',
    content_type: 'drama',
    media_source: '',
    media_type: 'none',
    thumbnail_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 3120,
    author: 'Edward Fairfax',
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 40).toISOString(),
    read_time: '5 min read'
  },
  {
    id: 'post-8',
    short_id: 'a5r2x7',
    title: 'Central Bank Explores Digital Sovereign Liquidity Corridors with Cross-Border Settlement',
    slug: 'central-bank-digital-sovereign-liquidity-corridors',
    description: 'Treasury officials and foreign exchange ministers outline multi-currency testing aimed at bypassing legacy correspondent banking bottlenecks.',
    content: `FRANKFURT — The European Central Bank, in coordination with the Bank of Japan and the Monetary Authority of Singapore, has published the conclusive findings from Phase III of Project Meridian, demonstrating automated atomic settlement across three distinct sovereign digital currencies.

By leveraging distributed settlement contracts that lock liquidity instantaneously without intermediaries, the consortium achieved cross-border remittances in under 400 milliseconds, slashing transactional costs by an estimated 74 percent.

The trial involved twenty-two commercial banking institutions, executing over fifty thousand simulated stress-test trades under high volatility parameters without a single settlement failure. Regulatory bodies are now preparing draft policy frameworks for formal institutional rollout.`,
    category_id: 'cat-1',
    category_name: 'National',
    content_type: 'article',
    media_source: '',
    media_type: 'none',
    thumbnail_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 5290,
    author: 'Beatriz Morales',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    read_time: '4 min read'
  }
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    post_id: 'post-1',
    author_name: 'Arthur Pendelton',
    author_email: 'arthur@oceanic-inst.org',
    content: 'A monumental step forward. Transparent telemetry is the only way to avoid geopolitical disputes over open-sea interventions.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'approved'
  },
  {
    id: 'comm-2',
    post_id: 'post-2',
    author_name: 'Li Wei',
    author_email: 'wei.li@photonics.ac.cn',
    content: '180 teraflops per watt on standard SOI process will solve our data center power constraints if thermal drift is managed as reported.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'approved'
  }
];

const DEFAULT_DEPLOYMENT_SETTINGS: DeploymentSettings = {
  primary_domain: 'chronicle-daily.org',
  website_url: 'https://chronicle-daily.org',
  canonical_url: 'https://chronicle-daily.org',
  google_search_console_code: '',
  google_analytics_id: '',
  google_analytics_enabled: false,
  meta_pixel_id: '',
  meta_pixel_enabled: false,
  google_adsense_id: '',
  google_adsense_enabled: false,
};

const DEFAULT_SMTP: SmtpSettings = {
  host: 'smtp.gmail.com',
  port: 587,
  username: '',
  password: '',
  encryption: 'tls',
  from_email: 'noreply@chronicle-daily.org',
  from_name: 'Chronicle Daily Dispatches',
  is_enabled: false,
  status: 'not_configured',
  status_message: 'SMTP email server not yet configured'
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch {}
      }

      // Check writable database file (in /tmp on Vercel or data/ locally)
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.admin) return parsed;
      }

      // Check original seed file on disk if available
      if (fs.existsSync(SEED_FILE)) {
        const raw = fs.readFileSync(SEED_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.admin) {
          if (process.env.VERCEL) this.saveData(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Notice: Local database file not found on disk, initializing from bundled data:', e);
    }

    // Always fallback to bundledDbData - guaranteed to be compiled into the serverless bundle!
    try {
      if (bundledDbData && (bundledDbData as any).admin) {
        const dataCopy: DatabaseSchema = JSON.parse(JSON.stringify(bundledDbData));
        if (process.env.VERCEL) {
          this.saveData(dataCopy);
        }
        return dataCopy;
      }
    } catch (err) {
      console.warn('Notice: Failed reading bundled db:', err);
    }

    const initial: DatabaseSchema = {
      admin: this.getDefaultAdmin(),
      settings: DEFAULT_SETTINGS,
      deployment_settings: { ...DEFAULT_DEPLOYMENT_SETTINGS },
      categories: DEFAULT_CATEGORIES,
      posts: DEFAULT_POSTS,
      ads: DEFAULT_ADS,
      media: [],
      comments: DEFAULT_COMMENTS,
      system_settings: [],
      audit_logs: [
        {
          id: 'log-init',
          service_name: 'system',
          action: 'save',
          status: 'success',
          details: 'Runtime Configuration Engine initialized with AES-256 encryption',
          performed_by: 'system',
          timestamp: new Date().toISOString()
        }
      ],
      analytics: {
        total_views: 64430,
        daily_views: this.generateDailyViews(),
        post_views: {}
      }
    };

    this.saveData(initial);
    return initial;
  }

  private generateDailyViews(): { [dateKey: string]: number } {
    const res: { [dateKey: string]: number } = {};
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      res[key] = Math.floor(2800 + Math.random() * 3400);
    }
    return res;
  }

  private getDefaultAdmin() {
    return {
      id: 'admin-master-1',
      username: 'admin',
      password_hash: hashPassword('admin123'), // Default password changeable in admin panel
      email: 'editor@chronicle-daily.org',
      name: 'Chief Editor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
      phone: '+8801700000000',
      recovery_key: 'CR-REC-7899-2026'
    };
  }

  private saveData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      // In serverless read-only environment or /tmp limit, log warning instead of crashing
      console.warn('Notice: Could not persist database file in serverless container:', e);
    }
  }

  public save() {
    this.saveData(this.data);
  }

  public getAdmin() {
    if (!this.data.admin.recovery_key) {
      this.data.admin.recovery_key = 'CR-REC-7899-2026';
      this.save();
    }
    return this.data.admin;
  }

  public updateAdmin(updates: Partial<DatabaseSchema['admin']>) {
    this.data.admin = { ...this.data.admin, ...updates };
    this.save();
    return this.data.admin;
  }

  public getSettings(): WebsiteSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<WebsiteSettings>): WebsiteSettings {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
      social_links: settings.social_links
        ? { ...this.data.settings.social_links, ...settings.social_links }
        : this.data.settings.social_links,
      contact_info: settings.contact_info
        ? { ...this.data.settings.contact_info, ...settings.contact_info }
        : this.data.settings.contact_info,
    };
    this.save();
    return this.data.settings;
  }

  public getCategories(): Category[] {
    // calculate post count
    return this.data.categories.map(c => ({
      ...c,
      post_count: this.data.posts.filter(p => p.category_id === c.id && p.status === 'published').length
    }));
  }

  public createCategory(cat: Omit<Category, 'id'>): Category {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now().toString(36)
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.save();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.categories.splice(idx, 1);
    this.save();
    return true;
  }

  public getPosts(filter?: { category_id?: string; status?: string; search?: string; content_type?: string }): Post[] {
    let posts = [...this.data.posts];
    if (filter?.status) {
      posts = posts.filter(p => p.status === filter.status);
    }
    if (filter?.category_id) {
      posts = posts.filter(p => p.category_id === filter.category_id);
    }
    if (filter?.content_type) {
      posts = posts.filter(p => p.content_type === filter.content_type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.content.toLowerCase().includes(q)
      );
    }
    // Sort by created_at desc
    return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getPostById(id: string): Post | null {
    return this.data.posts.find(p => p.id === id || p.slug === id) || null;
  }

  public getPostByShortId(shortId: string): Post | null {
    return this.data.posts.find(p => p.short_id === shortId) || null;
  }

  public incrementPostView(idOrShortId: string): void {
    const post = this.data.posts.find(p => p.id === idOrShortId || p.short_id === idOrShortId || p.slug === idOrShortId);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.data.analytics.total_views = (this.data.analytics.total_views || 0) + 1;
      const today = new Date().toISOString().split('T')[0];
      this.data.analytics.daily_views[today] = (this.data.analytics.daily_views[today] || 0) + 1;
      this.data.analytics.post_views[post.id] = (this.data.analytics.post_views[post.id] || 0) + 1;
      this.save();
    }
  }

  public createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'views'>): Post {
    const cat = this.data.categories.find(c => c.id === post.category_id);
    const newPost: Post = {
      ...post,
      id: 'post-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      category_name: cat ? cat.name : 'General',
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.posts.unshift(newPost);
    this.save();

    // Asynchronously sync to Supabase if active
    if (cloudServices.isSupabaseActive()) {
      const client = cloudServices.getSupabaseClient();
      if (client) {
        client.from('posts').insert({
          id: newPost.id,
          short_id: newPost.short_id,
          title: newPost.title,
          slug: newPost.slug,
          description: newPost.description || '',
          content: newPost.content,
          category_id: newPost.category_id,
          content_type: newPost.content_type || 'news',
          media_source: newPost.media_source || '',
          media_type: newPost.media_type || 'none',
          thumbnail_url: newPost.thumbnail_url || '',
          status: newPost.status || 'published',
          views: newPost.views || 0,
          author: newPost.author || 'Chief Editor',
          read_time: newPost.read_time || '4 min read',
          created_at: newPost.created_at,
          updated_at: newPost.updated_at
        }).then(({ error }: any) => {
          if (error) console.warn('[Supabase Sync] Insert post error:', error.message);
          else console.log('[Supabase Sync] Post successfully persisted to Supabase:', newPost.id);
        }).catch((err: any) => console.warn('[Supabase Sync] Network error:', err.message));
      }
    }

    return newPost;
  }

  public updatePost(id: string, updates: Partial<Post>): Post | null {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    if (updates.category_id) {
      const cat = this.data.categories.find(c => c.id === updates.category_id);
      if (cat) updates.category_name = cat.name;
    }
    this.data.posts[idx] = {
      ...this.data.posts[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();

    // Asynchronously update in Supabase if active
    if (cloudServices.isSupabaseActive()) {
      const client = cloudServices.getSupabaseClient();
      if (client) {
        client.from('posts').update({
          ...updates,
          updated_at: this.data.posts[idx].updated_at
        }).eq('id', id).then(({ error }: any) => {
          if (error) console.warn('[Supabase Sync] Update post error:', error.message);
        }).catch((err: any) => console.warn('[Supabase Sync] Update error:', err.message));
      }
    }

    return this.data.posts[idx];
  }

  public deletePost(id: string): boolean {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.posts.splice(idx, 1);
    this.save();

    // Asynchronously delete from Supabase if active
    if (cloudServices.isSupabaseActive()) {
      const client = cloudServices.getSupabaseClient();
      if (client) {
        client.from('posts').delete().eq('id', id).then(({ error }: any) => {
          if (error) console.warn('[Supabase Sync] Delete post error:', error.message);
        }).catch((err: any) => console.warn('[Supabase Sync] Delete error:', err.message));
      }
    }

    return true;
  }

  public getAds(): Ad[] {
    return this.data.ads;
  }

  public getAdByPosition(position: string): Ad | null {
    return this.data.ads.find(a => a.position === position && a.is_active) || null;
  }

  public createAd(ad: Omit<Ad, 'id' | 'created_at'>): Ad {
    const newAd: Ad = {
      ...ad,
      id: 'ad-' + Date.now().toString(36),
      created_at: new Date().toISOString()
    };
    this.data.ads.push(newAd);
    this.save();
    return newAd;
  }

  public updateAd(id: string, updates: Partial<Ad>): Ad | null {
    const idx = this.data.ads.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.ads[idx] = { ...this.data.ads[idx], ...updates };
    this.save();
    return this.data.ads[idx];
  }

  public deleteAd(id: string): boolean {
    const idx = this.data.ads.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.ads.splice(idx, 1);
    this.save();
    return true;
  }

  public getMedia(): MediaItem[] {
    return this.data.media;
  }

  public addMedia(media: Omit<MediaItem, 'id' | 'created_at'>): MediaItem {
    const item: MediaItem = {
      ...media,
      id: 'media-' + Date.now().toString(36),
      created_at: new Date().toISOString()
    };
    this.data.media.unshift(item);
    this.save();
    return item;
  }

  public deleteMedia(id: string): boolean {
    const idx = this.data.media.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.media.splice(idx, 1);
    this.save();
    return true;
  }

  public getComments(postId?: string): Comment[] {
    if (postId) {
      return this.data.comments.filter(c => c.post_id === postId);
    }
    return this.data.comments;
  }

  public addComment(comment: Omit<Comment, 'id' | 'created_at'>): Comment {
    const newComment: Comment = {
      ...comment,
      id: 'comm-' + Date.now().toString(36),
      created_at: new Date().toISOString()
    };
    this.data.comments.unshift(newComment);
    this.save();
    return newComment;
  }

  public deleteComment(id: string): boolean {
    const idx = this.data.comments.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.comments.splice(idx, 1);
    this.save();
    return true;
  }

  public getAnalyticsSummary() {
    const total_posts = this.data.posts.length;
    const published_posts = this.data.posts.filter(p => p.status === 'published').length;
    const draft_posts = this.data.posts.filter(p => p.status === 'draft').length;
    const total_views = this.data.analytics.total_views || this.data.posts.reduce((acc, p) => acc + (p.views || 0), 0);

    const daily_views = Object.entries(this.data.analytics.daily_views || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, views]) => ({ date, views }));

    const views_by_category = this.data.categories.map(cat => {
      const catPosts = this.data.posts.filter(p => p.category_id === cat.id);
      const views = catPosts.reduce((acc, p) => acc + (p.views || 0), 0);
      return { category: cat.name, views };
    });

    const recent_posts = [...this.data.posts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const top_posts = [...this.data.posts]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    const ad_status = this.data.ads.map(a => ({
      position: a.position,
      is_active: a.is_active,
      name: a.name
    }));

    return {
      total_posts,
      published_posts,
      draft_posts,
      total_views,
      daily_views,
      views_by_category,
      recent_posts,
      top_posts,
      ad_status
    };
  }

  // ----------------------------------------------------
  // RUNTIME CLOUD CONFIGURATION & AUDIT SYSTEM
  // ----------------------------------------------------

  public getSystemSettings() {
    return this.data.system_settings || [];
  }

  public getSystemSetting(serviceName: string) {
    return (this.data.system_settings || []).find(s => s.service_name === serviceName) || null;
  }

  public saveSystemSetting(record: {
    service_name: string;
    encrypted_credentials: string;
    is_enabled: boolean;
    status?: 'connected' | 'failed' | 'not_configured' | 'testing';
    status_message?: string;
    last_tested_at?: string;
    updated_by: string;
  }) {
    if (!this.data.system_settings) {
      this.data.system_settings = [];
    }

    const existingIdx = this.data.system_settings.findIndex(s => s.service_name === record.service_name);
    const updatedRecord = {
      id: existingIdx !== -1 ? this.data.system_settings[existingIdx].id : `cfg-${Date.now().toString(36)}`,
      service_name: record.service_name,
      encrypted_credentials: record.encrypted_credentials,
      is_enabled: record.is_enabled,
      status: record.status || (existingIdx !== -1 ? this.data.system_settings[existingIdx].status : 'not_configured'),
      status_message: record.status_message || (existingIdx !== -1 ? this.data.system_settings[existingIdx].status_message : ''),
      last_tested_at: record.last_tested_at || (existingIdx !== -1 ? this.data.system_settings[existingIdx].last_tested_at : undefined),
      updated_at: new Date().toISOString(),
      updated_by: record.updated_by
    };

    if (existingIdx !== -1) {
      this.data.system_settings[existingIdx] = updatedRecord;
    } else {
      this.data.system_settings.push(updatedRecord);
    }

    this.save();
    return updatedRecord;
  }

  public updateSystemSettingStatus(serviceName: string, status: 'connected' | 'failed' | 'not_configured' | 'testing', statusMessage?: string, lastTestedAt?: string) {
    const existing = this.getSystemSetting(serviceName);
    if (existing) {
      existing.status = status;
      if (statusMessage !== undefined) existing.status_message = statusMessage;
      if (lastTestedAt !== undefined) existing.last_tested_at = lastTestedAt;
      this.save();
    }
  }

  public getAuditLogs(limit = 50) {
    return (this.data.audit_logs || []).slice(0, limit);
  }

  public addAuditLog(entry: {
    service_name: string;
    action: 'save' | 'test' | 'toggle' | 'reset';
    status: 'success' | 'failed';
    details: string;
    performed_by: string;
  }) {
    if (!this.data.audit_logs) {
      this.data.audit_logs = [];
    }

    const cleanDetails = (entry.details || '')
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 300);

    const logItem = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      service_name: entry.service_name,
      action: entry.action,
      status: entry.status,
      details: cleanDetails,
      performed_by: entry.performed_by,
      timestamp: new Date().toISOString()
    };

    this.data.audit_logs.unshift(logItem);
    // Keep max 200 logs
    if (this.data.audit_logs.length > 200) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 200);
    }

    this.save();
    return logItem;
  }

  // ----------------------------------------------------
  // DEPLOYMENT SETTINGS & SMTP CONFIGURATION
  // ----------------------------------------------------

  public getDeploymentSettings(): DeploymentSettings {
    if (!this.data.deployment_settings) {
      this.data.deployment_settings = { ...DEFAULT_DEPLOYMENT_SETTINGS };
    }
    return this.data.deployment_settings;
  }

  public updateDeploymentSettings(updates: Partial<DeploymentSettings>): DeploymentSettings {
    this.data.deployment_settings = {
      ...this.getDeploymentSettings(),
      ...updates
    };
    this.save();
    return this.data.deployment_settings;
  }

  public getSmtpSettings(): SmtpSettings {
    const record = this.getSystemSetting('smtp');
    if (record && record.encrypted_credentials) {
      const creds = decryptCredentials<SmtpSettings>(record.encrypted_credentials);
      if (creds) {
        return {
          ...creds,
          is_enabled: record.is_enabled,
          status: record.status || 'not_configured',
          status_message: record.status_message,
          last_tested_at: record.last_tested_at
        };
      }
    }
    return { ...DEFAULT_SMTP };
  }

  public getSmtpSettingsView(): SmtpSettingsView {
    const settings = this.getSmtpSettings();
    const record = this.getSystemSetting('smtp');
    return {
      host: settings.host,
      port: settings.port,
      username: settings.username,
      password_masked: maskKey(settings.password),
      has_password: Boolean(settings.password && settings.password.trim() !== ''),
      encryption: settings.encryption,
      from_email: settings.from_email,
      from_name: settings.from_name,
      is_enabled: settings.is_enabled ?? false,
      status: settings.status || 'not_configured',
      status_message: settings.status_message,
      last_tested_at: settings.last_tested_at,
      updated_at: record?.updated_at,
      updated_by: record?.updated_by || 'system'
    };
  }

  public saveSmtpSettings(settings: Partial<SmtpSettings>, user: string): SmtpSettingsView {
    const current = this.getSmtpSettings();
    const newPassword = settings.password && settings.password.trim() !== '' && !settings.password.includes('••••')
      ? settings.password.trim()
      : current.password;

    const updated: SmtpSettings = {
      ...current,
      ...settings,
      password: newPassword
    };

    const encrypted = encryptCredentials(updated);
    const is_enabled = settings.is_enabled !== undefined ? settings.is_enabled : (current.is_enabled ?? false);
    const status = settings.status || current.status || 'not_configured';
    const status_message = settings.status_message || current.status_message || '';
    const last_tested_at = settings.last_tested_at || current.last_tested_at;

    const savedRecord = this.saveSystemSetting({
      service_name: 'smtp',
      encrypted_credentials: encrypted,
      is_enabled,
      status,
      status_message,
      last_tested_at,
      updated_by: user
    });

    return {
      host: updated.host,
      port: updated.port,
      username: updated.username,
      password_masked: maskKey(updated.password),
      has_password: Boolean(updated.password && updated.password.trim() !== ''),
      encryption: updated.encryption,
      from_email: updated.from_email,
      from_name: updated.from_name,
      is_enabled,
      status,
      status_message,
      last_tested_at,
      updated_at: savedRecord.updated_at,
      updated_by: user
    };
  }
}

export const db = new Database();

