const Activity = require("../models/activity");
const User = require("../models/user");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");

// GET /activity — swagger response: [{ name, action, description, time }]
const getActivity = async (limit = 10) => {
  if (isSqliteMode())
    return sqlite.recentActivitiesSqlite(limit).map((r) => ({
      name: r.name,
      action: r.action,
      description: r.description,
      createdAt: r.createdAt,
    }));
  return await Activity.find({})
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .select("name action description createdAt");
};

// GET /users — swagger response: [{ id, name, email, role }]
const getUsers = async (role) => {
  if (isSqliteMode()) return sqlite.directoryUsersSqlite(role);
  const query = role ? { role } : {};
  return await User.find(query, "_id name email role");
};

const ALLOWED_ACTIVITY_ACTIONS = new Set(["demo_opened", "access_requested", "viewed"]);

const recordActivity = async (payload = {}, actor = {}) => {
  let action = String(payload.action || "viewed");
  if (!ALLOWED_ACTIVITY_ACTIONS.has(action)) action = "viewed";
  const resourceType =
    payload.resourceType && ["asset", "registration", "family", "other"].includes(payload.resourceType) ?
      payload.resourceType
    : "asset";
  const description = payload.description ? String(payload.description).slice(0, 240) : null;

  if (isSqliteMode()) {
    sqlite.activityLogSqlite({
      actorName: actor.name || actor.email || "User",
      email: actor.email || "",
      action,
      resourceType,
      description,
    });
    return true;
  }
  await Activity.create({
    name: actor.name || actor.email || "User",
    email: actor.email || "",
    action,
    resourceType,
    description,
  });
  return true;
};

module.exports = { getActivity, getUsers, recordActivity };
