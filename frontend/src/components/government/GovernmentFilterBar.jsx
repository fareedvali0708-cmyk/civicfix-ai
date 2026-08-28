import { motion } from 'motion/react';
import { Search, Filter, RefreshCw, MapPin, List, AlertTriangle, Cpu } from 'lucide-react';
import { transitions, buttonHoverTap } from '../../lib/motionVariants.js';

export default function GovernmentFilterBar({
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  statusFilter,
  onStatusChange,
  severityFilter,
  onSeverityChange,
  slaFilter,
  onSlaChange,
  departments = [],
  activeTab,
  onTabChange,
  onResetFilters,
  hasActiveFilters,
}) {
  return (
    <div className="space-y-3">
      {/* Top row: Tab Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[hsl(222,25%,11%/0.9)] border border-[hsl(222,20%,18%)] rounded-xl self-start md:self-auto backdrop-blur-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('queue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[hsl(222,20%,16%)]'
            }`}
          >
            <List size={14} />
            <span>Issue Queue</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[hsl(222,20%,16%)]'
            }`}
          >
            <MapPin size={14} />
            <span>Geographic Map</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('escalations')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'escalations'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[hsl(222,20%,16%)]'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Escalations</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('agents')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'agents'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[hsl(222,20%,16%)]'
            }`}
          >
            <Cpu size={14} />
            <span>Agent Logs</span>
          </motion.button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by ID, category, description, ward..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[hsl(222,25%,12%/0.9)] text-slate-200 border border-[hsl(222,20%,20%)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 backdrop-blur-md placeholder:text-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Bottom row: Filter Selectors */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-[hsl(222,25%,11%/0.85)] border border-[hsl(222,20%,16%)] backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mr-1">
          <Filter size={13} className="text-indigo-400" />
          <span>Filters:</span>
        </div>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[hsl(222,25%,14%)] text-slate-200 border border-[hsl(222,20%,22%)] hover:border-[hsl(222,20%,28%)] focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id || dept.name} value={dept.id || dept.name}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[hsl(222,25%,14%)] text-slate-200 border border-[hsl(222,20%,22%)] hover:border-[hsl(222,20%,28%)] focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {/* Severity / Priority Filter */}
        <select
          value={severityFilter}
          onChange={(e) => onSeverityChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[hsl(222,25%,14%)] text-slate-200 border border-[hsl(222,20%,22%)] hover:border-[hsl(222,20%,28%)] focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* SLA State Filter */}
        <select
          value={slaFilter}
          onChange={(e) => onSlaChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[hsl(222,25%,14%)] text-slate-200 border border-[hsl(222,20%,22%)] hover:border-[hsl(222,20%,28%)] focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
        >
          <option value="all">All SLA States</option>
          <option value="on_track">On Track</option>
          <option value="at_risk">At Risk</option>
          <option value="breached">Breached</option>
        </select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 cursor-pointer transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

