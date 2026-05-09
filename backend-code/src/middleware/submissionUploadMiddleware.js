const path = require("path");
const fs = require("fs");
const multer = require("multer");

const submissionsAbsDir = path.join(process.cwd(), "data", "uploads", "submissions");

function ensureSubmissionsDir() {
  fs.mkdirSync(submissionsAbsDir, { recursive: true });
}

function safeRegId(req) {
  return String(req.params.id || "")
    .toUpperCase()
    .replace(/[^\w-]/g, "")
    .slice(0, 24) || "SUB";
}

const allowedDemoMime = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const demoStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureSubmissionsDir();
      cb(null, submissionsAbsDir);
    } catch (e) {
      cb(e);
    }
  },
  filename(req, file, cb) {
    const extRaw = path.extname(file.originalname || "");
    const safe = /\.(mp4|webm|mov)$/i.test(extRaw) ? extRaw.toLowerCase() : ".mp4";
    cb(null, `${safeRegId(req)}-demo-${Date.now()}${safe}`);
  },
});

exports.uploadSubmissionDemoMulter = multer({
  storage: demoStorage,
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const m = String(file.mimetype || "").toLowerCase();
    if (allowedDemoMime.has(m) || /\.(mp4|webm|mov)$/i.test(file.originalname || "")) {
      cb(null, true);
      return;
    }
    cb(new Error("Allowed formats: MP4, WebM, or MOV."));
  },
}).single("demo");

const filesStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureSubmissionsDir();
      cb(null, submissionsAbsDir);
    } catch (e) {
      cb(e);
    }
  },
  filename(req, file, cb) {
    const base = path.basename(file.originalname || "file").replace(/[^\w.\-]+/g, "_");
    cb(null, `${safeRegId(req)}-doc-${Date.now()}-${base}`);
  },
});

exports.uploadSubmissionFilesMulter = multer({
  storage: filesStorage,
  limits: { fileSize: 40 * 1024 * 1024, files: 20 },
}).array("files", 15);
