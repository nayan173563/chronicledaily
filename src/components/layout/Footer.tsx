import React from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { Mail, Phone, MapPin, Send, Globe, ChevronRight } from 'lucide-react';

interface FooterProps {
  onNavigateHome: () => void;
  onNavigateCategory: (slug: string) => void;
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateHome,
  onNavigateCategory,
  onNavigateAdmin,
}) => {
  const { settings, categories, isAdminLoggedIn } = useWebsite();

  const websiteName = settings?.website_name || 'The Daily Chronicle';
  const copyright = settings?.copyright_text || `© ${new Date().getFullYear()} ${websiteName}. All rights reserved.`;
  const contact = settings?.contact_info;
  const socials = settings?.social_links;

  return (
    <footer className="w-full bg-neutral-950 text-neutral-300 border-t border-neutral-800 mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-neutral-800">
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={onNavigateHome}
              className="text-left font-serif text-2xl lg:text-3xl font-bold tracking-tight text-white hover:text-neutral-200 transition-colors"
            >
              {websiteName}
            </button>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              {settings?.website_tagline || 'Independent journal of record offering verified investigative coverage, analytical commentary, and multimedia dispatches from across the globe.'}
            </p>

            {/* Contact details */}
            <div className="space-y-1.5 text-xs text-neutral-400 pt-2">
              {contact?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>{contact.address}</span>
                </div>
              )}
              {contact?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 pt-2">
              {socials?.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Facebook"
                >
                  <span className="text-xs font-bold font-serif">f</span>
                </a>
              )}
              {socials?.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Twitter / X"
                >
                  <span className="text-xs font-bold font-sans">𝕏</span>
                </a>
              )}
              {socials?.telegram && (
                <a
                  href={socials.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Telegram"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="YouTube"
                >
                  <span className="text-[10px] font-bold">YT</span>
                </a>
              )}
              {socials?.whatsapp && (
                <a
                  href={socials.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="WhatsApp"
                >
                  <span className="text-[10px] font-bold">WA</span>
                </a>
              )}
            </div>
          </div>

          {/* Col 3: Sections */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Primary Desks
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onNavigateCategory(c.slug)}
                    className="hover:text-white transition-colors"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Entertainment & Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Special Coverage
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(5).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onNavigateCategory(c.slug)}
                    className="hover:text-white transition-colors"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
              <li>
                <a href="/sitemap.xml" target="_blank" className="hover:text-white text-neutral-400">
                  XML Sitemap
                </a>
              </li>
              <li>
                <a href="/robots.txt" target="_blank" className="hover:text-white text-neutral-400">
                  Robots.txt
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Editorial Governance & Admin Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Editorial Governance
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Committed to unbiased verification and independent reporting standards.
            </p>
            {isAdminLoggedIn && (
              <div className="pt-2">
                <button
                  onClick={onNavigateAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 border border-red-900/60 text-xs font-medium text-red-400 hover:text-red-300 hover:border-red-600 transition-colors cursor-pointer"
                >
                  <span>Admin Console</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>{copyright}</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Verified Press Syndicate</span>
            <span>·</span>
            <span>SEO Automated &amp; Schema Validated</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
