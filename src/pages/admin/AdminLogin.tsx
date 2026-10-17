import React, { useState } from 'react';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { Shield, KeyRound, User, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const { loginAdmin, settings } = useWebsite();

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  // Status indicators
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Suppress and block any ads or popups on Admin Login page
  React.useEffect(() => {
    document.querySelectorAll('script[data-popunder="true"], script[src*="profitableratecpmnetwork"], script[src*="popunder"], iframe[src*="profitableratecpmnetwork"]').forEach((el) => el.remove());

    const originalOpen = window.open;
    window.open = () => null;

    return () => {
      window.open = originalOpen;
    };
  }, []);

  // Handle standard login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ username: username.trim(), password });
      loginAdmin(res.token, res.user);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4">
      {/* Back to website button */}
      <button
        onClick={onNavigateHome}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Live Portal</span>
      </button>

      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Editorial Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {settings?.website_name || 'The Daily Chronicle'} Admin Console
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        {/* Security Notice Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
          <p className="text-[11px] text-neutral-500">
            Protected area. Unauthorized access attempts are monitored and rate-limited.
          </p>
        </div>
      </div>
    </div>
  );
};
