import supabase from '../lib/supabase.js';

/**
 * storageService.js (Frontend)
 *
 * Handles file uploads to Supabase Storage bucket `issue-images`.
 * All storage operations for citizen reports are isolated here.
 */

const BUCKET_NAME = 'issue-images';

/**
 * Upload an issue photo to Supabase Storage.
 *
 * Path structure: issue-images/{authenticated-user-id}/{unique-file-name}
 *
 * @param {File} file - Browser File object
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<{ publicUrl: string, path: string, error: Error | null }>}
 */
export async function uploadIssueImage(file, userId) {
  if (!file) {
    return { publicUrl: null, path: null, error: new Error('No image file provided.') };
  }

  if (!userId) {
    return { publicUrl: null, path: null, error: new Error('User authentication required for upload.') };
  }

  try {
    // Generate clean unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filePath = `${userId}/${uniqueId}_${sanitizedBase}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('[storageService] Upload error:', uploadError.message);
      return { publicUrl: null, path: null, error: uploadError };
    }

    // Retrieve public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      publicUrl: urlData?.publicUrl || '',
      path: uploadData?.path || filePath,
      error: null,
    };
  } catch (err) {
    console.error('[storageService] Unexpected upload failure:', err);
    return { publicUrl: null, path: null, error: err };
  }
}
