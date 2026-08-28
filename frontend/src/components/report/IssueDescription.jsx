import { AlignLeft } from 'lucide-react';

/**
 * IssueDescription
 *
 * Optional text field for the citizen to provide additional context.
 */
export default function IssueDescription({ value, onChange, disabled = false }) {
  const MAX_LENGTH = 600;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="issue-description"
          className="flex items-center gap-2 text-sm font-semibold text-white"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          <AlignLeft size={16} className="text-blue-400" />
          <span>Description <span className="text-xs text-slate-500 font-normal">(Optional)</span></span>
        </label>
        <span className="text-xs text-slate-500 font-mono">
          {(value || '').length}/{MAX_LENGTH}
        </span>
      </div>

      <div className="relative">
        <textarea
          id="issue-description"
          rows={3}
          maxLength={MAX_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Describe the problem (e.g., Deep pothole on right lane causing traffic slowdown)..."
          className="
            w-full px-4 py-3 rounded-2xl text-sm text-slate-200 placeholder-slate-500
            bg-[hsl(220_20%_13%/0.7)] hover:bg-[hsl(220_20%_15%/0.8)]
            border border-[hsl(220_20%_20%)] focus:border-blue-500/80
            focus:ring-2 focus:ring-blue-500/20 focus:outline-none
            transition-all duration-150 resize-none
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
      </div>

      <p className="text-[11px] text-slate-500">
        Our Intake & Analysis agents will inspect your photo and description to verify and assign the issue.
      </p>
    </div>
  );
}
