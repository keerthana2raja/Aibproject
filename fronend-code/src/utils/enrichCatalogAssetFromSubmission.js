import { getSubmissionById } from '../api/submissions';
import { normalizeSubmissionDetail } from './submissionApiNormalize';
import { pickDemoVideoRelPath } from './demoVideoUrl';

const REG_LINK_KEYS = [
  'registrationId',
  'registration_id',
  'submissionRegistrationId',
  'submission_registration_id',
  'sourceRegistrationId',
  'source_registration_id',
  'pipelineRegistrationId',
  'pipeline_registration_id',
];

/**
 * Ordered IDs to try GET /v1/submissions/:id (registration id and/or catalog id, per backend).
 */
export function submissionLookupCandidates(asset) {
  if (!asset || typeof asset !== 'object') return [];
  const out = [];
  for (const k of REG_LINK_KEYS) {
    const v = asset[k];
    if (v != null && String(v).trim()) out.push(String(v).trim());
  }
  const id = asset.id != null && String(asset.id).trim();
  if (id && /^REG-/i.test(id)) out.push(id);
  if (id) out.push(id);
  return [...new Set(out)];
}

/**
 * If catalog GET /v1/assets/:id omits demo or attachments but a submission has them,
 * call GET /v1/submissions/:candidateId (Bearer token via shared axios client) and merge.
 */
export async function enrichCatalogAssetFromSubmission(asset) {
  if (!asset || typeof asset !== 'object') return asset;
  if (pickDemoVideoRelPath(asset)) return asset;

  for (const tryId of submissionLookupCandidates(asset)) {
    try {
      const res = await getSubmissionById(tryId);
      const sub = normalizeSubmissionDetail(res?.data?.data);
      if (!sub || typeof sub !== 'object') continue;

      const demo = pickDemoVideoRelPath(sub);
      const subAtt = sub.submissionAttachments;
      const hasAtt = Array.isArray(subAtt) && subAtt.length > 0;

      if (!demo && !hasAtt) continue;

      const next = { ...asset };
      if (demo) next.demoVideoUrl = demo;
      if (
        hasAtt &&
        (!Array.isArray(asset.attachments) || asset.attachments.length === 0)
      ) {
        next.attachments = subAtt;
      }
      return next;
    } catch {
      /* try next candidate */
    }
  }
  return asset;
}
