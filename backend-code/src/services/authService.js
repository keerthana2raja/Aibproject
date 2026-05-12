const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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
    if (!row) {
      throw { statusCode: 403, message: "Access denied. You are not registered as an authorized user." };
    }
    // Verify password if the user has one set
    if (row.password) {
      const isMatch = await bcrypt.compare(password, row.password);
      if (!isMatch) {
        throw { statusCode: 401, message: "The credentials do not match. Please check your email and password." };
      }
    }
    userPayload = {
      id: email.toLowerCase(),
      email: email.toLowerCase(),
      name: row.name ||
        email
          .split("@")[0]
          .replace(/\./g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      role: row.role || "member",
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

  // Fire-and-forget: don't delay the login response for a DB write
  logActivity({
    actorName: userPayload.name,
    action: "login",
    resourceType: "auth",
    description: email,
  }).catch((e) => console.error("Activity log failed (login):", e.message));

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
