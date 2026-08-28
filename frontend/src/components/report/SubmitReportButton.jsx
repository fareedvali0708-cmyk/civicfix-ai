import { motion } from 'motion/react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { buttonHoverTap, transitions } from '../../lib/motionVariants.js';

/**
 * SubmitReportButton
 *
 * Primary submission button with validation guard and loading indicator.
 */
export default function SubmitReportButton({
  onClick,
  submitting,
  hasPhoto,
  hasLocation,
  disabled = false,
}) {
  const isReady = hasPhoto && hasLocation && !disabled && !submitting;

  const getHelperMessage = () => {
    if (!hasPhoto && !hasLocation) return 'Please add a photo and allow GPS location to submit.';
    if (!hasPhoto) return 'Please upload or capture a photo of the issue.';
    if (!hasLocation) return 'GPS location is required to submit a report.';
    return null;
  };

  const helperText = !isReady && !submitting ? getHelperMessage() : null;

  return (
    <div className="space-y-2 pt-2">
      <motion.button
        id="submit-report-btn"
        type="button"
        onClick={onClick}
        disabled={!isReady}
        variants={isReady ? buttonHoverTap : {}}
        initial="rest"
        whileHover={isReady ? 'hover' : undefined}
        whileTap={isReady ? 'tap' : undefined}
        className={`
          w-full relative flex items-center justify-center gap-2.5
          py-3.5 px-6 rounded-2xl font-bold text-sm text-white
          shadow-lg transition-all duration-200
          ${
            isReady
              ? 'cursor-pointer shadow-blue-500/25'
              : 'opacity-50 cursor-not-allowed shadow-none'
          }
        `}
        style={{
          background: isReady
            ? 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 46%) 100%)'
            : 'hsl(220 20% 20%)',
        }}
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin text-white shrink-0" />
            <span>Uploading photo & filing report…</span>
          </>
        ) : (
          <>
            <Send size={16} />
            <span>Submit Report</span>
          </>
        )}
      </motion.button>

      {helperText && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center">
          <AlertCircle size={13} className="text-amber-400 shrink-0" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  );
}
