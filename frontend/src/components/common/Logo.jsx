import { motion } from 'motion/react';

/**
 * Logo Component
 *
 * Distinctive CivicFix brand mark:
 * - Hexagonal infrastructure shield geometry
 * - Upward trajectory apex (forward civic action)
 * - Interlocking AI network nodes & neural routes
 * - Responsive sizing ('sm' | 'md' | 'lg')
 */
export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  animate = false,
}) {
  const sizeMap = {
    sm: { icon: 26, text: 'text-base', gap: 'gap-2', badge: 'w-7 h-7' },
    md: { icon: 32, text: 'text-lg', gap: 'gap-2.5', badge: 'w-8 h-8' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-3', badge: 'w-10 h-10' },
  };

  const config = sizeMap[size] || sizeMap.md;

  const IconSvg = (
    <div
      className={`relative ${config.badge} rounded-xl flex items-center justify-center p-1.5 shadow-sm shrink-0`}
      style={{
        background: 'linear-gradient(135deg, hsl(220 90% 58%) 0%, hsl(224 85% 44%) 100%)',
        boxShadow: '0 2px 10px -1px hsl(220 90% 56% / 0.35), inset 0 1px 0 0 hsl(0 0% 100% / 0.25)',
      }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cf-node-grad" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93C5FD" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id="cf-beam-grad" x1="16" y1="2" x2="16" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#60A5FA" />
            <stop offset="1" stopColor="#2563EB" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer dynamic civic beacon structure */}
        <path
          d="M16 3L26.5 9.5V20.5L16 29L5.5 20.5V9.5L16 3Z"
          stroke="url(#cf-node-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Central neural network routes linking to top action apex */}
        <path
          d="M16 7V16M16 16L9.5 21.5M16 16L22.5 21.5"
          stroke="url(#cf-beam-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Action apex indicator (forward motion) */}
        <circle cx="16" cy="6.5" r="2.25" fill="#FFFFFF" />

        {/* Network satellite nodes */}
        <circle cx="9.5" cy="21.5" r="1.75" fill="#93C5FD" />
        <circle cx="22.5" cy="21.5" r="1.75" fill="#93C5FD" />

        {/* Core intelligent hub */}
        <circle cx="16" cy="16" r="2.5" fill="#FFFFFF" />
      </svg>
    </div>
  );

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {animate ? (
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {IconSvg}
        </motion.div>
      ) : (
        IconSvg
      )}

      {showText && (
        <div className="flex items-center tracking-tight select-none">
          <span
            className={`font-bold text-white ${config.text}`}
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Civic
          </span>
          <span
            className={`font-bold ${config.text}`}
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              color: 'hsl(215 95% 68%)',
            }}
          >
            Fix
          </span>
        </div>
      )}
    </div>
  );
}
