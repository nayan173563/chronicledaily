import React, { useState, useRef, useEffect } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { Search, Shield, Menu, X, Share2, Globe2 } from 'lucide-react';
import { AdSlot } from '../ads/AdSlot';

interface HeaderProps {
  onNavigateHome: () => void;
  onNavigateCategory: (slug: string) => void;
  onNavigateSearch: () => void;
  onNavigateAdmin: () => void;
  activeCategory?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  onNavigateCategory,
  onNavigateSearch,
  onNavigateAdmin,
  activeCategory,
}) => {
  const { settings, categories, isAdminLoggedIn } = useWebsite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreCategoriesOpen, setMoreCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreCategoriesOpen(false);
      }
    };
    if (moreCategoriesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreCategoriesOpen]);

  const websiteName = settings?.website_name || 'The Daily Chronicle';
  const logoUrl = settings?.logo_url;
  const headerDesign = settings?.header_design || 'editorial';

  // Format today's date in classic journalistic style
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const visibleCategories = categories.slice(0, 7);
  const overflowCategories = categories.slice(7);

  return (
    <header className="w-full bg-white border-b border-neutral-200">
      {/* 1. Top Utility & Dateline Strip */}
      <div className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] text-neutral-500 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif italic text-neutral-700">{todayFormatted}</span>
            <span className="text-neutral-300">·</span>
            <span className="hidden sm:inline">Today’s Paper · Global Edition</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateSearch}
              className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Dispatches</span>
            </button>
            {isAdminLoggedIn && (
              <>
                <span className="text-neutral-300">·</span>
                <button
                  onClick={onNavigateAdmin}
                  className="flex items-center gap-1.5 text-red-700 hover:text-red-900 font-medium transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  <span>Admin Console</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Masthead (Adapts to header design) */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {headerDesign === 'minimal' ? (
          /* Minimal 1-row layout */
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="text-left font-serif text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={websiteName} className="h-8 md:h-10 object-contain" />
              ) : (
                websiteName
              )}
            </button>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-600">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigateCategory(cat.slug);
                    setMoreCategoriesOpen(false);
                  }}
                  className={`hover:text-neutral-900 transition-colors cursor-pointer ${
                    activeCategory === cat.slug ? 'text-neutral-950 font-semibold underline underline-offset-8' : ''
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              {overflowCategories.length > 0 && (
                <div className="relative inline-block" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setMoreCategoriesOpen((prev) => !prev);
                    }}
                    className={`cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors ${
                      moreCategoriesOpen
                        ? 'text-neutral-950 font-bold'
                        : 'hover:text-neutral-900'
                    }`}
                    aria-expanded={moreCategoriesOpen}
                  >
                    <span>More Categories</span>
                    <span className={`inline-block transition-transform duration-150 ${moreCategoriesOpen ? 'rotate-180' : ''}`}>
                      &#x25BE;
                    </span>
                  </button>

                  {moreCategoriesOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 shadow-xl rounded-md py-1.5 z-50">
                      {overflowCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onNavigateCategory(c.slug);
                            setMoreCategoriesOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                            activeCategory === c.slug
                              ? 'text-neutral-950 font-bold bg-neutral-50'
                              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateSearch}
                aria-label="Search"
                className="p-2 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100 cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 lg:hidden text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        ) : (
          /* Editorial / Classic layout: Centered majestic masthead */
          <div className="flex flex-col items-center justify-center text-center">
            <button
              onClick={onNavigateHome}
              className="group inline-block cursor-pointer focus:outline-none"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={websiteName} className="h-12 md:h-16 object-contain mx-auto" />
              ) : (
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 uppercase border-b-2 border-transparent group-hover:border-neutral-900 transition-all">
                  {websiteName}
                </h1>
              )}
            </button>

            {settings?.website_tagline && (
              <p className="mt-2 text-xs md:text-sm text-neutral-500 font-serif italic max-w-xl">
                {settings.website_tagline}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Category Navigation Ribbon (for classic & editorial designs) */}
      {headerDesign !== 'minimal' && (
        <div className="border-t border-neutral-200 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
            <nav className="hidden md:flex items-center justify-center flex-wrap gap-x-8 gap-y-2 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 mx-auto">
              <button
                onClick={() => {
                  onNavigateHome();
                  setMoreCategoriesOpen(false);
                }}
                className={`whitespace-nowrap hover:text-red-700 transition-colors cursor-pointer ${
                  !activeCategory ? 'text-red-700 font-bold border-b-2 border-red-700 pb-0.5' : ''
                }`}
              >
                Front Page
              </button>

              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigateCategory(cat.slug);
                    setMoreCategoriesOpen(false);
                  }}
                  className={`whitespace-nowrap hover:text-red-700 transition-colors cursor-pointer ${
                    activeCategory === cat.slug ? 'text-red-700 font-bold border-b-2 border-red-700 pb-0.5' : ''
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              {overflowCategories.length > 0 && (
                <div className="relative inline-block" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setMoreCategoriesOpen((prev) => !prev);
                    }}
                    className={`whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
                      moreCategoriesOpen
                        ? 'text-red-700 font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                    aria-expanded={moreCategoriesOpen}
                  >
                    <span>More Categories</span>
                    <span className={`inline-block transition-transform duration-150 ${moreCategoriesOpen ? 'rotate-180' : ''}`}>
                      &#x25BE;
                    </span>
                  </button>

                  {/* Vertical dropdown directly below More Categories */}
                  {moreCategoriesOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-neutral-200 shadow-xl rounded-md py-1.5 z-50">
                      {overflowCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onNavigateCategory(c.slug);
                            setMoreCategoriesOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                            activeCategory === c.slug
                              ? 'text-red-700 font-bold bg-neutral-50'
                              : 'text-neutral-700 hover:bg-neutral-100 hover:text-red-700'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="flex md:hidden items-center justify-between w-full py-2">
              <span className="text-xs font-serif uppercase tracking-widest text-neutral-500">
                {activeCategory ? `Section: ${activeCategory}` : 'All Sections'}
              </span>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-neutral-700 hover:text-neutral-950"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Header Leaderboard Ad (728×90) placement */}
      <div className="max-w-7xl mx-auto px-4">
        <AdSlot position="header_728x90" minHeight={90} />
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-neutral-900 text-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="font-serif text-lg font-bold">{websiteName}</span>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium hover:text-amber-400"
            >
              Front Page
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onNavigateCategory(c.slug);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm text-neutral-300 hover:text-white"
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="border-t border-neutral-800 pt-4 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigateSearch();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white py-1"
            >
              <Search className="w-4 h-4" /> Search Articles
            </button>
            {isAdminLoggedIn && (
              <button
                onClick={() => {
                  onNavigateAdmin();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-white py-1"
              >
                <Shield className="w-4 h-4 text-red-500" /> Admin Console
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
