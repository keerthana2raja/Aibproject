const path = require("path");
const fs = require("fs");
const multer = require("multer");

const demosAbsDir = path.join(process.cwd(), "data", "uploads", "demos");

function ensureDemosDir() {
  fs.mkdirSync(demosAbsDir, { recursive: true });
}

const allowedMime = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureDemosDir();
      cb(null, demosAbsDir);
    } catch (e) {
      cb(e);
    }
  },
  filename(req, file, cb) {
    const raw = String(req.params.id || "").toUpperCase();
    const safeId = raw.replace(/[^\w-]/g, "") || "ASSET";
    const extRaw = path.extname(file.originalname || "");
    const safeExt =
      /\.(mp4|webm|mov)$/i.test(extRaw) ? extRaw.toLowerCase() : /\.(mp4|webm|mov)$/i.test(file.originalname || "") ? ".mp4" : ".mp4";
    cb(null, `${safeId}-${Date.now()}${safeExt}`);
  },
});

exports.uploadDemoVideoMulter = multer({
  storage,
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const m = String(file.mimetype || "").toLowerCase();
    if (allowedMime.has(m)) {
      cb(null, true);
      return;
    }
    const name = String(file.originalname || "");
    if (/\.(mp4|webm|mov)$/i.test(name)) {
      cb(null, true);
      return;
    }
    cb(new Error("Allowed formats: MP4, WebM, or MOV."));
  },
}).single("demo");
