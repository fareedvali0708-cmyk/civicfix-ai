import { motion } from 'motion/react';
import { cardHover3D } from '../../lib/motionVariants.js';

export default function StatsCard({ icon: Icon, label, value, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay }}
      variants={cardHover3D}
      initial="rest"
      whileHover="hover"
      className="
        group relative rounded-3xl p-6 flex flex-col justify-between gap-5
        glass-stitch hover:glass-stitch-elevated
        transition-all duration-300 overflow-hidden cursor-default
      "
    >
      {/* Luminous accent gradient orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-15 group-hover:opacity-30 blur-xl transition-opacity duration-300"
        style={{ backgroundColor: accent }}
      />

      {/* Icon and status badge */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-inner"
          style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}33` }}
        >
          <Icon size={20} style={{ color: accent }} strokeWidth={2.2} />
        </div>

        <span
          className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
          style={{
            color: accent,
            backgroundColor: `${accent}15`,
            border: `1px solid ${accent}30`,
          }}
        >
          Active
        </span>
      </div>

      {/* Numerical count & label */}
      <div>
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white tabular-nums">
          {value ?? 0}
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
