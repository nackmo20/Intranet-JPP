import { WORKFLOWS } from './constants.js';
import { pruneEmptyOperations } from './operations.js';
import { EDITORIAL_FIELDS, SOFIA_FIELDS, TAXONOMY_FIELDS } from './workflows.js';
export function validateWorkspace(ws) {
  const errors = [], warnings = []; const activePages = ws.pages.filter(p => !ws.removedTargets[p.canonicalId]); const selectedDiffs = ws.diffs.filter(d => d.selected !== false && !ws.removedTargets[d.targetId]);
  if (!activePages.length) warnings.push('Aucune page active dans le modèle canonique.');
  ws.sources.filter(s => s.type === 'unknown').forEach(s => errors.push(`Fichier source non reconnu: ${s.name}`));
  if (ws.currentWorkflow !== WORKFLOWS.create) selectedDiffs.forEach(d => { if (!d.nodeId) errors.push(`Mise à jour sans Node ID: ${d.diffId}`); });
  if (ws.currentWorkflow === WORKFLOWS.create) activePages.forEach(p => { if (!p.drupalTitle && !p.sourceTitle) errors.push(`Création sans titre: ${p.canonicalId}`); if (!p.taxonomies.themes.length) errors.push(`Création sans thématique: ${p.canonicalId}`); if (!p.taxonomies.audiences.length) errors.push(`Création sans public: ${p.canonicalId}`); });
  ws.matches.filter(m => (m.conflicts || []).length && !m.manualValidation).forEach(m => errors.push(`Correspondance ambiguë/non résolue à valider: ${m.nodeId || m.request?.canonicalId || m.requestId || 'source'}`));
  selectedDiffs.forEach(d => { if (!d.field || !d.operation) errors.push(`Opération vide: ${d.diffId}`); if (d.operation === 'delete' && !['__DELETE__','[DELETE]','SUPPRIMER'].includes(String(d.requestedValue))) errors.push(`Suppression non explicite: ${d.diffId}`); });
  const keys = new Set(); selectedDiffs.forEach(d => { const k = `${d.targetId}:${d.field}`; if (keys.has(k)) errors.push(`Doublon/contradiction sur ${k}`); keys.add(k); if (ws.removedTargets[d.targetId]) errors.push(`Page retirée encore présente dans les opérations: ${d.targetId}`); });
  if (ws.currentWorkflow === WORKFLOWS.updateSofia) selectedDiffs.forEach(d => { if (!SOFIA_FIELDS.includes(d.field)) errors.push(`Champ éditorial ou taxonomie provenant par erreur de Sofia-FMO: ${d.field}`); if ((d.warnings || []).some(w => /Plusieurs pages|Plusieurs lieux|non résolue|Aucune page/.test(w))) errors.push(`Groupe/lieu Sofia-FMO non résolu: ${d.diffId}`); });
  if (ws.currentWorkflow === WORKFLOWS.updateContent) selectedDiffs.forEach(d => { if (!EDITORIAL_FIELDS.includes(d.field)) errors.push(`Donnée Sofia-FMO ou taxonomie provenant par erreur du fichier de demandes: ${d.field}`); });
  if (ws.currentWorkflow === WORKFLOWS.updateTaxonomy) { selectedDiffs.forEach(d => { if (!TAXONOMY_FIELDS.includes(d.field)) errors.push(`Le workflow taxonomie tente de modifier un champ interdit: ${d.field}`); if (!d.nodeId) errors.push(`Taxonomie exportée sans Node ID: ${d.diffId}`); if (['replace','clear'].includes(d.operation) && !ws.taxonomySelection?.confirmedDestructive) errors.push(`Opération destructive non confirmée: ${d.diffId}`); }); }
  activePages.forEach(p => { const deps = p.taxonomies.departments || []; if (p.pageScope === 'bi-departmental' && deps.length !== 2) errors.push(`Page bidépartementale sans exactement deux départements: ${p.canonicalId}`); });
  ws.controls = [...errors.map(message => ({ level: 'error', message })), ...warnings.map(message => ({ level: 'warning', message }))]; return { errors, warnings, blocking: errors.length > 0 };
}
export function assertNoEmptyTargets(job) { return job.targets.every(t => pruneEmptyOperations(t.operations).length > 0 || job.workflow === 'create'); }
