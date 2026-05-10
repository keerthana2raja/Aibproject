const path = require("path");
const asyncHandler = require("express-async-handler");
const {
  getRegistrations,
  getDistinctRegistrationStatuses,
  createRegistration,
  getRegistrationById,
  updateRegistration,
  saveSubmissionDemoVideoRelpath,
  appendSubmissionAttachmentsBatch,
} = require("../services/registrationService");
const { uploadToBlob } = require("../utils/blobUpload");

// GET /submissions
const listRegistrations = asyncHandler(async (req, res) => {
  const [registrations, statuses] = await Promise.all([
    getRegistrations(req.query.status),
    getDistinctRegistrationStatuses(),
  ]);
  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations,
    meta: { statuses },
  });
});

// POST /submissions
const registerAsset = asyncHandler(async (req, res) => {
  const submitter = req.user?.name || "Anonymous";
  const result = await createRegistration(req.body, submitter);
  res.status(201).json({ success: true, data: result });
});

// GET /submissions/:id
const getRegistration = asyncHandler(async (req, res) => {
  const reg = await getRegistrationById(req.params.id);
  res.status(200).json({ success: true, data: reg });
});

// PATCH /submissions/:id/status
const patchRegistration = asyncHandler(async (req, res) => {
  const updatedBy = req.user?.name || "System";
  const reg = await updateRegistration(req.params.id, req.body, updatedBy);
  res.status(200).json({ success: true, data: reg });
});

// POST /submissions/:id/demo-video  (multipart field: "demo")
// File buffer is piped straight to Vercel Blob — no disk write.
const uploadSubmissionDemoVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Attach a demo video using the form field name "demo" (MP4, WebM, or MOV).',
    });
    return;
  }

  const regId   = String(req.params.id).toUpperCase().replace(/[^\w-]/g, "").slice(0, 24) || "SUB";
  const extRaw  = path.extname(req.file.originalname || "");
  const ext     = /\.(mp4|webm|mov)$/i.test(extRaw) ? extRaw.toLowerCase() : ".mp4";
  const pathname = `submissions/${regId}-demo-${Date.now()}${ext}`;

  const blobUrl = await uploadToBlob(pathname, req.file.buffer, req.file.mimetype || "video/mp4");

  const reg = await saveSubmissionDemoVideoRelpath(req.params.id, blobUrl);
  res.status(200).json({ success: true, data: reg });
});

// POST /submissions/:id/files  (multipart field: "files", repeatable)
// All file buffers are pushed to Vercel Blob in parallel — no disk write.
const uploadSubmissionAttachments = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    res.status(400).json({
      success: false,
      message: 'Attach one or more files using the field name "files".',
    });
    return;
  }

  const regId = String(req.params.id).toUpperCase().replace(/[^\w-]/g, "").slice(0, 24) || "SUB";
  console.log(`[files] ${req.files.length} file(s) received for ${regId}`);

  const metas = await Promise.all(
    req.files.map(async (f) => {
      const base     = path.basename(f.originalname || "file").replace(/[^\w.\-]+/g, "_");
      const pathname = `submissions/${regId}-doc-${Date.now()}-${base}`;
      try {
        const blobUrl = await uploadToBlob(pathname, f.buffer, f.mimetype || "application/octet-stream");
        return {
          name: f.originalname || base,
          relpath: blobUrl,
          bytes: f.size,
          mimetype: f.mimetype,
        };
      } catch (err) {
        console.error(`[files] UPLOAD FAILED for ${f.originalname}:`, err.message, err.stack);
        throw err;
      }
    })
  );

  const reg = await appendSubmissionAttachmentsBatch(req.params.id, metas);
  res.status(200).json({ success: true, data: reg });
});

module.exports = {
  listRegistrations,
  registerAsset,
  getRegistration,
  patchRegistration,
  uploadSubmissionDemoVideo,
  uploadSubmissionAttachments,
};
