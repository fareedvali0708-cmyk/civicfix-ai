import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { fetchGovernmentOverview } from '../services/governmentService.js';
import GovernmentHeader from '../components/government/GovernmentHeader.jsx';
import GovernmentMetrics from '../components/government/GovernmentMetrics.jsx';
import GovernmentFilterBar from '../components/government/GovernmentFilterBar.jsx';
import GovernmentIssueQueue from '../components/government/GovernmentIssueQueue.jsx';
import GovernmentIssueDetailModal from '../components/government/GovernmentIssueDetailModal.jsx';
import GovernmentEscalationsTable from '../components/government/GovernmentEscalationsTable.jsx';
import GovernmentAgentActivity from '../components/government/GovernmentAgentActivity.jsx';
import GovernmentMapView from '../components/government/GovernmentMapView.jsx';

export default function GovernmentPage() {
  const [data, setData] = useState({
    stats: null,
    issues: [],
    departments: [],
    officers: [],
    escalations: [],
    recentLogs: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [metricQuickFilter, setMetricQuickFilter] = useState(null);

  // Active view tab: 'queue' | 'map' | 'escalations' | 'agents'
  const [activeTab, setActiveTab] = useState('queue');

  // Selected issue for detail modal
  const [selectedIssue, setSelectedIssue] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGovernmentOverview();
      if (res && res.success) {
        setData({
          stats: res.stats || {
            totalIssues: 0,
            activeIssues: 0,
            criticalIssues: 0,
            slaRiskIssues: 0,
            resolvedIssues: 0,
            totalEscalations: 0,
          },
          issues: Array.isArray(res.issues) ? res.issues : [],
          departments: Array.isArray(res.departments) ? res.departments : [],
          officers: Array.isArray(res.officers) ? res.officers : [],
          escalations: Array.isArray(res.escalations) ? res.escalations : [],
          recentLogs: Array.isArray(res.recentLogs) ? res.recentLogs : [],
        });
        setLastUpdated(Date.now());
      } else {
        throw new Error(res?.error || 'Failed to load government overview.');
      }
    } catch (err) {
      console.error('[GovernmentPage] Failed to fetch data:', err.message);
      setError('Unable to load command center data. Please check connection and refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick filter clicks from KPI Cards
  const handleMetricCardClick = (cardId) => {
    if (metricQuickFilter === cardId) {
      // Toggle off
      setMetricQuickFilter(null);
      setStatusFilter('all');
      setSeverityFilter('all');
      setSlaFilter('all');
      return;
    }

    setMetricQuickFilter(cardId);

    switch (cardId) {
      case 'total':
        setStatusFilter('all');
        setSeverityFilter('all');
        setSlaFilter('all');
        setActiveTab('queue');
        break;
      case 'active':
        setStatusFilter('assigned');
        setSeverityFilter('all');
        setSlaFilter('all');
        setActiveTab('queue');
        break;
      case 'critical':
        setSeverityFilter('critical');
        setStatusFilter('all');
        setSlaFilter('all');
        setActiveTab('queue');
        break;
      case 'sla_risk':
        setSlaFilter('at_risk');
        setStatusFilter('all');
        setSeverityFilter('all');
        setActiveTab('queue');
        break;
      case 'resolved':
        setStatusFilter('resolved');
        setSeverityFilter('all');
        setSlaFilter('all');
        setActiveTab('queue');
        break;
      case 'escalated':
        setActiveTab('escalations');
        break;
      default:
        break;
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setSeverityFilter('all');
    setSlaFilter('all');
    setMetricQuickFilter(null);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    departmentFilter !== 'all' ||
    statusFilter !== 'all' ||
    severityFilter !== 'all' ||
    slaFilter !== 'all' ||
    metricQuickFilter !== null;

  // Filter issues based on all active filter parameters
  const filteredIssues = useMemo(() => {
    return data.issues.filter((issue) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const publicRef = String(issue.public_id || issue.public_issue_id || issue.id || '').toLowerCase();
        const title = String(issue.title || '').toLowerCase();
        const desc = String(issue.description || issue.ai_summary || '').toLowerCase();
        const cat = String(issue.category || '').toLowerCase();
        const ward = String(issue.ward || '').toLowerCase();
        const dept = String(issue.department_name || '').toLowerCase();

        const matches =
          publicRef.includes(query) ||
          title.includes(query) ||
          desc.includes(query) ||
          cat.includes(query) ||
          ward.includes(query) ||
          dept.includes(query);

        if (!matches) return false;
      }

      // 2. Department Filter
      if (departmentFilter !== 'all') {
        if (
          issue.department_id !== departmentFilter &&
          issue.department_name !== departmentFilter
        ) {
          return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'escalated') {
          if (!issue.is_escalated && issue.status !== 'escalated') return false;
        } else if (String(issue.status).toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // 4. Severity Filter
      if (severityFilter !== 'all') {
        if (String(issue.severity).toLowerCase() !== severityFilter.toLowerCase()) {
          return false;
        }
      }

      // 5. SLA State Filter
      if (slaFilter !== 'all') {
        if (issue.sla_status !== slaFilter) {
          return false;
        }
      }

      return true;
    });
  }, [data.issues, searchQuery, departmentFilter, statusFilter, severityFilter, slaFilter]);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[hsl(224,30%,7%)] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <motion.div
          animate={{
            x: [0, 25, -20, 0],
            y: [0, -20, 15, 0],
            opacity: [0.08, 0.13, 0.08],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          className="absolute -top-48 right-1/4 w-[650px] h-[650px] rounded-full blur-[150px]"
          style={{
            background: 'radial-gradient(circle, hsl(230 90% 60%) 0%, hsl(260 80% 50% / 0.4) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, hsl(158 64% 52%) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px)',
          }}
        />
      </div>

      {/* Header */}
      <GovernmentHeader
        loading={loading}
        onRefresh={loadData}
        lastUpdated={lastUpdated}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="underline underline-offset-2 hover:text-white cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Real Summary KPI Metrics */}
        <GovernmentMetrics
          stats={data.stats}
          activeFilter={metricQuickFilter}
          onFilterChange={handleMetricCardClick}
        />

        {/* Filter Controls & Tab Switcher */}
        <GovernmentFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
          slaFilter={slaFilter}
          onSlaChange={setSlaFilter}
          departments={data.departments}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Active Tab View Rendering */}
        <div className="pt-2">
          {activeTab === 'queue' && (
            <GovernmentIssueQueue
              issues={filteredIssues}
              selectedIssueId={selectedIssue?.id}
              onSelectIssue={(issue) => setSelectedIssue(issue)}
              loading={loading}
            />
          )}

          {activeTab === 'map' && (
            <GovernmentMapView
              issues={filteredIssues}
              onSelectIssue={(issue) => setSelectedIssue(issue)}
            />
          )}

          {activeTab === 'escalations' && (
            <GovernmentEscalationsTable
              escalations={data.escalations}
              onSelectIssue={(issue) => setSelectedIssue(issue)}
            />
          )}

          {activeTab === 'agents' && (
            <GovernmentAgentActivity
              logs={data.recentLogs}
              onSelectIssue={(issue) => setSelectedIssue(issue)}
            />
          )}
        </div>
      </main>

      {/* Selected Issue Detail Modal */}
      {selectedIssue && (
        <GovernmentIssueDetailModal
          issueId={selectedIssue.id}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}
