const asyncHandler = require("express-async-handler");
const { getActivity, getUsers, recordActivity } = require("../services/activityService");

// POST /activity
const createActivityEntry = asyncHandler(async (req, res) => {
  await recordActivity(req.body || {}, req.user || {});
  res.status(201).json({ success: true, message: "Logged" });
});
const listActivity = asyncHandler(async (req, res) => {
  const activities = await getActivity(req.query.limit);
  res.status(200).json({ success: true, data: activities });
});

// GET /users
const listUsers = asyncHandler(async (req, res) => {
  const users = await getUsers(req.query.role);
  res.status(200).json({ success: true, count: users.length, data: users });
});

module.exports = { listActivity, createActivityEntry, listUsers };
