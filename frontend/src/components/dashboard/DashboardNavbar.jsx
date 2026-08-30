import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, LogOut, Sparkles, Shield, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Logo from '../common/Logo.jsx';
import { transitions } from '../../lib/motionVariants.js';

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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.easeSmooth}
      className="sticky top-0 z-40 w-full glass-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center shrink-0 group">
            <Logo size="md" animate={true} />
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-3">

            {/* Government Command Center Portal Switcher */}
            {isGovernmentUser && (
              <Link
                to="/government"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 shadow-inner backdrop-blur-md transition-all duration-200"
                title="Open Government Command Center"
              >
                <Shield size={13} className="text-indigo-400" />
                <span className="hidden md:inline font-medium">Command Center</span>
              </Link>
            )}

            {/* Notifications */}
            <motion.button
              id="notifications-btn"
              aria-label="Notifications"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white transition-colors"
            >
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
            </motion.button>

            {/* User Chip */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md cursor-default">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                />
              ) : (
                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-xs font-medium text-slate-200 max-w-[130px] truncate">
                {displayName}
              </span>
            </div>

            {/* Sign out */}
            <motion.button
              id="signout-btn"
              onClick={handleSignOut}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-medium border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white transition-colors"
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
