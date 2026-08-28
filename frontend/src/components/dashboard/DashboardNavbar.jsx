import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, LogOut, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Logo from '../common/Logo.jsx';
import { transitions } from '../../lib/motionVariants.js';

/**
 * DashboardNavbar
 *
 * Top navigation bar for all authenticated dashboard views.
 * Uses existing AuthContext only.
 */
export default function DashboardNavbar() {
  const { user, signOut, isGovernmentUser } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Citizen';

  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.easeSmooth}
      className="sticky top-0 z-40 w-full"
      style={{
        backgroundColor: 'hsl(220 20% 10% / 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid hsl(220 20% 18% / 0.8)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo */}
          <Link to="/dashboard" className="flex items-center shrink-0 group">
            <Logo size="md" animate={true} />
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">

            {/* Government Command Center Portal Switcher — only visible to verified government accounts */}
            {isGovernmentUser && (
              <Link
                to="/government"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/15 text-indigo-300 hover:bg-indigo-600/25 border border-indigo-500/30 transition-colors"
                title="Open Government Command Center"
              >
                <Shield size={13} className="text-indigo-400" />
                <span className="hidden md:inline">Command Center</span>
              </Link>
            )}

            {/* Notifications with subtle indicator */}
            <motion.button
              id="notifications-btn"
              aria-label="Notifications"
              whileHover={{ scale: 1.05, backgroundColor: 'hsl(220 20% 18%)' }}
              whileTap={{ scale: 0.95 }}
              transition={transitions.springFast}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors duration-150"
              style={{ color: 'hsl(220 10% 60%)' }}
            >
              <Bell size={17} />
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: 'hsl(215 95% 68%)',
                  boxShadow: '0 0 8px hsl(215 95% 68% / 0.8)',
                }}
              />
            </motion.button>

            {/* User Chip with subtle hover lift */}
            <motion.div
              whileHover={{ y: -1, backgroundColor: 'hsl(220 20% 19%)' }}
              transition={transitions.springFast}
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-transparent hover:border-[hsl(220_20%_24%)] cursor-default transition-colors duration-150"
              style={{ backgroundColor: 'hsl(220 20% 15%)' }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 44%) 100%)',
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-xs font-medium text-slate-200 max-w-[130px] truncate">
                {displayName}
              </span>
            </motion.div>

            {/* Mobile avatar */}
            <div className="flex sm:hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 44%) 100%)',
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Sign out */}
            <motion.button
              id="signout-btn"
              onClick={handleSignOut}
              whileHover={{ scale: 1.02, backgroundColor: 'hsl(220 20% 19%)', color: '#fff' }}
              whileTap={{ scale: 0.97 }}
              transition={transitions.springFast}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-[hsl(220_20%_20%)] transition-colors duration-150"
              style={{
                backgroundColor: 'hsl(220 20% 14%)',
                color: 'hsl(220 10% 65%)',
              }}
              aria-label="Sign out"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
