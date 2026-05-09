const asyncHandler = require("express-async-handler");
const Registration = require("../models/registration");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("../services/sqliteService");

const getProfile = asyncHandler(async (req, res) => {
  let pendingCount;
  if (isSqliteMode()) {
    pendingCount = sqlite.pendingSubmissionCountSqlite();
  } else {
    pendingCount = await Registration.countDocuments({
      status: { $in: ["ai-review", "governance", "remediation"] },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      pendingCount,
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, title, department, location } = req.body;
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      name: name || req.user.name,
      email: req.user.email,
      role: req.user.role,
      title: title || "",
      department: department || "",
      location: location || "",
    },
  });
});

module.exports = { getProfile, updateProfile };
