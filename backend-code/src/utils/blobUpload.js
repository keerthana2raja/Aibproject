/**
 * Vercel Blob helpers — used by asset and submission upload controllers.
 * Requires BLOB_READ_WRITE_TOKEN in the environment (auto-set on Vercel;
 * copy from your Vercel project's Storage → Blob tab for local dev).
 */
const { put, del } = require("@vercel/blob");

/**
 * Upload a Buffer to Vercel Blob and return the public URL.
 * @param {string} pathname  e.g. "demos/ATL-001-1234567890.mp4"
 * @param {Buffer} buffer
 * @param {string} contentType  MIME type
 * @returns {Promise<string>} public blob URL
 */
async function uploadToBlob(pathname, buffer, contentType) {
  console.log(`[blob] uploading: ${pathname} (${buffer.length} bytes, ${contentType})`);
  const { url } = await put(pathname, buffer, {
    access: "public",
    token: process.env.BLOB_PUBLIC_READ_WRITE_TOKEN,
    contentType: contentType || "application/octet-stream",
  });
  console.log(`[blob] uploaded OK: ${url}`);
  return url;
}

/**
 * Delete a blob by its public URL.
 * Safe to call with a local relative path or empty string — it's a no-op then.
 * @param {string} blobUrl
 */
async function deleteBlob(blobUrl) {
  const s = String(blobUrl || "").trim();
  if (!s || !/^https?:\/\//i.test(s)) return; // local path or empty — skip
  try {
    await del(s);
  } catch (e) {
    console.warn("⚠️  Blob delete failed (non-fatal):", e.message);
  }
}

module.exports = { uploadToBlob, deleteBlob };
