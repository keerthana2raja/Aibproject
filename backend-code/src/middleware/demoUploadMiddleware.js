/**
 * Demo-video upload middleware — uses multer memoryStorage.
 * Files are NOT written to disk here; the controller streams
 * req.file.buffer directly to Vercel Blob via blobUpload.uploadToBlob().
 */
const multer = require("multer");

const allowedMime = new Set(["video/mp4", "video/webm", "video/quicktime"]);

exports.uploadDemoVideoMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 }, // 120 MB
  fileFilter(_req, file, cb) {
    const m = String(file.mimetype || "").toLowerCase();
    if (allowedMime.has(m)) { cb(null, true); return; }
    if (/\.(mp4|webm|mov)$/i.test(file.originalname || "")) { cb(null, true); return; }
    cb(new Error("Allowed formats: MP4, WebM, or MOV."));
  },
}).single("demo");
