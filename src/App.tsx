import React, { useState, useEffect } from 'react';
import { WebsiteProvider, useWebsite } from './context/WebsiteContext';
import { Post } from './types';
import { api } from './services/api';

// Layout & Ads
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PopunderTrigger } from './components/ads/PopunderTrigger';

// Public Pages
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';

// Admin Pages
import { AdminLayout, AdminTab } from './pages/admin/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCreateContent } from './pages/admin/AdminCreateContent';
import { AdminPostsList } from './pages/admin/AdminPostsList';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminAdManager } from './pages/admin/AdminAdManager';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminSEOSettings } from './pages/admin/AdminSEOSettings';
import { AdminMediaLibrary } from './pages/admin/AdminMediaLibrary';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminCloudServices } from './pages/admin/AdminCloudServices';
import { AdminDeploymentSettings } from './pages/admin/AdminDeploymentSettings';
import { DeploymentHeadTags } from './components/seo/DeploymentHeadTags';
import { SponsorAdPage } from './pages/SponsorAdPage';

type ViewMode = 
  | { type: 'home' }
  | { type: 'article'; post: Post }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'admin'; tab: AdminTab }
  | { type: 'admin_login' }
  | { type: 'sponsor_ad'; postId: string; slug: string; returnUrl: string };

function MainContent() {
  const { isAdminLoggedIn, isLoading } = useWebsite();
  const [view, setView] = useState<ViewMode>({ type: 'home' });
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);

  // Initialize view from URL pathname and handle browser back/forward buttons
  useEffect(() => {
    const handleUrlRouting = async () => {
      const path = window.location.pathname;

      if (path.startsWith('/sponsor-ad')) {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('postId') || '';
        const slug = urlParams.get('slug') || '';
        const returnUrl = urlParams.get('returnUrl') || (slug ? `/post/${slug}` : '/');
        setView({ type: 'sponsor_ad', postId, slug, returnUrl });
        return;
      }

      if (path.startsWith('/admin')) {
        if (!isAdminLoggedIn) {
          setView({ type: 'admin_login' });
        } else {
          setView({ type: 'admin', tab: 'dashboard' });
        }
        return;
      }

      if (path.startsWith('/category/')) {
        const slug = path.replace('/category/', '');
        setView({ type: 'category', slug });
        return;
      }

      if (path.startsWith('/unlock/') || path.startsWith('/smart-link/') || path.startsWith('/destination/')) {
        const slug = path.replace('/unlock/', '').replace('/smart-link/', '').replace('/destination/', '').split('?')[0];
        try {
          const post = await api.getPost(slug);
          setView({ type: 'article', post });
        } catch {
          setView({ type: 'home' });
        }
        return;
      }

      if (path.startsWith('/post/')) {
        const slug = path.replace('/post/', '');
        try {
          const post = await api.getPost(slug);
          setView({ type: 'article', post });
        } catch {
          setView({ type: 'home' });
        }
        return;
      }

      if (path.startsWith('/p/')) {
        const shortId = path.replace('/p/', '');
        try {
          const post = await api.getPostByShortId(shortId);
          setView({ type: 'article', post });
        } catch {
          setView({ type: 'home' });
        }
        return;
      }

      if (path === '/search') {
        setView({ type: 'search' });
        return;
      }

      setView({ type: 'home' });
    };

    handleUrlRouting();

    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [isAdminLoggedIn]);

  // Push history and update view
  const navigateTo = (newView: ViewMode, path: string) => {
    setView(newView);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPost = (post: Post) => {
    navigateTo({ type: 'article', post }, `/post/${post.slug}`);
  };

  const handleSelectCategory = (slug: string) => {
    navigateTo({ type: 'category', slug }, `/category/${slug}`);
  };

  const handleNavigateHome = () => {
    navigateTo({ type: 'home' }, '/');
  };

  const handleNavigateSearch = () => {
    navigateTo({ type: 'search' }, '/search');
  };

  const handleNavigateAdmin = () => {
    if (isAdminLoggedIn) {
      navigateTo({ type: 'admin', tab: 'dashboard' }, '/admin');
    } else {
      navigateTo({ type: 'admin_login' }, '/admin/login');
    }
  };

  const handleEditPost = (post: Post) => {
    setPostToEdit(post);
    setView({ type: 'admin', tab: 'create_content' });
  };

  const handleCreateNewPost = () => {
    setPostToEdit(null);
    setView({ type: 'admin', tab: 'create_content' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-serif text-sm tracking-widest uppercase">Chronicle Dispatch Engine</span>
        </div>
      </div>
    );
  }

  // Dedicated Sponsor Ad Clearance View (10-Second Timer Gate)
  if (view.type === 'sponsor_ad') {
    return (
      <SponsorAdPage
        postId={view.postId}
        slug={view.slug}
        returnUrl={view.returnUrl}
        onBackToArticle={async () => {
          if (view.slug) {
            try {
              const post = await api.getPost(view.slug);
              navigateTo({ type: 'article', post }, `/post/${view.slug}`);
              return;
            } catch {}
          }
          handleNavigateHome();
        }}
      />
    );
  }

  // 1. Admin Login View
  if (view.type === 'admin_login') {
    return (
      <AdminLogin
        onLoginSuccess={() => navigateTo({ type: 'admin', tab: 'dashboard' }, '/admin')}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  // 2. Admin Portal Views
  if (view.type === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <AdminLogin
          onLoginSuccess={() => navigateTo({ type: 'admin', tab: 'dashboard' }, '/admin')}
          onNavigateHome={handleNavigateHome}
        />
      );
    }

    return (
      <AdminLayout
        currentTab={view.tab}
        onSelectTab={(tab) => {
          if (tab === 'create_content' && view.tab !== 'create_content') {
            setPostToEdit(null);
          }
          setView({ type: 'admin', tab });
        }}
        onNavigateHome={handleNavigateHome}
      >
        {view.tab === 'dashboard' && (
          <AdminDashboard
            onNavigateTab={(tab) => setView({ type: 'admin', tab })}
            onEditPost={handleEditPost}
          />
        )}
        {view.tab === 'create_content' && (
          <AdminCreateContent
            postToEdit={postToEdit}
            onPostSaved={() => setView({ type: 'admin', tab: 'all_posts' })}
            onCancel={() => setView({ type: 'admin', tab: 'all_posts' })}
          />
        )}
        {view.tab === 'all_posts' && (
          <AdminPostsList
            onEditPost={handleEditPost}
            onCreateNew={handleCreateNewPost}
          />
        )}
        {view.tab === 'categories' && <AdminCategories />}
        {view.tab === 'media_library' && <AdminMediaLibrary />}
        {view.tab === 'ad_manager' && <AdminAdManager />}
        {view.tab === 'cloud_services' && <AdminCloudServices />}
        {view.tab === 'deployment_settings' && <AdminDeploymentSettings />}
        {view.tab === 'website_settings' && <AdminSettings />}
        {view.tab === 'seo_settings' && <AdminSEOSettings />}
        {view.tab === 'analytics' && <AdminAnalytics />}
        {view.tab === 'profile' && <AdminProfile />}
      </AdminLayout>
    );
  }

  // 3. Public Web Views (Header & Footer wrapped)
  const activeCategory = view.type === 'category' ? view.slug : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      {/* Hidden Click Popunder Ad for Public Frontend Readers (4-hour frequency cap, excluded from admin) */}
      <PopunderTrigger />

      <Header
        onNavigateHome={handleNavigateHome}
        onNavigateCategory={handleSelectCategory}
        onNavigateSearch={handleNavigateSearch}
        onNavigateAdmin={handleNavigateAdmin}
        activeCategory={activeCategory}
      />

      <div className="flex-1">
        {view.type === 'home' && (
          <HomePage
            onSelectPost={handleSelectPost}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {view.type === 'article' && (
          <ArticlePage
            post={view.post}
            onNavigateBack={handleNavigateHome}
            onSelectPost={handleSelectPost}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {view.type === 'category' && (
          <CategoryPage
            categorySlug={view.slug}
            onSelectPost={handleSelectPost}
            onNavigateHome={handleNavigateHome}
          />
        )}

        {view.type === 'search' && (
          <SearchPage
            onSelectPost={handleSelectPost}
            onNavigateHome={handleNavigateHome}
          />
        )}
      </div>

      <Footer
        onNavigateHome={handleNavigateHome}
        onNavigateCategory={handleSelectCategory}
        onNavigateAdmin={handleNavigateAdmin}
      />
    </div>
  );
}

export default function App() {
  return (
    <WebsiteProvider>
      <DeploymentHeadTags />
      <MainContent />
    </WebsiteProvider>
  );
}
