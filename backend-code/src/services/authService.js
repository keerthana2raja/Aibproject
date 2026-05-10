const jwt = require("jsonwebtoken");
const Activity = require("../models/activity");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });

const loginUser = async (email, password) => {
  if (!email.toLowerCase().endsWith("@infovision.com")) {
    throw { statusCode: 403, message: "Only @infovision.com accounts are allowed." };
  }

  let userPayload;
  if (isSqliteMode()) {
    const row = await sqlite.userByEmailSqlite(email.trim());
    userPayload = {
      id: email.toLowerCase(),
      email: email.toLowerCase(),
      name:
        row?.name ||
        email
          .split("@")[0]
          .replace(/\./g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      role: row?.role || "member",
    };
  } else {
    userPayload = {
      id: email.toLowerCase(),
      email: email.toLowerCase(),
      name: email
        .split("@")[0]
        .replace(/\./g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      role: "admin",
    };
  }

  await logActivity({
    actorName: userPayload.name,
    action: "login",
    resourceType: "auth",
    description: email,
    summary: `${email} logged in`,
  });

  return {
    access_token: generateAccessToken(userPayload),
    refresh_token: generateRefreshToken(userPayload),
    user: userPayload,
  };
};

const logActivity = async ({ userId = null, actorName, email = "", action, resourceType = "other", description = null }) => {
  try {
    if (isSqliteMode()) {
      await sqlite.activityLogSqlite({
        userId,
        actorName,
        email,
        action,
        resourceType,
        description,
      });
      return;
    }

    await Activity.create({
      userId,
      name: actorName || "System",
      email,
      action,
      resourceType,
      description,
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};

module.exports = { loginUser, logActivity };
