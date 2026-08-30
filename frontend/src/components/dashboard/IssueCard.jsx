import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Calendar, ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import IssueStatusBadge from './IssueStatusBadge.jsx';
import { getPriorityConfig } from '../../lib/statusConfig.js';
import { getSignedImageUrl } from '../../services/issueDetailsService.js';
import { cardHover3D, transitions } from '../../lib/motionVariants.js';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function truncate(text, maxLen = 120) {
  if (!text) return null;
  return text.length > maxLen ? `${text.slice(0, maxLen).trimEnd()}…` : text;
}

export default function IssueCard({ issue, index = 0 }) {
  const priority = getPriorityConfig(issue.priority);
  const [signedUrl, setSignedUrl] = useState(issue.signed_image_url || null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (issue.signed_image_url) {
      setSignedUrl(issue.signed_image_url);
      return;
    }
    if (issue.image_url) {
      let cancelled = false;
      getSignedImageUrl(issue.image_url).then((url) => {
        if (!cancelled && url) {
          setSignedUrl(url);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [issue.image_url, issue.signed_image_url]);

  const displayImageUrl = signedUrl || issue.image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      variants={cardHover3D}
      initial="rest"
      whileHover="hover"
      className="
        group relative rounded-3xl overflow-hidden
        glass-stitch hover:glass-stitch-elevated
        transition-all duration-300
      "
    >
      <div className="flex flex-col sm:flex-row">

        {/* Photographic Evidence Frame */}
        {displayImageUrl && !imageError ? (
          <div className="sm:w-48 sm:shrink-0 h-48 sm:h-auto overflow-hidden bg-black/40 relative">
            <img
              src={displayImageUrl}
              alt={issue.title || 'Issue photo'}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-[hsl(224_35%_12%/0.8)] pointer-events-none" />
          </div>
        ) : (
          <div className="hidden sm:flex sm:w-20 sm:shrink-0 items-center justify-center bg-white/[0.02] border-r border-white/[0.04] text-slate-600">
            <ImageIcon size={20} strokeWidth={1.5} />
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 sm:p-7 flex flex-col justify-between gap-4 min-w-0">

          {/* Title & Status Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="font-bold text-white text-base sm:text-lg leading-snug group-hover:text-blue-200 transition-colors duration-200 truncate">
                {issue.title || 'Civic Grievance Report'}
              </h3>
              <IssueStatusBadge status={issue.status} />
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed line-clamp-2">
              {truncate(issue.description) || 'No citizen description provided.'}
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-slate-500" />
                <span>{formatDate(issue.created_at)}</span>
              </div>

              {issue.category && (
                <span className="capitalize px-2.5 py-0.5 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.06] font-medium">
                  {String(issue.category).replace(/_/g, ' ')}
                </span>
              )}

              {priority && (
                <span
                  className="px-2.5 py-0.5 rounded-lg font-semibold text-[11px]"
                  style={{ color: priority.color, backgroundColor: `${priority.color}15`, border: `1px solid ${priority.color}30` }}
                >
                  {priority.label}
                </span>
              )}
            </div>

            {/* View Details CTA */}
            <Link
              to={`/issues/${issue.id}`}
              className="
                inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold
                text-blue-400 group-hover:text-white bg-blue-500/10 group-hover:bg-blue-600
                border border-blue-500/20 group-hover:border-blue-500
                shadow-sm transition-all duration-200
              "
            >
              <span>View Details</span>
              <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
