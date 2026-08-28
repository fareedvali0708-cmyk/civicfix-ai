import { GoogleGenAI, Type } from '@google/genai';
import config from '../config/env.js';
import { supabaseAdmin, getSupabaseUserClient } from '../config/supabase.js';

/**
 * Analysis Agent
 *
 * Responsibilities:
 * 1. Retrieve the citizen's uploaded issue photo securely from the private `issue-images` bucket.
 * 2. Analyze the visual evidence, citizen description, and location metadata using Gemini Vision.
 * 3. Generate structured classification:
 *    - category (pothole, road_damage, streetlight, drainage, garbage, water_sanitation, damaged_infrastructure, other)
 *    - severity (low, medium, high, critical)
 *    - confidence (0.0 - 1.0)
 *    - concise_reasoning (short visual explanation)
 *    - recommended_department (municipal department recommendation)
 * 4. Deterministically derive priority_level from severity.
 * 5. Update `public.issues` with analysis fields (category, severity, priority_level, ai_confidence, ai_summary).
 * 6. Record audit entry in `public.agent_logs`.
 * 7. Record timeline entry in `public.issue_updates`.
 * 8. Hand off to Assignment Agent (next_agent: "Assignment Agent").
 */

const BUCKET_NAME = 'issue-images';

const ALLOWED_CATEGORIES = [
  'pothole',
  'road_damage',
  'streetlight',
  'drainage',
  'garbage',
  'water_sanitation',
  'damaged_infrastructure',
  'other',
];

const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];

/**
 * Extract storage object path from image_url.
 *
 * @param {string} imageUrl
 * @returns {string|null}
 */
function extractStoragePath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  const bucketMarker = `/${BUCKET_NAME}/`;
  const markerIndex = imageUrl.indexOf(bucketMarker);
  if (markerIndex !== -1) {
    const path = imageUrl.slice(markerIndex + bucketMarker.length);
    return path.split('?')[0] || null;
  }

  if (!imageUrl.startsWith('http')) {
    return imageUrl.split('?')[0] || null;
  }

  return null;
}

/**
 * Retrieve image bytes from Supabase private storage or direct URL.
 *
 * @param {string} imageUrl
 * @returns {Promise<{ base64Data: string, mimeType: string }>}
 */
async function retrieveImageBytes(imageUrl) {
  if (!imageUrl) {
    throw new Error('No image URL provided for analysis.');
  }

  const storagePath = extractStoragePath(imageUrl);

  if (storagePath) {
    console.log(`[analysisAgent] Downloading image from private storage: ${storagePath}`);
    const { data: blob, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !blob) {
      throw new Error(`Failed to download image from storage: ${error?.message || 'Empty file'}`);
    }

    const arrayBuffer = await blob.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    let mimeType = blob.type || 'image/jpeg';

    if (!mimeType || mimeType === 'application/octet-stream') {
      const lower = storagePath.toLowerCase();
      if (lower.endsWith('.png')) mimeType = 'image/png';
      else if (lower.endsWith('.webp')) mimeType = 'image/webp';
      else if (lower.endsWith('.heic')) mimeType = 'image/heic';
      else mimeType = 'image/jpeg';
    }

    return { base64Data, mimeType };
  }

  // Fallback for direct http/https URLs
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log(`[analysisAgent] Fetching image from URL`);
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image from URL: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    return { base64Data, mimeType };
  }

  throw new Error(`Unrecognized image URL format: ${imageUrl}`);
}

/**
 * Helper to record an agent action in `public.agent_logs`.
 *
 * @param {Object} params
 */
async function logAgentAction({ issueId, action, executionStatus, input, output, errorMessage }) {
  try {
    const payload = {
      agent_name: 'Analysis Agent',
      action: action || 'ISSUE_ANALYSIS',
      issue_id: issueId || null,
      execution_status: executionStatus, // 'success' | 'failed'
      input: input || null,
      output: output || null,
      error_message: errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert([payload]);
    if (error) {
      console.error('[analysisAgent] agent_logs insert error:', error.message);
    } else {
      console.log(`[analysisAgent] Successfully recorded agent_log (${executionStatus}) for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[analysisAgent] Exception while writing to agent_logs:', err.message);
  }
}

/**
 * Helper to write a timeline event to `public.issue_updates`.
 *
 * @param {Object} params
 */
async function logIssueUpdate({ issueId, message, oldStatus = 'reported', newStatus = 'reported', metadata = null }) {
  try {
    const payload = {
      issue_id: issueId,
      agent_name: 'Analysis Agent',
      message: message,
      old_status: oldStatus,
      new_status: newStatus,
      metadata: metadata,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('issue_updates').insert([payload]);
    if (error) {
      console.error('[analysisAgent] issue_updates insert error:', error.message);
    } else {
      console.log(`[analysisAgent] Successfully recorded issue_update for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[analysisAgent] Exception while writing to issue_updates:', err.message);
  }
}

/**
 * Deterministically derive priority_level from severity.
 *
 * @param {string} severity
 * @returns {string}
 */
function derivePriority(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Execute Gemini Vision analysis on the issue.
 *
 * @param {Object} params
 * @param {string} params.base64Data
 * @param {string} params.mimeType
 * @param {string|null} params.description
 * @param {number|null} params.latitude
 * @param {number|null} params.longitude
 * @param {string|null} params.address
 * @returns {Promise<{ category: string, severity: string, confidence: number, concise_reasoning: string, recommended_department: string }>}
 */
async function callGeminiVision({ base64Data, mimeType, description, latitude, longitude, address }) {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment.');
  }

  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

  const prompt = `You are the CivicFix AI Analysis Agent. Analyze the attached civic issue photograph, citizen description, and location context.

Your task is to classify the issue and evaluate its severity based strictly on visual evidence:
- category: Must be one of ["pothole", "road_damage", "streetlight", "drainage", "garbage", "water_sanitation", "damaged_infrastructure", "other"]
- severity: Must be one of ["low", "medium", "high", "critical"]
- confidence: Float value from 0.0 to 1.0 representing confidence in classification
- concise_reasoning: Brief 1-2 sentence explanation of visual evidence and safety risk
- recommended_department: Name of the municipal department responsible for addressing this issue (e.g. "Roads & Traffic Department", "Public Health & Sanitation", "Electrical & Lighting", "Water Supply & Sewerage Board")

Citizen Description: "${description || 'No citizen description provided.'}"
Location Context: ${latitude && longitude ? `Latitude ${latitude}, Longitude ${longitude}` : 'No GPS coordinates'} ${address ? `(${address})` : ''}
`;

  // Candidate models to support graceful fallback if a model is temporarily unavailable
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      console.log(`[analysisAgent] Sending request to Gemini Vision using model: ${modelName}`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                enum: ALLOWED_CATEGORIES,
              },
              severity: {
                type: Type.STRING,
                enum: ALLOWED_SEVERITIES,
              },
              confidence: {
                type: Type.NUMBER,
              },
              concise_reasoning: {
                type: Type.STRING,
              },
              recommended_department: {
                type: Type.STRING,
              },
            },
            required: [
              'category',
              'severity',
              'confidence',
              'concise_reasoning',
              'recommended_department',
            ],
          },
        },
      });

      if (!response.text) {
        throw new Error('Empty response received from Gemini.');
      }

      const parsed = JSON.parse(response.text);

      // Validate output fields
      if (!ALLOWED_CATEGORIES.includes(parsed.category)) {
        throw new Error(`Invalid category received from model: ${parsed.category}`);
      }

      if (!ALLOWED_SEVERITIES.includes(parsed.severity)) {
        throw new Error(`Invalid severity received from model: ${parsed.severity}`);
      }

      const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.8;

      return {
        category: parsed.category,
        severity: parsed.severity,
        confidence: Number(confidence.toFixed(2)),
        concise_reasoning: String(parsed.concise_reasoning || '').trim(),
        recommended_department: String(parsed.recommended_department || 'Public Works Department').trim(),
      };
    } catch (err) {
      console.warn(`[analysisAgent] Gemini model ${modelName} returned error:`, err.message);
      lastError = err;
      // Continue to next candidate model if 503/404
      if (err.status === 404 || err.status === 503 || err.message?.includes('UNAVAILABLE') || err.message?.includes('NOT_FOUND')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to generate content.');
}

/**
 * Run the Analysis Agent on an issue.
 *
 * @param {string|Object} input - Issue UUID or issue record
 * @param {Object} [options] - Optional execution options (userClient, token)
 * @returns {Promise<{ success: boolean, issue_id: string, agent_name: string, category?: string, severity?: string, confidence?: number, recommended_department?: string, next_agent?: string|null, error?: string }>}
 */
export async function runAnalysisAgent(input, options = {}) {
  const issueId = typeof input === 'string' ? input : input?.id;
  const readClient = options.userClient || (options.token ? getSupabaseUserClient(options.token) : supabaseAdmin);

  if (!issueId) {
    return {
      success: false,
      issue_id: null,
      agent_name: 'Analysis Agent',
      error: 'Missing issueId for Analysis Agent.',
      next_agent: null,
    };
  }

  console.log(`[analysisAgent] Starting Analysis Agent for issue: ${issueId}`);

  try {
    // 1. Fetch current issue record from database
    let issueRecord = null;
    if (typeof input === 'object' && input !== null && input.image_url) {
      issueRecord = input;
    } else {
      const { data, error } = await readClient
        .from('issues')
        .select('*')
        .eq('id', issueId)
        .single();

      if (error || !data) {
        // Fallback with admin client
        const { data: adminData, error: adminErr } = await supabaseAdmin
          .from('issues')
          .select('*')
          .eq('id', issueId)
          .single();

        if (adminErr || !adminData) {
          throw new Error(`Issue not found for analysis: ${error?.message || adminErr?.message || issueId}`);
        }
        issueRecord = adminData;
      } else {
        issueRecord = data;
      }
    }

    // 2. Idempotency check: verify if successful analysis was already logged
    try {
      const { data: existingLogs, error: logCheckError } = await supabaseAdmin
        .from('agent_logs')
        .select('id, output, execution_status')
        .eq('issue_id', issueId)
        .eq('action', 'ISSUE_ANALYSIS')
        .eq('execution_status', 'success')
        .limit(1);

      if (!logCheckError && Array.isArray(existingLogs) && existingLogs.length > 0) {
        const cached = existingLogs[0].output || {};
        console.log(`[analysisAgent] Issue ${issueId} has already been analyzed. Returning cached result.`);
        return {
          success: true,
          issue_id: issueId,
          agent_name: 'Analysis Agent',
          category: cached.category || issueRecord.category,
          severity: cached.severity || issueRecord.severity,
          confidence: cached.confidence || issueRecord.ai_confidence,
          recommended_department: cached.recommended_department || 'Public Works Department',
          next_agent: 'Assignment Agent',
          already_processed: true,
        };
      }
    } catch (dupErr) {
      console.warn('[analysisAgent] Non-blocking idempotency check notice:', dupErr.message);
    }

    // 3. Check Gemini API key configuration
    if (!config.gemini.apiKey) {
      const configError = 'GEMINI_API_KEY is not configured in backend environment.';
      console.error(`[analysisAgent] ${configError}`);
      await logAgentAction({
        issueId,
        action: 'ISSUE_ANALYSIS_FAILED',
        executionStatus: 'failed',
        input: { has_image: !!issueRecord.image_url },
        errorMessage: configError,
      });
      return {
        success: false,
        issue_id: issueId,
        agent_name: 'Analysis Agent',
        error: configError,
        next_agent: null,
      };
    }

    // 4. Retrieve private image bytes from Supabase storage
    const { base64Data, mimeType } = await retrieveImageBytes(issueRecord.image_url);

    // 5. Run Gemini Vision structured analysis
    const analysisResult = await callGeminiVision({
      base64Data,
      mimeType,
      description: issueRecord.description,
      latitude: issueRecord.latitude,
      longitude: issueRecord.longitude,
      address: issueRecord.address,
    });

    console.log(`[analysisAgent] Gemini analysis succeeded for issue ${issueId}:`, {
      category: analysisResult.category,
      severity: analysisResult.severity,
      confidence: analysisResult.confidence,
    });

    const priorityLevel = derivePriority(analysisResult.severity);
    const timestamp = new Date().toISOString();

    // 6. Update `public.issues` with analysis fields
    const updatePayload = {
      category: analysisResult.category,
      severity: analysisResult.severity,
      priority_level: priorityLevel,
      ai_confidence: analysisResult.confidence,
      ai_summary: analysisResult.concise_reasoning,
      updated_at: timestamp,
    };

    const { error: dbUpdateError } = await supabaseAdmin
      .from('issues')
      .update(updatePayload)
      .eq('id', issueId);

    if (dbUpdateError) {
      console.error(`[analysisAgent] Failed to update issues table for issue ${issueId}:`, dbUpdateError.message);
    } else {
      console.log(`[analysisAgent] Successfully updated public.issues record for issue ${issueId}`);
    }

    // 7. Record audit entry in `public.agent_logs`
    await logAgentAction({
      issueId,
      action: 'ISSUE_ANALYSIS',
      executionStatus: 'success',
      input: {
        has_image: true,
        image_mime_type: mimeType,
        description: issueRecord.description || null,
        latitude: issueRecord.latitude,
        longitude: issueRecord.longitude,
      },
      output: {
        category: analysisResult.category,
        severity: analysisResult.severity,
        priority_level: priorityLevel,
        confidence: analysisResult.confidence,
        concise_reasoning: analysisResult.concise_reasoning,
        recommended_department: analysisResult.recommended_department,
      },
    });

    // 8. Record timeline update in `public.issue_updates`
    const timelineMessage = `Analysis Agent classified this report as ${analysisResult.category.replace(/_/g, ' ')} with ${analysisResult.severity} severity (${Math.round(analysisResult.confidence * 100)}% confidence). ${analysisResult.concise_reasoning}`;

    await logIssueUpdate({
      issueId,
      message: timelineMessage,
      oldStatus: issueRecord.status || 'reported',
      newStatus: issueRecord.status || 'reported',
      metadata: {
        category: analysisResult.category,
        severity: analysisResult.severity,
        priority_level: priorityLevel,
        confidence: analysisResult.confidence,
        recommended_department: analysisResult.recommended_department,
      },
    });

    // 9. Structured handoff to Assignment Agent
    console.log(`[analysisAgent] Completed successfully. Next agent: Assignment Agent.`);
    return {
      success: true,
      issue_id: issueId,
      agent_name: 'Analysis Agent',
      category: analysisResult.category,
      severity: analysisResult.severity,
      confidence: analysisResult.confidence,
      recommended_department: analysisResult.recommended_department,
      next_agent: 'Assignment Agent',
    };
  } catch (err) {
    const errorMsg = err.message || 'Unexpected exception during Analysis Agent execution.';
    console.error(`[analysisAgent] Analysis failed for issue ${issueId}:`, errorMsg);

    // Record failure in agent_logs
    await logAgentAction({
      issueId,
      action: 'ISSUE_ANALYSIS_ERROR',
      executionStatus: 'failed',
      errorMessage: errorMsg,
    });

    return {
      success: false,
      issue_id: issueId,
      agent_name: 'Analysis Agent',
      error: errorMsg,
      next_agent: null,
    };
  }
}
