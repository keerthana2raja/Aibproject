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

// POST /registrations
const registerAsset = asyncHandler(async (req, res) => {
  const submitter = req.user?.name || "Anonymous";
  const result = await createRegistration(req.body, submitter);
  res.status(201).json({ success: true, data: result });
});

// GET /registrations/:id
const getRegistration = asyncHandler(async (req, res) => {
  const reg = await getRegistrationById(req.params.id);
  res.status(200).json({ success: true, data: reg });
});

// PATCH /registrations/:id
const patchRegistration = asyncHandler(async (req, res) => {
  const updatedBy = req.user?.name || "System";
  const reg = await updateRegistration(req.params.id, req.body, updatedBy);
  res.status(200).json({ success: true, data: reg });
});

// POST /submissions/:id/demo-video — multipart field: demo
const uploadSubmissionDemoVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Attach a demo video using the form field name "demo" (MP4, WebM, or MOV).',
    });
    return;
  }
  const relativePath = `submissions/${req.file.filename}`;
  const reg = await saveSubmissionDemoVideoRelpath(req.params.id, relativePath);
  res.status(200).json({ success: true, data: reg });
});

// POST /submissions/:id/files — multipart fields: files (repeat)
const uploadSubmissionAttachments = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    res.status(400).json({
      success: false,
      message: 'Attach one or more files using the field name "files".',
    });
    return;
  }
  const metas = req.files.map((f) => ({
    name: f.originalname || f.filename,
    relpath: `submissions/${f.filename}`,
    bytes: f.size,
    mimetype: f.mimetype,
  }));
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
