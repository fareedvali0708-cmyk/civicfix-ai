import { useState } from 'react';
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
  Eye,
  Clock,
  Compass,
  Building2,
  Workflow,
  ChevronRight,
} from 'lucide-react';
import Logo from '../components/common/Logo.jsx';
import { transitions, buttonHoverTap, cardHover3D, itemFadeUp, containerStagger } from '../lib/motionVariants.js';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('citizen');

  const pipelineStages = [
    {
      name: 'Intake Agent',
      desc: 'GPS Telemetry & Duplicate Shield',
      icon: Layers,
      color: '#60A5FA',
      accentBg: 'rgba(96, 165, 250, 0.12)',
      border: 'rgba(96, 165, 250, 0.3)',
    },
    {
      name: 'Vision Agent',
      desc: 'Gemini Autonomous Classification',
      icon: Cpu,
      color: '#A78BFA',
      accentBg: 'rgba(167, 139, 250, 0.12)',
      border: 'rgba(167, 139, 250, 0.3)',
    },
    {
      name: 'Assignment Agent',
      desc: 'Ward & Department Dispatch',
      icon: Building2,
      color: '#38BDF8',
      accentBg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.3)',
    },
    {
      name: 'SLA Agent',
      desc: 'Real-time Breach Monitoring',
      icon: Clock,
      color: '#FBBF24',
      accentBg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.3)',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(224,45%,5%)] text-slate-100 flex flex-col justify-between selection:bg-blue-500/30 selection:text-white">
      {/* ── Google Stitch Ambient Refraction Backdrops ──────────────── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <motion.div
          animate={{
            x: [0, 30, -25, 0],
            y: [0, -30, 20, 0],
            opacity: [0.12, 0.18, 0.12],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          className="absolute -top-48 left-1/4 w-[750px] h-[750px] rounded-full blur-[150px]"
          style={{
            background: 'radial-gradient(circle, hsl(224 92% 60%) 0%, hsl(245 82% 67% / 0.5) 45%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -20, 25, 0],
            y: [0, 20, -15, 0],
            opacity: [0.06, 0.11, 0.06],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          className="absolute bottom-10 right-10 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(circle, hsl(158 72% 48%) 0%, hsl(224 92% 60% / 0.3) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Navigation Header ────────────────────────────────────────── */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10">
        <Logo size="md" animate={true} />
        <div className="flex items-center gap-3">
          <Link
            to="/government/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] hover:border-indigo-400/40 backdrop-blur-md transition-all duration-200"
          >
            <Shield size={13} className="text-indigo-400" />
            <span>Government Portal</span>
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 border border-blue-400/30 transition-all"
            >
              <span>Sign In</span>
              <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* ── Main Hero Section ───────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center space-y-12 z-10">
        
        {/* Hero Title & Pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.easeSmooth}
          className="space-y-6 max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.03] border border-blue-500/30 backdrop-blur-xl shadow-lg shadow-blue-950/40"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-slate-200">Autonomous Civic Operations Engine</span>
          </motion.div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08]">
            Civic infrastructure,{' '}
            <span className="text-gradient-stitch">
              resolved by AI.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed font-normal">
            Precision image uploads meet autonomous multi-agent oversight. From classification to departmental dispatch and SLA closure in seconds.
          </p>
        </motion.div>

        {/* ── 3D Perspective Portal Cards ────────────────────────────── */}
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left perspective-1000"
        >
          {/* Citizen Portal 3D Card */}
          <motion.div variants={itemFadeUp}>
            <Link
              to="/dashboard"
              className="group block relative p-8 rounded-3xl glass-stitch hover:glass-stitch-elevated transition-all duration-300 overflow-hidden preserve-3d cursor-pointer"
            >
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 blur-2xl transition-all duration-300 pointer-events-none"
              />
              <div className="flex items-center justify-between mb-6">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Sparkles size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Citizen Hub
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                Citizen Portal
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Capture street-level issues with high-precision GPS. Monitor live AI agent classification, routing, and real-time SLA completion.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 group-hover:translate-x-1.5 transition-transform duration-200">
                <span>Launch Citizen Dashboard</span>
                <ChevronRight size={15} />
              </div>
            </Link>
          </motion.div>

          {/* Government Portal 3D Card */}
          <motion.div variants={itemFadeUp}>
            <Link
              to="/government"
              className="group block relative p-8 rounded-3xl glass-stitch hover:glass-stitch-elevated transition-all duration-300 overflow-hidden preserve-3d cursor-pointer"
            >
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 blur-2xl transition-all duration-300 pointer-events-none"
              />
              <div className="flex items-center justify-between mb-6">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Shield size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Officer HUD
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">
                Command Center
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Unified municipal operations console. Inspect photographic dossiers, track live departmental queues, GIS maps, and escalation workflows.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 group-hover:translate-x-1.5 transition-transform duration-200">
                <span>Enter Municipal Console</span>
                <ChevronRight size={15} />
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Autonomous Agent Ecosystem Flow Nodes ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="pt-4 space-y-4 max-w-5xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Workflow size={14} className="text-blue-400" />
            <span>Autonomous Multi-Agent Architecture</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {pipelineStages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.name}
                  className="relative p-5 rounded-2xl glass-stitch border border-white/[0.06] hover:border-white/[0.15] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                      style={{ backgroundColor: stage.accentBg, border: `1px solid ${stage.border}`, color: stage.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      0{idx + 1}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{stage.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 border-t border-white/[0.06] z-10">
        <p className="font-medium">CivicFix · Autonomous Civic Operations Infrastructure</p>
      </footer>
    </div>
  );
}
