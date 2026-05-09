const { logActivity } = require("../services/authService");

// ── Maps HTTP method + route → action ─────────────────
const resolveAction = (method, path) => {
  if (path.includes("/auth/login")) return { action: "login" };
  if (path.includes("/auth/logout")) return { action: "logout" };

  switch (method) {
    case "GET":
      return { action: "viewed" };
    case "POST":
      return { action: "created" };
    case "PATCH":
      return { action: "updated" };
    case "PUT":
      return { action: "updated" };
    case "DELETE":
      return { action: "deleted" };
    default:
      return { action: "viewed" };
  }
};

// ── Maps URL path → resourceType + resourceId ─────────────────
const resolveResource = (path, body) => {
  if (path.includes("/assets/stats")) {
    return {
      resourceType: "dashboard",
      resourceId: null,
      resourceName: "Dashboard stats",
    };
  }
  if (path.includes("/assets/family/")) {
    const key = path.split("/assets/family/")[1]?.split("/")[0];
    return {
      resourceType: "family",
      resourceId: key,
      resourceName: `${key} family`,
    };
  }
  if (path.match(/\/assets\/[A-Z]+-\d+/i)) {
    const id = path.split("/assets/")[1]?.split("/")[0];
    return {
      resourceType: "asset",
      resourceId: id,
      resourceName: body?.name || id,
    };
  }
  if (path.includes("/assets")) {
    return {
      resourceType: "asset",
      resourceId: null,
      resourceName: "Asset catalog",
    };
  }
  if (path.match(/\/registrations\/REG-\d+/i)) {
    const id = path.split("/registrations/")[1]?.split("/")[0];
    return {
      resourceType: "registration",
      resourceId: id,
      resourceName: body?.name || id,
    };
  }
  if (path.includes("/registrations")) {
    return {
      resourceType: "registration",
      resourceId: null,
      resourceName: body?.name || "Registration",
    };
  }
  if (path.includes("/families/")) {
    const key = path.split("/families/")[1]?.split("/")[0];
    return { resourceType: "family", resourceId: key, resourceName: key };
  }
  if (path.includes("/families")) {
    return {
      resourceType: "family",
      resourceId: null,
      resourceName: "All families",
    };
  }
  if (path.includes("/users")) {
    return {
      resourceType: "user",
      resourceId: null,
      resourceName: "Users list",
    };
  }
  return { resourceType: "other", resourceId: null, resourceName: path };
};

// ── Build human-readable "what" string ────────────────────────
const buildWhat = (
  action,
  resourceType,
  resourceId,
  resourceName,
  userName,
) => {
  const target = resourceId ? `${resourceName} (${resourceId})` : resourceName;
  switch (action) {
    case "login":
      return `${userName} logged in`;
    case "logout":
      return `${userName} logged out`;
    case "viewed":
      return `${userName} viewed ${target}`;
    case "created":
      return `${userName} created ${target}`;
    case "updated":
      return `${userName} updated ${target}`;
    case "deleted":
      return `${userName} deleted ${target}`;
    case "submitted":
      return `${userName} submitted ${target}`;
    default:
      return `${userName} performed ${action} on ${target}`;
  }
};

// ── Paths to skip (too noisy / not meaningful) ─────────────────
const SKIP_PATHS = ["/auth/me", "/health", "/activity", "/users"];

// ── The middleware ─────────────────────────────────────────────
const activityLogger = (req, res, next) => {
  const shouldSkip = !req.user || SKIP_PATHS.some((p) => req.path.includes(p));
  if (shouldSkip) return next();

  res.on("finish", async () => {
    try {
      if (res.statusCode >= 400) return; // only log successful actions

      const { action } = resolveAction(req.method, req.path);
      const { resourceType, resourceId, resourceName } = resolveResource(
        req.path,
        req.body,
      );

      const what = buildWhat(
        action,
        resourceType,
        resourceId,
        resourceName,
        req.user.name,
      );

      await logActivity({
        userId: req.user._id,
        employeeId: req.user.employeeId || null,
        actorName: req.user.name,
        email: req.user.email,
        action,
        resourceType,
        resourceName,
        summary,
      });
    } catch (err) {
      console.error("activityLogger error:", err.message);
    }
  });

  next();
};

module.exports = activityLogger;
