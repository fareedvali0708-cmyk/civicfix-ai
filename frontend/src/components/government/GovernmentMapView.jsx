import { motion } from 'motion/react';
import { MapPin, ExternalLink, AlertTriangle, Layers, Building } from 'lucide-react';
import { containerStagger, itemFadeUp } from '../../lib/motionVariants.js';

export default function GovernmentMapView({ issues = [], onSelectIssue }) {
  const geoIssues = issues.filter(
    (i) => i.latitude !== null && i.longitude !== null && !isNaN(Number(i.latitude)) && !isNaN(Number(i.longitude))
  );

  if (geoIssues.length === 0) {
    return (
      <div className="p-12 text-center bg-[hsl(222,25%,12%/0.5)] border border-[hsl(222,20%,18%)] rounded-2xl backdrop-blur-md space-y-2">
        <MapPin size={28} className="mx-auto text-slate-500" />
        <h3 className="text-base font-bold text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          No Geo-Tagged Issues in Current View
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          None of the filtered issues currently have GPS coordinates recorded. Issues reported with camera GPS will display here automatically.
        </p>
      </div>
    );
  }

  // Calculate center of coordinates
  const avgLat = (geoIssues.reduce((sum, i) => sum + Number(i.latitude), 0) / geoIssues.length).toFixed(4);
  const avgLng = (geoIssues.reduce((sum, i) => sum + Number(i.longitude), 0) / geoIssues.length).toFixed(4);

  const getMarkerColor = (sev) => {
    const s = String(sev || '').toLowerCase();
    if (s === 'critical') return 'bg-red-500 ring-red-400/50 shadow-red-500/50 animate-pulse';
    if (s === 'high') return 'bg-amber-500 ring-amber-400/50 shadow-amber-500/50';
    if (s === 'medium') return 'bg-blue-500 ring-blue-400/50 shadow-blue-500/50';
    return 'bg-slate-400 ring-slate-300/50 shadow-slate-400/50';
  };

  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            Municipal GPS Spatial Distribution ({geoIssues.length} points)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-[hsl(222,20%,16%)] px-2.5 py-1 rounded-lg border border-[hsl(222,20%,22%)]">
          Center: {avgLat}, {avgLng}
        </span>
      </div>

      {/* Interactive Geo-Pin Grid & Map Cards */}
      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {geoIssues.map((issue) => {
          const publicRef = issue.public_id || issue.public_issue_id || issue.id.slice(0, 8);
          const isCritical = String(issue.severity).toLowerCase() === 'critical';
          const isHigh = String(issue.severity).toLowerCase() === 'high';

          return (
            <motion.div
              key={issue.id}
              variants={itemFadeUp}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              onClick={() => onSelectIssue && onSelectIssue(issue)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm bg-[hsl(222,25%,13%/0.9)] hover:bg-[hsl(222,25%,16%)] ${
                isCritical
                  ? 'border-red-500/50 ring-1 ring-red-500/30'
                  : isHigh
                    ? 'border-amber-500/40'
                    : 'border-[hsl(222,20%,20%)] hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ring-4 shadow-md ${getMarkerColor(issue.severity)}`} />
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    #{publicRef}
                  </span>
                </div>

                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[hsl(222,20%,20%)] text-slate-300 border border-[hsl(222,20%,24%)]">
                  {issue.severity || 'medium'}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white truncate mb-1">
                {issue.title || (issue.category ? issue.category.replace(/_/g, ' ') : 'Reported Issue')}
              </h4>

              <p className="text-[11px] text-slate-400 truncate mb-2.5">
                {issue.address || `Lat: ${Number(issue.latitude).toFixed(4)}, Lng: ${Number(issue.longitude).toFixed(4)}`}
              </p>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[hsl(222,20%,18%)]">
                <span className="text-slate-400 flex items-center gap-1 truncate max-w-[130px]">
                  <Building size={11} className="text-slate-500" />
                  {issue.department_name}
                </span>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Directions</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

