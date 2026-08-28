import { motion } from 'motion/react';
import { cardHover, transitions } from '../../lib/motionVariants.js';

/**
 * StatsCard
 *
 * Polished summary metric card.
 * Respects real database data.
 * Subtle lift and border highlight on hover.
 */
export default function StatsCard({ icon: Icon, label, value, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className="
        group relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4
        border border-[hsl(220_20%_18%)] hover:border-[hsl(220_20%_26%)]
        bg-[hsl(220_20%_13%/0.9)] backdrop-blur-sm
        transition-colors duration-200 overflow-hidden
      "
    >
      {/* Ambient top right indicator */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300"
        style={{ backgroundColor: accent }}
      />

      {/* Icon and label */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon size={19} style={{ color: accent }} strokeWidth={2.2} />
        </div>

        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-md"
          style={{
            color: accent,
            backgroundColor: `${accent}12`,
          }}
        >
          Active
        </span>
      </div>

      {/* Numerical count */}
      <div>
        <div
          className="text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {value ?? 0}
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
