import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  UploadCloud,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  SwitchCamera,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { transitions, buttonHoverTap } from '../../lib/motionVariants.js';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/jpg',
];
const ACCEPTED_EXTENSIONS_STR = '.jpg,.jpeg,.png,.webp,.heic,.heif';

/**
 * Format bytes to readable string (e.g. "2.45 MB" or "850 KB")
 */
function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

/**
 * PhotoUploader
 *
 * Provides two clear, modern options:
 * 1. "Take Photo": Real in-browser camera capture via MediaDevices getUserMedia
 * 2. "Upload Photo": File picker & drag-and-drop
 *
 * Includes live viewfinder, camera switcher, photo retake, clear validation,
 * and robust stream cleanup.
 */
export default function PhotoUploader({
  file,
  previewUrl,
  onChange,
  onError,
  disabled = false,
}) {
  // State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // Mobile rear camera by default
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [captureSource, setCaptureSource] = useState(null); // 'camera' | 'upload'

  // Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Safe stop all active camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn('[PhotoUploader] Error stopping tracks:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Keyboard accessibility: Escape to close camera modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCameraOpen) {
        stopCamera();
        setIsCameraOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCameraOpen, stopCamera]);

  // Validate uploaded file
  const validateAndSetFile = (selectedFile, source = 'upload') => {
    setLocalError(null);
    if (onError) onError(null);

    if (!selectedFile) return;

    // Check extension / MIME type
    const isExtensionValid = selectedFile.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i);
    const isTypeValid = ACCEPTED_MIME_TYPES.includes(selectedFile.type);

    if (!isTypeValid && !isExtensionValid) {
      const err = 'Please upload a valid image file (JPEG, PNG, WEBP, or HEIC/HEIF).';
      setLocalError(err);
      if (onError) onError(err);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const err = `Image size exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller photo.`;
      setLocalError(err);
      if (onError) onError(err);
      return;
    }

    const preview = URL.createObjectURL(selectedFile);
    setCaptureSource(source);
    onChange(selectedFile, preview);
  };

  // Launch live camera stream
  const startCamera = async (targetFacingMode = facingMode) => {
    if (disabled) return;
    setLocalError(null);
    setCameraLoading(true);
    setIsCameraOpen(true);

    // Verify browser support
    if (!navigator?.mediaDevices?.getUserMedia) {
      const err = 'Live camera capture is not supported in this browser. Please use "Upload Photo" instead.';
      setLocalError(err);
      if (onError) onError(err);
      setIsCameraOpen(false);
      setCameraLoading(false);
      return;
    }

    // Stop existing stream if any
    stopCamera();

    try {
      let stream;
      try {
        // Preferred mobile rear camera / high resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (modeErr) {
        console.warn('[PhotoUploader] Facing mode failed, falling back to standard video:', modeErr);
        // Fallback for desktop webcams or restricted constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((playErr) => {
          console.warn('[PhotoUploader] Autoplay was prevented:', playErr);
        });
      }

      // Check if device has multiple cameras (front/rear or multiple webcams)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }

      setCameraLoading(false);
    } catch (err) {
      console.error('[PhotoUploader] Camera access error:', err);
      stopCamera();
      setIsCameraOpen(false);
      setCameraLoading(false);

      let userMsg = 'Unable to access your camera. You can upload a photo instead.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMsg = 'Camera permission was denied. Please allow camera permissions in your browser or choose "Upload Photo".';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMsg = 'No camera device was found. Please choose "Upload Photo" instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMsg = 'Camera is currently in use by another app. Please close other camera apps or choose "Upload Photo".';
      }

      setLocalError(userMsg);
      if (onError) onError(userMsg);
    }
  };

  // Switch between front and rear cameras
  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Close camera modal
  const handleCloseCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  // Capture current video frame to canvas and create File object
  const handleCapturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not initialize canvas context');
      }

      // Draw full resolution frame
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setLocalError('Failed to capture frame from camera. Please try again.');
            setIsCapturing(false);
            return;
          }

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const fileName = `civic_photo_${timestamp}.jpg`;
          const capturedFile = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          // Stop camera stream & close UI
          stopCamera();
          setIsCameraOpen(false);
          setIsCapturing(false);

          // Deliver file & preview
          validateAndSetFile(capturedFile, 'camera');
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('[PhotoUploader] Capture failed:', err);
      setLocalError('An error occurred during photo capture. Please try again.');
      setIsCapturing(false);
    }
  };

  // File input change
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected, 'upload');
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile, 'upload');
    }
  };

  // Remove current selection
  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onChange(null, null);
    setCaptureSource(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden standard file input for "Upload Photo" */}
      <input
        ref={fileInputRef}
        type="file"
        id="issue-photo-input"
        accept={`${ACCEPTED_MIME_TYPES.join(',')},${ACCEPTED_EXTENSIONS_STR}`}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <AnimatePresence mode="wait">
        {previewUrl ? (
          /* ==========================================================
           * 1. PREVIEW STATE (After Camera Capture or File Upload)
           * ========================================================== */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={transitions.easeSmooth}
            className="relative rounded-2xl overflow-hidden border border-[hsl(220_20%_22%)] bg-[hsl(220_20%_14%)] shadow-lg"
          >
            {/* Image display */}
            <div className="relative h-64 sm:h-80 w-full bg-[hsl(220_20%_12%)] overflow-hidden group">
              <img
                src={previewUrl}
                alt="Captured civic issue preview"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

              {/* Status Badge */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-sm">
                <CheckCircle2 size={13} />
                <span>
                  {captureSource === 'camera' ? 'Camera Captured' : 'Photo Attached'}
                </span>
              </div>

              {/* Delete / Remove Button */}
              <motion.button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                variants={buttonHoverTap}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Remove attached photo"
                className="absolute top-3.5 right-3.5 flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-300 text-xs backdrop-blur-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <X size={16} />
              </motion.button>

              {/* Bottom Quick-Action Bar on Image */}
              <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => startCamera()}
                    disabled={disabled}
                    variants={buttonHoverTap}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(220_20%_10%/0.85)] hover:bg-[hsl(220_20%_18%)] border border-[hsl(220_20%_28%)] text-xs font-medium text-white backdrop-blur-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <Camera size={13} className="text-blue-400" />
                    <span>Retake Photo</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    variants={buttonHoverTap}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(220_20%_10%/0.85)] hover:bg-[hsl(220_20%_18%)] border border-[hsl(220_20%_28%)] text-xs font-medium text-slate-200 hover:text-white backdrop-blur-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <UploadCloud size={13} className="text-slate-400" />
                    <span>Change File</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* File info footer */}
            <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 bg-[hsl(220_20%_12%)] border-t border-[hsl(220_20%_18%)]">
              <span className="truncate max-w-[200px] sm:max-w-xs font-mono text-[11px] text-slate-300">
                {file?.name || 'civic_photo.jpg'}
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {formatFileSize(file?.size)}
              </span>
            </div>
          </motion.div>
        ) : (
          /* ==========================================================
           * 2. SELECTION STATE (TWO CLEAR CHOICES: Take Photo / Upload)
           * ========================================================== */
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={transitions.easeSmooth}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-2xl p-6 sm:p-7
              border-2 border-dashed transition-all duration-200
              ${
                isDragging
                  ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                  : 'border-[hsl(220_20%_22%)] bg-[hsl(220_20%_13%/0.7)]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {/* Header prompt */}
            <div className="text-center max-w-md mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
                <Sparkles size={12} />
                <span>AI Vision Assisted</span>
              </div>
              <h3
                className="text-base sm:text-lg font-semibold text-white tracking-tight"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                Add Photo of the Issue
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Take a live photo on-site or upload an image file from your device.
              </p>
            </div>

            {/* TWO Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg mx-auto">
              {/* Option 1: Take Photo */}
              <motion.button
                type="button"
                id="take-photo-button"
                onClick={() => startCamera('environment')}
                disabled={disabled}
                variants={buttonHoverTap}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="
                  group relative flex flex-col items-center justify-center p-5 rounded-xl
                  bg-gradient-to-b from-blue-600/90 to-blue-700 hover:from-blue-500 hover:to-blue-600
                  text-white border border-blue-400/40 shadow-lg shadow-blue-900/30
                  transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
                "
              >
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-2.5 text-white group-hover:scale-110 transition-transform duration-200">
                  <Camera size={22} strokeWidth={2.2} />
                </div>
                <span
                  className="font-semibold text-sm tracking-wide"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Take Photo
                </span>
                <span className="text-[11px] text-blue-100/80 mt-0.5">
                  Use device camera
                </span>
              </motion.button>

              {/* Option 2: Upload Photo */}
              <motion.button
                type="button"
                id="upload-photo-button"
                onClick={() => !disabled && fileInputRef.current?.click()}
                disabled={disabled}
                variants={buttonHoverTap}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="
                  group relative flex flex-col items-center justify-center p-5 rounded-xl
                  bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_22%)]
                  border border-[hsl(220_20%_28%)] text-slate-200 hover:text-white
                  transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
                "
              >
                <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-2.5 text-slate-300 group-hover:text-white group-hover:scale-110 transition-all duration-200">
                  <UploadCloud size={22} strokeWidth={2} />
                </div>
                <span
                  className="font-semibold text-sm tracking-wide"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Upload Photo
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Browse or drop file
                </span>
              </motion.button>
            </div>

            {/* Format support footer note */}
            <div className="text-center mt-5 pt-4 border-t border-[hsl(220_20%_18%)]">
              <p className="text-[11px] text-slate-400">
                Supports JPEG, PNG, WEBP, HEIC up to {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error alert banner */}
      {localError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/25 text-rose-300"
          role="alert"
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{localError}</span>
        </motion.div>
      )}

      {/* ============================================================
       * 3. REAL IN-PAGE CAMERA MODAL / VIEWFINDER
       * ============================================================ */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="CivicFix Camera Capture"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={transitions.springFast}
              className="
                relative w-full max-w-xl rounded-3xl overflow-hidden
                bg-[hsl(220_20%_10%)] border border-[hsl(220_20%_22%)]
                shadow-2xl flex flex-col
              "
            >
              {/* Camera Header Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(220_20%_18%)] bg-[hsl(220_20%_12%)]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span
                    className="text-xs font-semibold text-white tracking-wide uppercase"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    Live Camera Viewfinder
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Switch Front/Rear Camera Button (if multiple cameras available) */}
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={toggleCameraFacingMode}
                      disabled={cameraLoading}
                      title="Switch Camera (Front/Rear)"
                      aria-label="Switch Camera"
                      className="p-2 rounded-xl text-slate-300 hover:text-white bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_25%)] border border-[hsl(220_20%_28%)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <SwitchCamera size={16} />
                    </button>
                  )}

                  {/* Close / Cancel Button */}
                  <button
                    type="button"
                    onClick={handleCloseCamera}
                    aria-label="Close Camera"
                    className="p-2 rounded-xl text-slate-300 hover:text-white bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_25%)] border border-[hsl(220_20%_28%)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Viewfinder Video Area */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black overflow-hidden flex items-center justify-center">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Shutter Flash Animation Overlay */}
                <AnimatePresence>
                  {isCapturing && (
                    <motion.div
                      initial={{ opacity: 0.9 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 bg-white pointer-events-none z-30"
                    />
                  )}
                </AnimatePresence>

                {/* Loading state indicator */}
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[hsl(220_20%_10%)] text-slate-300 gap-3 z-20">
                    <RefreshCw className="animate-spin text-blue-400" size={28} />
                    <span className="text-xs font-medium">Connecting to camera...</span>
                  </div>
                )}

                {/* HUD Viewfinder Overlay (Grid & Corners) */}
                {!cameraLoading && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                    {/* Top corner brackets */}
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-sm" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-sm" />
                    </div>

                    {/* Center Civic Reticle */}
                    <div className="self-center flex flex-col items-center gap-1.5 opacity-60">
                      <div className="w-8 h-8 border border-white/40 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      </div>
                      <span className="text-[10px] tracking-wider uppercase text-white/80 font-medium bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        Center Issue
                      </span>
                    </div>

                    {/* Bottom corner brackets */}
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-sm" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Shutter & Footer Controls */}
              <div className="p-4 sm:p-5 bg-[hsl(220_20%_12%)] border-t border-[hsl(220_20%_18%)] flex items-center justify-between">
                {/* Cancel action */}
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  disabled={cameraLoading || isCapturing}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_24%)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Cancel
                </button>

                {/* Primary Shutter Button */}
                <motion.button
                  type="button"
                  id="camera-capture-button"
                  onClick={handleCapturePhoto}
                  disabled={cameraLoading || isCapturing}
                  variants={buttonHoverTap}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  aria-label="Capture photo"
                  className="
                    relative flex items-center justify-center w-16 h-16 rounded-full
                    bg-white text-slate-900 shadow-lg shadow-white/10
                    border-4 border-[hsl(220_20%_24%)] hover:border-blue-400
                    transition-colors focus:outline-none focus:ring-4 focus:ring-blue-400/40
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Camera size={20} strokeWidth={2.2} />
                  </div>
                </motion.button>

                {/* Switch camera / Fallback upload button */}
                <button
                  type="button"
                  onClick={() => {
                    handleCloseCamera();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_24%)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  title="Upload from files instead"
                >
                  <ImageIcon size={14} />
                  <span className="hidden sm:inline">Upload file</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
