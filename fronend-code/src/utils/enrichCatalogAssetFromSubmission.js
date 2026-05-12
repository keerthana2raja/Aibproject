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
 * If catalog GET /v1/assets/:id omits demo, attachments, or architecture payload but a submission has them,
 * call GET /v1/submissions/:candidateId (Bearer via shared axios) and merge.
 */
export async function enrichCatalogAssetFromSubmission(asset) {
  if (!asset || typeof asset !== 'object') return asset;

  const hasDemo = !!pickDemoVideoRelPath(asset);
  const hasAtt = Array.isArray(asset.attachments) && asset.attachments.length > 0;

  const assetArchTrim = typeof asset.architecture === 'string' ? asset.architecture.trim() : '';
  const hasArchUrlOnAsset =
    !!asset.architectureDiagramHref || /^https?:\/\//i.test(assetArchTrim);

  if (hasDemo && hasAtt && hasArchUrlOnAsset) return asset;

  for (const tryId of submissionLookupCandidates(asset)) {
    try {
      const res = await getSubmissionById(tryId);
      const sub = normalizeSubmissionDetail(res?.data?.data);
      if (!sub || typeof sub !== 'object') continue;

      const subDemo = pickDemoVideoRelPath(sub);
      const subAtt = Array.isArray(sub.submissionAttachments) ? sub.submissionAttachments : [];

      const diagramHrefForUi =
        sub.architectureDiagramHref ||
        (/^https?:\/\//i.test(String(sub.architecture ?? '').trim())
          ? String(sub.architecture).trim()
          : '');
      const architectureProseFromSub =
        typeof sub.architecture === 'string' &&
        sub.architecture.trim() &&
        !/^https?:\/\//i.test(sub.architecture.trim())
          ? sub.architecture.trim()
          : '';

      const next = { ...asset };
      let merged = false;

      if (!hasDemo && subDemo) {
        next.demoVideoUrl = subDemo;
        merged = true;
      }
      if (!hasAtt && subAtt.length > 0) {
        next.attachments = subAtt;
        merged = true;
      }
      if (!hasArchUrlOnAsset && diagramHrefForUi) {
        next.architectureDiagramHref = diagramHrefForUi;
        merged = true;
      }
      if (!assetArchTrim && architectureProseFromSub) {
        next.architecture = architectureProseFromSub;
        merged = true;
      }

      if (merged) return next;
    } catch {
      /* try next candidate */
    }
  }
  return asset;
}