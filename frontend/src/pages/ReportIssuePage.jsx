import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx';
import PhotoUploader from '../components/report/PhotoUploader.jsx';
import LocationCapture from '../components/report/LocationCapture.jsx';
import IssueDescription from '../components/report/IssueDescription.jsx';
import SubmitReportButton from '../components/report/SubmitReportButton.jsx';
import SubmissionSuccess from '../components/report/SubmissionSuccess.jsx';
import { uploadIssueImage } from '../services/storageService.js';
import { createCitizenIssue } from '../services/issuesService.js';
import api from '../services/api.js';
import { pageVariants } from '../lib/motionVariants.js';

/**
 * ReportIssuePage
 *
 * Citizen reporting page at /report.
 * Allows authenticated citizens to upload a photo, detect GPS location,
 * optionally describe the issue, and create a real record in public.issues.
 * Triggers the Intake Agent and backend orchestration workflow.
 */
export default function ReportIssuePage() {
  const { user } = useAuth();

  // Form State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');

  // UI Flow State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdIssue, setCreatedIssue] = useState(null);
  const [intakeDelayed, setIntakeDelayed] = useState(false);

  const handlePhotoChange = useCallback((file, previewUrl) => {
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setSubmitError(null);
  }, []);

  const handleLocationChange = useCallback((coords) => {
    setLocation(coords);
    setSubmitError(null);
  }, []);

  const handleSubmit = async () => {
    if (!user?.id) {
      setSubmitError('Authentication required. Please sign in again.');
      return;
    }

    if (!photoFile) {
      setSubmitError('Please attach a photo of the civic issue.');
      return;
    }

    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      setSubmitError('GPS location is required. Please allow browser location access.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Upload image to Supabase Storage `issue-images` bucket
      const uploadResult = await uploadIssueImage(photoFile, user.id);

      if (uploadResult.error || !uploadResult.publicUrl) {
        throw new Error(
          uploadResult.error?.message || 'Failed to upload photo to storage. Please check your connection and retry.'
        );
      }

      // Step 2: Create real issue in `public.issues` table
      const insertResult = await createCitizenIssue({
        userId: user.id,
        imageUrl: uploadResult.publicUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracy: location.accuracy,
        description: description,
      });

      if (insertResult.error || !insertResult.data) {
        throw new Error(
          insertResult.error?.message || 'Failed to file issue report in database. Your photo was saved; please retry.'
        );
      }

      let issueData = insertResult.data;

      // Step 3: Trigger Backend Intake Agent & Orchestrator
      try {
        const intakeResponse = await api.post(`/issues/${issueData.id}/intake`, {
          issueId: issueData.id,
          issue: issueData,
        });

        const intakeData = intakeResponse.data || {};

        // Merge public reference ID into the issue object for the success view
        if (intakeData.public_issue_id) {
          issueData = {
            ...issueData,
            public_id: intakeData.public_issue_id,
            public_issue_id: intakeData.public_issue_id,
            already_processed: intakeData.already_processed ?? false,
          };
        }
      } catch (agentErr) {
        // Issue was created successfully — intake failure must NOT delete it.
        // Surface a soft notice so the citizen knows processing is delayed.
        console.warn('[ReportIssuePage] Intake Agent call failed (non-blocking):', agentErr.message);
        setIntakeDelayed(true);
      }

      // Step 4: Display Success state
      setCreatedIssue(issueData);
    } catch (err) {
      console.error('[ReportIssuePage] Submission failed:', err);
      setSubmitError(err.message || 'An unexpected error occurred while submitting your report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: 'hsl(220 20% 10%)' }}
    >
      {/* Background ambient light */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      >
        <div
          className="absolute -top-40 left-1/3 w-[550px] h-[550px] rounded-full blur-[140px] opacity-[0.08]"
          style={{
            background: 'radial-gradient(circle, hsl(220 90% 56%) 0%, hsl(260 80% 50%) 60%, transparent 70%)',
          }}
        />
      </div>

      <DashboardNavbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {createdIssue ? (
            /* Success View */
            <SubmissionSuccess key="success" issue={createdIssue} intakeDelayed={intakeDelayed} />
          ) : (
            /* Form View */
            <motion.div
              key="form"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Back Navigation & Heading */}
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-150"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Dashboard</span>
                </Link>

                <div>
                  <h1
                    className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    Report a Civic Issue
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Capture the problem and we&apos;ll help route it to the right team.
                  </p>
                </div>
              </div>

              {/* Form Container */}
              <div
                className="
                  rounded-3xl p-6 sm:p-8 space-y-7
                  border border-[hsl(220_20%_18%)] bg-[hsl(220_20%_13%/0.8)] backdrop-blur-md
                  shadow-xl
                "
              >
                {/* Section A: Photo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                      Issue Photo <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-xs text-slate-500">Required</span>
                  </div>
                  <PhotoUploader
                    file={photoFile}
                    previewUrl={photoPreview}
                    onChange={handlePhotoChange}
                    disabled={submitting}
                  />
                </div>

                {/* Section B: Location */}
                <div className="space-y-2">
                  <LocationCapture
                    location={location}
                    onChange={handleLocationChange}
                    disabled={submitting}
                  />
                </div>

                {/* Section C: Optional Description */}
                <IssueDescription
                  value={description}
                  onChange={setDescription}
                  disabled={submitting}
                />

                {/* Submission Error Banner */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-2xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300"
                    role="alert"
                  >
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <span className="font-semibold">Submission failed</span>
                      <p className="text-rose-200/90 leading-relaxed">{submitError}</p>
                    </div>
                  </motion.div>
                )}

                {/* Section D: Submit Button */}
                <SubmitReportButton
                  onClick={handleSubmit}
                  submitting={submitting}
                  hasPhoto={!!photoFile}
                  hasLocation={!!location}
                  disabled={submitting}
                />

                {/* Security and Privacy Note */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                  <span>Authenticated submission via Supabase. GPS coordinates verify report location.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
