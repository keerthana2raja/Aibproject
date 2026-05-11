const express = require("express");
const router = express.Router();
const {
  listRegistrations,
  registerAsset,
  getRegistration,
  patchRegistration,
  uploadSubmissionDemoVideo,
  uploadSubmissionAttachments,
  uploadSubmissionArchitecture,
} = require("../controllers/registrationController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const {
  uploadSubmissionDemoMulter,
  uploadSubmissionFilesMulter,
  uploadArchitectureMulter,
} = require("../middleware/submissionUploadMiddleware");

const runSubmissionDemoUpload = (req, res, next) => {
  uploadSubmissionDemoMulter(req, res, (err) => {
    if (err) {
      const lim = err.code === "LIMIT_FILE_SIZE";
      const e = new Error(lim ? "Demo video must be 120MB or smaller." : err.message);
      e.statusCode = lim ? 413 : 400;
      return next(e);
    }
    next();
  });
};

const runSubmissionFilesUpload = (req, res, next) => {
  uploadSubmissionFilesMulter(req, res, (err) => {
    if (err) {
      const lim = err.code === "LIMIT_FILE_SIZE";
      const e = new Error(lim ? "Each file must be 40MB or smaller." : err.message);
      e.statusCode = lim ? 413 : 400;
      return next(e);
    }
    next();
  });
};

const runArchitectureUpload = (req, res, next) => {
  uploadArchitectureMulter(req, res, (err) => {
    if (err) {
      const lim = err.code === "LIMIT_FILE_SIZE";
      const e = new Error(lim ? "Architecture diagram must be 20MB or smaller." : err.message);
      e.statusCode = lim ? 413 : 400;
      return next(e);
    }
    next();
  });
};

router.get("/", protect, listRegistrations);

router.post("/", protect, validate(["name", "family", "description"]), registerAsset);

router.post("/:id/demo-video", protect, runSubmissionDemoUpload, uploadSubmissionDemoVideo);

router.post("/:id/files", protect, runSubmissionFilesUpload, uploadSubmissionAttachments);

router.post("/:id/architecture", protect, runArchitectureUpload, uploadSubmissionArchitecture);

router.get("/:id", protect, getRegistration);

router.patch("/:id/status", protect, authorize("governance", "admin"), patchRegistration);

module.exports = router;
