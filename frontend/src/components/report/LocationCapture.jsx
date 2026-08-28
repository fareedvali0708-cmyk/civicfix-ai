import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { transitions, buttonHoverTap } from '../../lib/motionVariants.js';

/**
 * LocationCapture
 *
 * Automatically captures GPS coordinates using HTML5 Geolocation API on mount.
 * Displays latitude, longitude, and accuracy in meters.
 * Uses ref-backed callback handlers to prevent infinite render loops.
 */
export default function LocationCapture({ location, onChange, onError, disabled = false }) {
  const [detecting, setDetecting] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  // Keep callback references stable
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const err = 'Geolocation is not supported by your browser.';
      setErrorStatus(err);
      onErrorRef.current?.(err);
      return;
    }

    setDetecting(true);
    setErrorStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setDetecting(false);
        setErrorStatus(null);
        onChangeRef.current?.(coords);
      },
      (error) => {
        setDetecting(false);
        let errorMsg = 'Unable to detect location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS location is currently unavailable. Please try again.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please retry.';
        }

        setErrorStatus(errorMsg);
        onChangeRef.current?.(null);
        onErrorRef.current?.(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Request location automatically once on mount
  useEffect(() => {
    captureLocation();
  }, [captureLocation]);

  return (
    <div className="space-y-3">
      <div
        className="
          rounded-2xl p-5 sm:p-6
          border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_13%/0.7)] backdrop-blur-sm
          space-y-4
        "
      >
        {/* Header row with status pill */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                location
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : detecting
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              <Navigation size={17} className={detecting ? 'animate-spin' : ''} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                GPS Location <span className="text-rose-400">*</span>
              </p>
              <p className="text-xs text-slate-400">
                Automatic device geolocation for municipal dispatch
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div>
            {location ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 size={13} />
                <span>Location detected</span>
              </span>
            ) : detecting ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                <RefreshCw size={13} className="animate-spin" />
                <span>Acquiring GPS…</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                <AlertTriangle size={13} />
                <span>Unable to detect location</span>
              </span>
            )}
          </div>
        </div>

        {/* Coordinates Display Card */}
        {location ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.easeFast}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[hsl(220_20%_10%)] border border-[hsl(220_20%_18%)] text-xs"
          >
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium">Latitude</span>
              <p className="font-mono text-slate-200 font-semibold">{location.latitude.toFixed(6)}°</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium">Longitude</span>
              <p className="font-mono text-slate-200 font-semibold">{location.longitude.toFixed(6)}°</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium">GPS Precision</span>
              <p className="font-mono text-emerald-400 font-semibold">±{location.accuracy} meters</p>
            </div>
          </motion.div>
        ) : null}

        {/* Error message or retry action */}
        {errorStatus && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-3 p-3.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/25 text-rose-300"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{errorStatus}</span>
            </div>
            <motion.button
              type="button"
              onClick={captureLocation}
              disabled={detecting || disabled}
              variants={buttonHoverTap}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold transition-colors"
            >
              <RefreshCw size={12} className={detecting ? 'animate-spin' : ''} />
              <span>Retry</span>
            </motion.button>
          </motion.div>
        )}

        {/* Refresh button if already acquired */}
        {location && !disabled && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={captureLocation}
              disabled={detecting}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-300 transition-colors"
            >
              <RefreshCw size={12} className={detecting ? 'animate-spin' : ''} />
              <span>Update GPS coordinates</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
