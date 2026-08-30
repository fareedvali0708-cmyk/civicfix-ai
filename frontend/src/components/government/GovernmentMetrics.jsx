import { motion } from 'motion/react';
import {
  Layers,
  Clock,
  Flame,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { cardHover3D } from '../../lib/motionVariants.js';

export default function GovernmentMetrics({ stats, activeFilter, onFilterChange }) {
  const cards = [
    {
      id: 'total',
      label: 'Total Reports',
      count: stats?.totalIssues ?? 0,
      icon: Layers,
      accent: '#60A5FA',
      accentBg: 'rgba(96, 165, 250, 0.12)',
      border: 'rgba(96, 165, 250, 0.3)',
      description: 'Total citizen submissions recorded',
    },
    {
      id: 'active',
      label: 'Active Queue',
      count: stats?.activeIssues ?? 0,
      icon: Clock,
      accent: '#FBBF24',
      accentBg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.3)',
      description: 'Issues assigned or in active progress',
    },
    {
      id: 'critical',
      label: 'Critical Hazards',
      count: stats?.criticalIssues ?? 0,
      icon: Flame,
      accent: '#FB7185',
      accentBg: 'rgba(251, 113, 133, 0.12)',
      border: 'rgba(251, 113, 133, 0.3)',
      description: 'High urgency public safety risks',
    },
    {
      id: 'sla_risk',
      label: 'SLA Risk / Breached',
      count: stats?.slaRiskIssues ?? 0,
      icon: AlertOctagon,
      accent: '#C084FC',
      accentBg: 'rgba(192, 132, 252, 0.12)',
      border: 'rgba(192, 132, 252, 0.3)',
      description: 'Approaching or exceeded SLA window',
    },
    {
      id: 'resolved',
      label: 'Resolved',
      count: stats?.resolvedIssues ?? 0,
      icon: CheckCircle2,
      accent: '#34D399',
      accentBg: 'rgba(52, 211, 153, 0.12)',
      border: 'rgba(52, 211, 153, 0.3)',
      description: 'Successfully resolved or closed',
    },
    {
      id: 'escalated',
      label: 'Escalations',
      count: stats?.totalEscalations ?? 0,
      icon: TrendingUp,
      accent: '#F43F5E',
      accentBg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.35)',
      description: 'Referred to senior administration',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
            variants={cardHover3D}
            initial="rest"
            whileHover="hover"
            onClick={() => onFilterChange && onFilterChange(card.id)}
            className={`group relative p-4 sm:p-5 rounded-3xl backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${
              isActive
                ? 'border-indigo-400/90 ring-2 ring-indigo-500/30 glass-stitch-elevated shadow-xl shadow-indigo-950/50'
                : 'glass-stitch hover:glass-stitch-elevated'
            }`}
          >
            {/* Luminous accent gradient orb */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 group-hover:opacity-25 blur-xl transition-opacity duration-300"
              style={{ backgroundColor: card.accent }}
            />

            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner"
                style={{ backgroundColor: card.accentBg, border: `1px solid ${card.border}`, color: card.accent }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <span
                className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: card.accentBg, border: `1px solid ${card.border}`, color: card.accent }}
              >
                REAL
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {card.count}
            </div>

            <div className="text-xs font-semibold text-slate-200 mt-1 truncate group-hover:text-white transition-colors">
              {card.label}
            </div>

            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              {card.description}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
