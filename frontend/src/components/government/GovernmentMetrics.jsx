import { motion } from 'motion/react';
import {
  Layers,
  Clock,
  Flame,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { cardHover, transitions } from '../../lib/motionVariants.js';

export default function GovernmentMetrics({ stats, activeFilter, onFilterChange }) {
  const cards = [
    {
      id: 'total',
      label: 'Total Reports',
      count: stats?.totalIssues ?? 0,
      icon: Layers,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      glow: 'hsl(215 95% 68% / 0.15)',
      description: 'Total citizen submissions recorded',
    },
    {
      id: 'active',
      label: 'Active Queue',
      count: stats?.activeIssues ?? 0,
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'hsl(38 92% 60% / 0.15)',
      description: 'Issues assigned or in active progress',
    },
    {
      id: 'critical',
      label: 'Critical Hazards',
      count: stats?.criticalIssues ?? 0,
      icon: Flame,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glow: 'hsl(0 85% 65% / 0.2)',
      description: 'High urgency public safety risks',
    },
    {
      id: 'sla_risk',
      label: 'SLA Risk / Breached',
      count: stats?.slaRiskIssues ?? 0,
      icon: AlertOctagon,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'hsl(270 80% 65% / 0.15)',
      description: 'Approaching or exceeded SLA window',
    },
    {
      id: 'resolved',
      label: 'Resolved',
      count: stats?.resolvedIssues ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'hsl(158 64% 52% / 0.15)',
      description: 'Successfully resolved or closed',
    },
    {
      id: 'escalated',
      label: 'Escalations',
      count: stats?.totalEscalations ?? 0,
      icon: TrendingUp,
      color: 'from-red-600/20 to-rose-600/20 text-red-300 border-red-500/40',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      glow: 'hsl(0 90% 60% / 0.22)',
      description: 'Referred to senior administration',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterChange && onFilterChange(card.id)}
            className={`group relative p-3.5 sm:p-4 rounded-2xl backdrop-blur-md transition-all duration-200 cursor-pointer overflow-hidden ${
              isActive
                ? 'border-indigo-400 ring-2 ring-indigo-500/30 bg-[hsl(222,25%,15%)] shadow-lg shadow-indigo-950/40'
                : 'bg-[hsl(222,25%,12%/0.85)] border border-[hsl(222,20%,18%)] hover:border-[hsl(222,20%,28%)] hover:bg-[hsl(222,25%,14%)]'
            }`}
          >
            {/* Ambient indicator glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-15 group-hover:opacity-30 transition-opacity duration-300"
              style={{ backgroundColor: card.glow }}
            />

            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} border transition-transform duration-200 group-hover:scale-105`}>
                <Icon size={16} />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${card.badgeColor}`}>
                REAL
              </span>
            </div>

            <div
              className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
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

