import { SCHEMA_VERSION, STUDIO_VERSION, WORKFLOWS } from './constants.js';
import { nowIso, uid } from './utils.js';
import { pruneEmptyOperations } from './operations.js';
import { workflowOperations } from './workflows.js';
export function buildJob(ws) {
  const jobId = uid('job');
  const activePages = ws.pages.filter(p => !ws.removedTargets[p.canonicalId]);
  const byId = new Map(activePages.map(p => [p.canonicalId, p]));
  const targetIds = new Set(ws.diffs.filter(d => d.selected !== false && !ws.removedTargets[d.targetId]).map(d => d.targetId));
  const pagesForTargets = ws.currentWorkflow === WORKFLOWS.create ? activePages : [...targetIds].map(id => byId.get(id)).filter(Boolean);
  const targets = pagesForTargets.map(page => {
    const diffs = ws.diffs.filter(d => d.selected !== false && d.targetId === page.canonicalId && !ws.removedTargets[d.targetId]);
    const operations = ws.currentWorkflow === WORKFLOWS.create
      ? [{ field: 'page', op: 'add', values: page, provenance: { sourceType: 'STUDIO', confidence: 1, fieldPath: 'page' } }]
      : workflowOperations(diffs, ws.currentWorkflow);
    return { canonicalId: page.canonicalId, intentionOvpId: page.intentionOvpId, exportId: page.exportId, nodeId: page.nodeId, drupalUrl: page.drupalUrl, resolved: Boolean(page.nodeId || ws.currentWorkflow === WORKFLOWS.create), expectedBefore: {}, expectedAfter: {}, operations: pruneEmptyOperations(operations), inventoryUpdate: { nodeId: page.nodeId, drupalUrl: page.drupalUrl, title: page.drupalTitle }, warnings: uniqueWarnings(page, diffs), errors: page.errors };
  }).filter(t => t.operations.length);
  return { schemaVersion: SCHEMA_VERSION, jobId, generatedAt: nowIso(), studioVersion: STUDIO_VERSION, sources: ws.sources.map(s => ({ sourceType: s.role || s.type, name: s.name, fingerprint: s.fingerprint, importedAt: s.importedAt || s.lastModified })), safety: { simulation: true, safeMode: true, confirmClicks: true, autoSave: false, stopOnConflict: true }, workflow: ws.currentWorkflow, targets, reportExpected: { format: ['json', 'xlsx'], includeInventoryUpdate: true } };
}
function uniqueWarnings(page, diffs) { return [...new Set([...(page.warnings || []), ...diffs.flatMap(d => d.warnings || [])])]; }
export function jobFilename(job) { return `eafc-drupal-job-v2-${job.generatedAt.slice(0,10)}-${job.jobId}.json`; }
