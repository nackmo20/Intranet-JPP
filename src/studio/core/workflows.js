import { WORKFLOWS } from './constants.js';
import { makePage } from './model.js';
import { normalizeText, normalizeTitle, splitTags, unique } from './utils.js';
import { makeDiff, makeTaxonomyDiff, diffToOperation, pruneEmptyOperations } from './operations.js';

export const EDITORIAL_FIELDS = ['drupalTitle','objective','body','accessibility','setup','headcount','totalDuration','inPersonDuration','remoteDuration','editorialPublic','prerequisites','contact'];
export const SOFIA_FIELDS = ['dates','times','locations','modalities','preRegistrationUrl','publicationStart','publicationEnd','capacity','registered','remainingSeats'];
export const TAXONOMY_FIELDS = ['themes','audiences'];

export const WORKFLOW_SOURCE_SLOTS = {
  [WORKFLOWS.create]: [{ slot: 'ovp', label: 'JSON OVP', accepts: ['json_ovp','json_ovp_batch'] }],
  [WORKFLOWS.updateSofia]: [{ slot: 'inventory', label: 'Recensement Drupal', accepts: ['recensement_excel'] }, { slot: 'sofia', label: 'Export Sofia-FMO plan et sessions', accepts: ['plan_sessions_sofia'] }],
  [WORKFLOWS.updateContent]: [{ slot: 'inventory', label: 'Recensement Drupal', accepts: ['recensement_excel'] }, { slot: 'editorial', label: 'Excel des demandes éditoriales', accepts: ['demande_modification_excel'] }],
  [WORKFLOWS.updateTaxonomy]: [{ slot: 'inventory', label: 'Recensement Drupal', accepts: ['recensement_excel'] }]
};

export function pageFromOvpCourse(course = {}, source = {}) {
  const meta = course.meta || {};
  return makePage({
    intentionOvpId: course.id || course.identifiant || '',
    exportId: course.exportId || course.ficheFormation || '',
    sourceOvp: source.name || '',
    title: course.title || course.titre || '',
    themes: splitTags(course.thematique || meta.thematique),
    audiences: splitTags(meta.publicConcerne || course.publicConcerne || course.publics),
    objective: meta.objectif || course.objectif || '',
    body: meta.contenu || course.contenu || '',
    prerequisites: meta.prerequis || course.prerequis || '',
    accessibility: meta.accessibilite || course.accessibilite || '',
    setup: meta.miseEnPlace || course.miseEnPlace || '',
    contact: meta.contact || course.contact || '',
    editorialPublic: meta.publicConcerne || '',
    headcount: course.effectif || '',
    totalDuration: course.dureeTotale || '',
    inPersonDuration: course.presentiel || '',
    remoteDuration: course.distanciel || '',
    sessions: buildOvpSessions(course),
    provenance: { ovp: { source: source.name || 'OVP', courseId: course.id || '' } }
  });
}

function buildOvpSessions(course) {
  const sessions = [];
  for (const item of course.sessionsPresentiel || []) sessions.push({ modality: 'presentiel', dates: splitTags(item.date || item.dates || item), lieux: splitTags(item.lieu || item.lieux) });
  for (const item of course.sessionsDistanciel || []) sessions.push({ modality: 'distanciel', dates: splitTags(item.date || item.dates || item), lieux: splitTags(item.lieu || item.lieux) });
  if (course.meta?.datesLieux) sessions.push({ modality: '', dates: splitTags(course.meta.datesLieux), lieux: [] });
  return sessions;
}

export function pagesFromOvpJson(obj, source = {}) {
  const courses = obj?.plan?.courses || obj?.courses || obj?.items || obj?.parcours || [];
  return courses.filter(c => normalizeText(c.typeCandidature) !== 'individuelle').map(c => pageFromOvpCourse(c, source));
}

export function normalizeInventoryRows(rows = []) { return rows.map((row, index) => makePage({ ...row, canonicalId: row.canonicalId, title: row.drupalTitle || row.sourceTitle || row.title, nodeId: row.nodeId, drupalUrl: row.drupalUrl, excelOrigin: row.excelOrigin || { sheetName: row.sheetName || 'Recensement', rowNumber: row.rowNumber || index + 2 } })); }

export function normalizeSofiaRow(row = {}) {
  const max = numberValue(pick(row, ['Préinscriptions : Préinscrits : nombre maximal','nombre maximal','capacite','capacity']));
  const registered = numberValue(pick(row, ['Préinscriptions : Préinscrits : nombre total','nombre total','inscrits','registered']));
  const remaining = Number.isFinite(max) && Number.isFinite(registered) ? max - registered : '';
  return {
    dispositifCode: pick(row, ['Dispositif : code','Code dispositif','dispositifCode']), dispositifLabel: pick(row, ['Dispositif : libellé','Dispositif : libelle']),
    moduleCode: pick(row, ['Module : code','Code module','moduleCode']), moduleLabel: pick(row, ['Module : libellé','Module : libelle']),
    groupCode: pick(row, ['Groupe : identifiant','Groupe','groupCode']), groupLabel: pick(row, ['Groupe : libellé','Groupe : libelle']), session: pick(row, ['Session']),
    start: pick(row, ['Début','Debut','Date début']), end: pick(row, ['Fin','Date fin']), duration: pick(row, ['Durée','Duree']), modality: pick(row, ['Modalité','Modalite']),
    uai: pick(row, ['UAI','RNE']), location: pick(row, ['Lieu','Lieux']), publicationStart: pick(row, ['Préinscriptions : Publication : début','Publication début']), publicationEnd: pick(row, ['Préinscriptions : Publication : fin','Publication fin']),
    preRegistrationUrl: pick(row, ['Préinscriptions : Publication : lien préinscription','Lien de préinscription','Préinscription']), capacity: max, registered, remainingSeats: remaining, status: pick(row, ['Dernier statut']), statusLabel: pick(row, ['Libellé statut','Libelle statut']), warnings: Number.isFinite(remaining) && remaining < 0 ? ['Places restantes négatives : vérifier Sofia-FMO.'] : []
  };
}

export function buildSofiaWorkflow(inventoryPages, sofiaRows) {
  const normalizedRows = sofiaRows.map(normalizeSofiaRow);
  const matches = normalizedRows.map(row => matchSofia(row, inventoryPages));
  const diffs = matches.flatMap(match => match.target ? sofiaDiffs(match.target, match.row, match) : []);
  return { rows: normalizedRows, matches, diffs };
}

function matchSofia(row, inventoryPages) {
  const candidates = inventoryPages.map(page => scoreSofia(row, page)).filter(c => c.score > 0).sort((a,b) => b.score - a.score);
  const best = candidates[0];
  const conflicts = [];
  if (!best) conflicts.push('Aucune page Drupal recensée ne correspond aux clés Sofia-FMO.');
  if (best && candidates[1] && candidates[1].score >= best.score - 0.05) conflicts.push('Plusieurs pages possibles : sélection manuelle requise.');
  return { row, target: best?.page || null, nodeId: best?.page?.nodeId || '', score: best?.score || 0, method: best?.method || 'unresolved', reasons: best?.reasons || [], conflicts, alternatives: candidates.slice(1,4).map(c => ({ nodeId: c.page.nodeId, title: c.page.drupalTitle, score: c.score })) };
}
function scoreSofia(row, page) {
  const reasons = []; let score = 0, method = 'none';
  const checks = [ ['dispositifCode', row.dispositifCode, page.trainingCodes.dispositifCode, .35], ['moduleCode', row.moduleCode, page.trainingCodes.moduleCodes?.[0], .25], ['groupCode', row.groupCode, page.trainingCodes.groups?.[0], .2], ['uai', row.uai, page.trainingCodes.rne?.[0] || page.trainingCodes.uai?.[0], .12], ['department', inferDept(row.uai) || inferDept(row.location), page.taxonomies.departments?.[0], .05], ['normalizedTitle', row.moduleLabel || row.dispositifLabel, page.drupalTitle || page.sourceTitle, .03] ];
  for (const [key, a, b, pts] of checks) { if (!a || !b) continue; const ok = key === 'normalizedTitle' ? normalizeTitle(a) === normalizeTitle(b) : normalizeText(a) === normalizeText(b); if (ok) { score += pts; method = method === 'none' ? key : `${method}+${key}`; reasons.push(`Égalité ${key}`); } }
  return { page, score: Math.round(score * 100) / 100, method, reasons };
}
function sofiaDiffs(page, row, match) {
  const values = { dates: [row.start, row.end].filter(Boolean).join(' → '), times: row.duration, locations: row.location, modalities: row.modality, preRegistrationUrl: row.preRegistrationUrl, publicationStart: row.publicationStart, publicationEnd: row.publicationEnd, capacity: row.capacity, registered: row.registered, remainingSeats: row.remainingSeats };
  return Object.entries(values).filter(([,v]) => v !== '' && v !== undefined && v !== null).map(([field, requestedValue]) => ({ diffId: `${page.canonicalId}:${field}:sofia`, selected: true, field, currentValue: currentSofiaValue(page, field), requestedValue, futureValue: requestedValue, operation: 'replace', source: 'SOFIA_FMO', confidence: match.score, targetId: page.canonicalId, nodeId: page.nodeId, reason: match.reasons.join('; '), warnings: [...(row.warnings || []), ...(match.conflicts || [])] }));
}
function currentSofiaValue(page, field) { const s = page.sessions?.[0] || {}; return { dates: (s.dates || []).join('; '), locations: (s.lieux || []).join('; '), modalities: s.modality || s.modalities, preRegistrationUrl: s.preRegistrationUrl, capacity: s.capacity, registered: s.registered, remainingSeats: s.remainingSeats }[field] || ''; }

export function buildEditorialWorkflow(inventoryPages, requestPages) {
  const matches = requestPages.map(req => matchEditorial(req, inventoryPages));
  const diffs = matches.flatMap(match => match.target ? editorialDiffs(match.request, match.target, match) : []);
  return { matches, diffs };
}
function matchEditorial(request, inventoryPages) {
  const candidates = inventoryPages.map(page => scoreEditorial(request, page)).filter(c => c.score > 0).sort((a,b) => b.score - a.score);
  const best = candidates[0]; const conflicts = [];
  if (!best) conflicts.push('Aucune page du recensement ne correspond à la demande.');
  if (best && candidates[1] && candidates[1].score >= best.score - .05) conflicts.push('Correspondance éditoriale ambiguë.');
  return { request, target: best?.page || null, nodeId: best?.page?.nodeId || '', score: best?.score || 0, method: best?.method || 'unresolved', reasons: best?.reasons || [], conflicts };
}
function scoreEditorial(req, page) {
  const checks = [ ['nodeId', req.nodeId, page.nodeId, 1], ['intentionOvpId', req.intentionOvpId, page.intentionOvpId, .85], ['exportId', req.exportId, page.exportId, .75], ['dispositifCode', req.trainingCodes?.dispositifCode, page.trainingCodes?.dispositifCode, .6], ['normalizedTitle', req.drupalTitle || req.sourceTitle, page.drupalTitle || page.sourceTitle, .4] ];
  let best = { page, score: 0, method: 'none', reasons: [] };
  for (const [key,a,b,score] of checks) if (a && b && (key === 'normalizedTitle' ? normalizeTitle(a) === normalizeTitle(b) : normalizeText(a) === normalizeText(b))) best = { page, score, method: key, reasons: [`Égalité ${key}`] };
  return best;
}
function editorialDiffs(request, target, match) {
  return EDITORIAL_FIELDS.map(field => makeDiff({ field, currentValue: pageField(target, field), requestedValue: pageField(request, field), source: 'DEMANDE_EDITORIALE', target, confidence: match.score, reason: match.reasons.join('; ') })).filter(Boolean).filter(d => String(d.currentValue) !== String(d.futureValue)).map(d => ({ ...d, nodeId: target.nodeId, warnings: [...d.warnings, ...match.conflicts] }));
}
function pageField(page, field) { if (field === 'drupalTitle') return page.drupalTitle || page.sourceTitle || ''; return page.content?.[field] || ''; }

export function buildTaxonomyWorkflow(inventoryPages, selection) {
  const selected = new Set(selection.nodeIds || []);
  const pages = inventoryPages.filter(p => selected.has(String(p.nodeId)));
  return pages.flatMap(page => [
    makeTaxonomyDiff({ field: 'themes', currentValues: page.taxonomies.themes, requestedValues: selection.themes || [], operation: selection.themeOperation || 'add', target: page, source: 'MANUAL_TAXONOMY' }),
    makeTaxonomyDiff({ field: 'audiences', currentValues: page.taxonomies.audiences, requestedValues: normalizeAudienceValues(selection.audiences || []), operation: selection.audienceOperation || 'add', target: page, source: 'MANUAL_TAXONOMY' })
  ].filter(Boolean).map(d => ({ ...d, nodeId: page.nodeId })));
}
export function normalizeAudienceValues(values) { return unique(values.map(v => typeof v === 'string' ? v : [v.category, v.label].filter(Boolean).join(' > '))); }

export function workflowOperations(diffs, workflow) {
  const allowed = workflow === WORKFLOWS.updateSofia ? SOFIA_FIELDS : workflow === WORKFLOWS.updateContent ? EDITORIAL_FIELDS : workflow === WORKFLOWS.updateTaxonomy ? TAXONOMY_FIELDS : ['page'];
  return pruneEmptyOperations(diffs.filter(d => d.selected !== false && allowed.includes(d.field)).map(diffToOperation));
}
function pick(row, names) { const keys = Object.keys(row || {}); const found = keys.find(k => names.some(n => normalizeText(k) === normalizeText(n))); return found ? row[found] : ''; }
function numberValue(v) { if (v === '' || v === null || v === undefined) return ''; const n = Number(String(v).replace(',', '.').replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : ''; }
function inferDept(text = '') { const m = String(text).match(/\b(16|17|79|86)\b/); return m?.[1] || ''; }
