/**
 * Storage Abstraction Layer
 *
 * Supports local filesystem (dev/test) and Supabase Storage (production).
 * Choose based on whether Supabase is configured.
 *
 * Usage:
 *   const storage = require('./storage');
 *   const meta = await storage.store(buffer, 'report.pdf', 'application/pdf');
 *   const url = await storage.getUrl(meta.file_path);
 *   await storage.remove(meta.file_path);
 */

const fs = require('fs');
const path = require('path');
const { supabaseAdmin, isSupabaseConfigured } = require('./supabase');

const BUCKET_NAME = 'documents';
const LOCAL_DIR = process.env.VERCEL
  ? '/tmp/uploads/documents'
  : path.join(__dirname, 'uploads', 'documents');

const SUPABASE_PREFIX = 'supabase://';

// ─── Helpers ────────────────────────────────────────────────────

function ensureLocalDir() {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

function isSupabasePath(filePath) {
  return filePath && filePath.startsWith(SUPABASE_PREFIX);
}

function parseSupabasePath(filePath) {
  // supabase://bucket-name/path/to/file
  const rest = filePath.slice(SUPABASE_PREFIX.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) return { bucket: rest, objectPath: '' };
  return {
    bucket: rest.slice(0, slashIdx),
    objectPath: rest.slice(slashIdx + 1),
  };
}

function generateFileName(originalname) {
  const ext = path.extname(originalname);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

// ─── Bucket Lifecycle ───────────────────────────────────────────

/**
 * Ensure the Supabase Storage bucket exists.
 * Call during migration / server startup.
 */
async function ensureBucket() {
  if (!isSupabaseConfigured || !supabaseAdmin) return false;

  // Check if bucket already exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET_NAME)) {
    return true;
  }

  // Create the bucket (private)
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024, // 20 MB
  });

  if (error) {
    console.error(`[Storage] Failed to create bucket "${BUCKET_NAME}":`, error.message);
    return false;
  }

  console.log(`[Storage] Created Supabase bucket "${BUCKET_NAME}"`);
  return true;
}

// ─── Store ──────────────────────────────────────────────────────

/**
 * Store a file (buffer) to either Supabase Storage or local disk.
 *
 * @param {Buffer} buffer  File contents
 * @param {string} originalname  Original file name (for extension)
 * @param {string} mimetype  MIME type
 * @returns {Promise<{file_path, file_name, file_size, mime_type}>}
 */
async function store(buffer, originalname, mimetype) {
  const fileName = generateFileName(originalname);
  const fileSize = buffer.length;

  // Prefer Supabase Storage
  if (isSupabaseConfigured && supabaseAdmin) {
    const objectPath = `${Date.now()}/${fileName}`;
    const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(objectPath, buffer, {
      contentType: mimetype,
      upsert: false,
    });

    if (!error) {
      return {
        file_path: `${SUPABASE_PREFIX}${BUCKET_NAME}/${objectPath}`,
        file_name: originalname,
        file_size: fileSize,
        mime_type: mimetype,
      };
    }

    console.error('[Storage] Supabase upload failed, falling back to disk:', error.message);
  }

  // Fallback: local filesystem
  ensureLocalDir();
  const localPath = path.join(LOCAL_DIR, fileName);
  fs.writeFileSync(localPath, buffer);

  return {
    file_path: path.join('/uploads/documents', fileName),
    file_name: originalname,
    file_size: fileSize,
    mime_type: mimetype,
  };
}

// ─── Get Download URL ───────────────────────────────────────────

/**
 * Get a usable URL for the file.
 * - Supabase: returns a signed URL (60 min expiry)
 * - Local: returns null (caller serves via res.download)
 *
 * @param {string} filePath  The stored file_path value
 * @returns {Promise<string|null>} Download URL or null for local files
 */
async function getUrl(filePath) {
  if (!filePath) return null;

  if (isSupabasePath(filePath)) {
    const { bucket, objectPath } = parseSupabasePath(filePath);
    if (!objectPath) return null;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60); // 60 minutes

    if (error) {
      console.error('[Storage] Failed to create signed URL:', error.message);
      return null;
    }

    return data.signedUrl;
  }

  // Local files — caller reads from disk directly
  return null;
}

/**
 * Get the local filesystem path for a local file (null if Supabase-backed).
 */
function getLocalPath(filePath) {
  if (!filePath || isSupabasePath(filePath)) return null;

  const resolved = path.join(__dirname, filePath);
  const uploadsRoot = path.join(__dirname, 'uploads');
  if (!resolved.startsWith(uploadsRoot + path.sep)) return null;

  return fs.existsSync(resolved) ? resolved : null;
}

// ─── Delete ─────────────────────────────────────────────────────

/**
 * Delete a file from storage.
 *
 * @param {string} filePath  The stored file_path value
 */
async function remove(filePath) {
  if (!filePath) return;

  if (isSupabasePath(filePath)) {
    const { bucket, objectPath } = parseSupabasePath(filePath);
    if (!objectPath) return;

    const { error } = await supabaseAdmin.storage.from(bucket).remove([objectPath]);
    if (error) {
      console.error('[Storage] Failed to delete from Supabase:', error.message);
    }
    return;
  }

  // Local delete
  const resolved = path.join(__dirname, filePath);
  const uploadsRoot = path.join(__dirname, 'uploads');
  if (resolved.startsWith(uploadsRoot + path.sep) && fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
}

module.exports = {
  store,
  getUrl,
  getLocalPath,
  remove,
  ensureBucket,
  isSupabasePath,
  SUPABASE_PREFIX,
  BUCKET_NAME,
};
