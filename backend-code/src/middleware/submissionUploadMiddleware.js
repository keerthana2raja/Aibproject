/**
 * Submission upload middleware — uses multer memoryStorage.
 * Files are NOT written to disk here; the controller streams
 * req.file / req.files buffers to Vercel Blob via blobUpload.uploadToBlob().
 */
const multer = require("multer");

const allowedDemoMime = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/** Single demo-video upload (field: "demo") */
exports.uploadSubmissionDemoMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 }, // 120 MB
  fileFilter(_req, file, cb) {
    const m = String(file.mimetype || "").toLowerCase();
    if (allowedDemoMime.has(m) || /\.(mp4|webm|mov)$/i.test(file.originalname || "")) {
      cb(null, true);
      return;
    }
    cb(new Error("Allowed formats: MP4, WebM, or MOV."));
  },
}).single("demo");

/** Multi-file attachment upload (field: "files", up to 15 files × 40 MB each) */
exports.uploadSubmissionFilesMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024, files: 20 },
}).array("files", 15);

const allowedArchMime = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/svg+xml",
  "image/webp", "application/pdf",
]);

/** Single architecture diagram upload (field: "architecture", max 20 MB) */
exports.uploadArchitectureMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const m = String(file.mimetype || "").toLowerCase();
    if (allowedArchMime.has(m) || /\.(png|jpe?g|svg|webp|pdf)$/i.test(file.originalname || "")) {
      cb(null, true);
      return;
    }
    cb(new Error("Allowed formats: PNG, JPG, SVG, WebP, or PDF."));
  },
}).single("architecture");
