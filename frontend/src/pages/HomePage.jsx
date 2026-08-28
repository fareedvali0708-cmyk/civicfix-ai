import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Shield,
  Sparkles,
  Zap,
  MapPin,
  Cpu,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
import Logo from '../components/common/Logo.jsx';
import { transitions, buttonHoverTap } from '../lib/motionVariants.js';

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(220,20%,10%)] text-slate-100 flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <motion.div
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -15, 15, 0],
            opacity: [0.1, 0.16, 0.1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          className="absolute -top-40 left-1/3 w-[650px] h-[650px] rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(circle, hsl(220 90% 56%) 0%, hsl(260 80% 50% / 0.5) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, hsl(158 64% 52%) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px)',
          }}
        />
      </div>

      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Logo size="md" animate={true} />
        <div className="flex items-center gap-3">
          <Link
            to="/government/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[hsl(220_20%_15%)] hover:bg-[hsl(220_20%_20%)] text-slate-300 border border-[hsl(220_20%_22%)] transition-colors"
          >
            <Shield size={13} className="text-indigo-400" />
            <span>Government Portal</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/25 transition-all"
          >
            <span>Sign In</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.easeSmooth}
          className="space-y-5 max-w-3xl mx-auto"
        >
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/25 text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Autonomous Civic Operations Infrastructure</span>
          </div>

          {/* Main Title */}
          <h1
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Turn everyday civic issues into{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              rapid resolution.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Report infrastructure defects with GPS-precise imagery. Autonomous AI agents classify, route, and monitor resolution timelines in real time.
          </p>
        </motion.div>

        {/* Portal Entry Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto text-left"
        >
          {/* Citizen Portal Card */}
          <Link
            to="/dashboard"
            className="group relative p-6 sm:p-7 rounded-3xl bg-[hsl(220_20%_13%/0.85)] hover:bg-[hsl(220_20%_15%)] border border-[hsl(220_20%_20%)] hover:border-blue-500/50 backdrop-blur-md transition-all duration-200 shadow-xl overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-all duration-300 pointer-events-none"
            />
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-500/15 text-blue-400 border border-blue-500/30 mb-4 group-hover:scale-105 transition-transform duration-200">
              <Sparkles size={20} />
            </div>
            <h3
              className="text-xl font-bold text-white mb-1.5 flex items-center justify-between"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              <span>Citizen Portal</span>
              <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform duration-200" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Report potholes, streetlight outages, drainage blockages, and track live AI agent resolution progress.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-300">
              <span>Enter Citizen Dashboard</span>
              <span>→</span>
            </div>
          </Link>

          {/* Government Command Center Card */}
          <Link
            to="/government"
            className="group relative p-6 sm:p-7 rounded-3xl bg-[hsl(220_20%_13%/0.85)] hover:bg-[hsl(220_20%_15%)] border border-[hsl(220_20%_20%)] hover:border-indigo-500/50 backdrop-blur-md transition-all duration-200 shadow-xl overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-all duration-300 pointer-events-none"
            />
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 mb-4 group-hover:scale-105 transition-transform duration-200">
              <Shield size={20} />
            </div>
            <h3
              className="text-xl font-bold text-white mb-1.5 flex items-center justify-between"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              <span>Command Center</span>
              <ArrowRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform duration-200" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Municipal officer console with live department queues, geo-spatial GIS mapping, SLA risk alerts, and escalation routing.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-300">
              <span>Open Municipal Console</span>
              <span>→</span>
            </div>
          </Link>
        </motion.div>

        {/* Core Pillars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left"
        >
          <div className="p-4 rounded-2xl bg-[hsl(220_20%_12%/0.7)] border border-[hsl(220_20%_18%)] space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-white">AI Vision Intake</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated image recognition categorizes severity, damage extent, and priority in seconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[hsl(220_20%_12%/0.7)] border border-[hsl(220_20%_18%)] space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Precision Routing</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              GPS telemetry automatically assigns work orders to the nearest municipal maintenance ward.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[hsl(220_20%_12%/0.7)] border border-[hsl(220_20%_18%)] space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400">
              <Activity size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-white">SLA Enforcement</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autonomous monitoring agents track resolution countdowns and trigger administrative escalations.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 border-t border-[hsl(220_20%_18%)]">
        CivicFix Autonomous Civic Operations · Hackathon Project
      </footer>
    </div>
  );
}

