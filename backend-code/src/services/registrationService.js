const Registration = require("../models/registration");
const { isSqliteMode } = require("../config/sqlite");
const { demoVideoUrlFromRelpath } = require("../utils/demoVideoUrl");
const sqlite = require("./sqliteService");
const { logActivity } = require("./authService");

const toFindingObjects = (findings) => {
  if (!Array.isArray(findings)) return [];
  if (findings.length > 0 && typeof findings[0] === "object" && findings[0] !== null) return findings;
  return findings.map((detail) => ({
    category: "General",
    status: "pass",
    detail: String(detail),
  }));
};

const getDistinctRegistrationStatuses = async () => {
  if (isSqliteMode()) return sqlite.registrationDistinctStatusesSqlite();
  const vals = await Registration.distinct("status");
  return [...vals].filter(Boolean).sort();
};

const getRegistrations = async (status) => {
  if (isSqliteMode()) return sqlite.registrationsListSqlite(status);
  const query = status ? { status } : {};
  const rows = await Registration.find(query).sort({ date: -1 }).lean();
  return rows.map((reg) => {
    const rel = String(reg.demoVideoRelpath || "").trim();
    return {
      ...reg,
      demoVideoUrl: demoVideoUrlFromRelpath(rel || undefined),
      submissionAttachments: reg.submissionAttachments || [],
      promotedAssetId: reg.promotedAssetId || undefined,
    };
  });
};

const simulateAIReview = async (docId) => {
  if (isSqliteMode()) return;
  setTimeout(async () => {
    try {
      const score = Math.floor(Math.random() * 30) + 70;
      const findings =
        score >= 85
          ? [
              { category: "Security", status: "pass", detail: "No obvious security flags found" },
              { category: "Docs", status: "pass", detail: "Documentation looks complete" },
              { category: "Cloud", status: "pass", detail: "Cloud targets defined" },
            ]
          : [
              { category: "Docs", status: "warn", detail: "Missing prerequisites section" },
              { category: "Architecture", status: "warn", detail: "Architecture diagram recommended" },
            ];

      await Registration.findByIdAndUpdate(docId, {
        aiScore: score,
        aiFindings: toFindingObjects(findings),
        status: score >= 85 ? "governance" : "remediation",
        $push: {
          statusHistory: {
            status: score >= 85 ? "governance" : "remediation",
            changedBy: "AI Engine",
            note: `AI score: ${score}/100`,
            timestamp: new Date(),
          },
        },
      });
    } catch (e) {
      console.error("AI review simulation error:", e.message);
    }
  }, 3000);
};

const createRegistration = async (data, submitter) => {
  if (isSqliteMode()) {
    const registrationId = sqlite.nextRegistrationIdSqlite();
    const result = sqlite.registrationCreateSqlite({
      registrationId,
      name: data.name,
      family: data.family,
      description: data.description,
      submitedBy: submitter || "System",
      // extended fields
      owner: data.owner || submitter || "",
      team: data.team || "",
      coContributors: data.coContributors || "",
      version: data.version || "",
      cloud: data.cloud || "",
      maturity: data.maturity || "experimental",
      gitUrl: data.gitUrl || "",
      architecture: data.architecture || "",
      prerequisites: data.prerequisites || "",
      tags: data.tags || "",
      quickStart: data.quickStart || "",
    });
    await logActivity({
      actorName: submitter || "System",
      action: "submitted",
      resourceType: "registration",
      description: data.name,
      summary: `${submitter || "System"} submitted "${data.name}" for registration`,
    });
    return result;
  }

  const registration = await Registration.create({
    name: data.name,
    family: data.family,
    description: data.description,
    submitedBy: submitter || "System",
    quickStart: data.quickStart || "",
    date: new Date(),
    status: "ai-review",
    statusHistory: [
      {
        status: "ai-review",
        changedBy: submitter || "System",
        note: "Submitted for AI review",
      },
    ],
  });

  await logActivity({
    actorName: submitter || "System",
    action: "submitted",
    resourceType: "registration",
    description: registration.name,
    summary: `${submitter || "System"} submitted "${registration.name}" for registration`,
  });

  simulateAIReview(registration._id);

  return {
    id: registration.registrationId,
    status: registration.status,
  };
};

const getRegistrationById = async (id) => {
  if (isSqliteMode()) return sqlite.registrationByIdSqlite(id);
  const reg = await Registration.findOne({ registrationId: id.toUpperCase() }).lean();
  if (!reg) throw { statusCode: 404, message: `Registration '${id}' not found` };
  const rel = String(reg.demoVideoRelpath || "").trim();
  return {
    ...reg,
    demoVideoUrl: demoVideoUrlFromRelpath(rel || undefined),
    submissionAttachments: reg.submissionAttachments || [],
    promotedAssetId: reg.promotedAssetId || undefined,
  };
};

const saveSubmissionDemoVideoRelpath = async (registrationId, relpath) => {
  if (isSqliteMode()) return sqlite.registrationSetDemoVideoSqlite(registrationId, relpath);
  const uid = String(registrationId).toUpperCase();
  const reg = await Registration.findOne({ registrationId: uid });
  if (!reg) throw { statusCode: 404, message: `Registration '${registrationId}' not found` };
  reg.demoVideoRelpath = relpath;
  await reg.save();
  return getRegistrationById(uid);
};

const appendSubmissionAttachmentsBatch = async (registrationId, metas) => {
  if (isSqliteMode()) return sqlite.registrationAppendAttachmentsSqlite(registrationId, metas);
  const uid = String(registrationId).toUpperCase();
  const reg = await Registration.findOne({ registrationId: uid });
  if (!reg) throw { statusCode: 404, message: `Registration '${registrationId}' not found` };
  reg.submissionAttachments = [...(reg.submissionAttachments || []), ...metas];
  await reg.save();
  return getRegistrationById(uid);
};

const updateRegistration = async (id, updates, updatedBy) => {
  if (isSqliteMode()) {
    const reg = sqlite.registrationUpdateSqlite(id, updates, updatedBy);
    await logActivity({
      actorName: updatedBy || "System",
      action: "updated",
      resourceType: "registration",
      description: reg.registrationId,
      summary: `${updatedBy || "System"} updated registration ${reg.registrationId} → status: ${reg.status}`,
    });
    return reg;
  }

  const reg = await Registration.findOne({ registrationId: id.toUpperCase() });
  if (!reg) throw { statusCode: 404, message: `Registration '${id}' not found` };

  const allowed = ["status", "aiScore", "aiFindings", "govReviewer", "govNotes"];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) {
      if (field === "aiFindings") reg[field] = toFindingObjects(updates[field]);
      else reg[field] = updates[field];
    }
  });

  if (updates.status) {
    reg.statusHistory.push({
      status: updates.status,
      timestamp: new Date(),
      changedBy: updatedBy || "System",
      note: updates.govNotes || "",
    });
  }

  await reg.save();

  await logActivity({
    actorName: updatedBy || "System",
    action: "updated",
    resourceType: "registration",
    description: reg.registrationId,
    summary: `${updatedBy || "System"} updated registration ${reg.registrationId} → status: ${reg.status}`,
  });

  return reg;
};

module.exports = {
  getRegistrations,
  getDistinctRegistrationStatuses,
  createRegistration,
  getRegistrationById,
  updateRegistration,
  saveSubmissionDemoVideoRelpath,
  appendSubmissionAttachmentsBatch,
};
