import { FIELD_ALIASES, SOURCE_TYPES } from '../core/constants.js';
import { makePage } from '../core/model.js';
import { normalizeColumnName, parseJsonPossiblyFenced, sha256Hex, splitTags } from '../core/utils.js';
import { pagesFromOvpJson } from '../core/workflows.js';
export async function inspectFile(file, forcedType = '') {
  const fingerprint = await sha256Hex(file);
  const binarySupport = getBinarySupport(file.name);
  if (!forcedType && binarySupport === 'unsupported') {
    return skippedBinarySource(file, fingerprint, `Fichier binaire non pris en charge (${extensionOf(file.name) || 'extension inconnue'}) : ignoré sans bloquer l'extraction.`);
  }
  let text = '';
  try {
    if (shouldReadAsText(file.name, file.type, forcedType)) text = await file.text();
  } catch (err) {
    if (!forcedType) return skippedBinarySource(file, fingerprint, `Lecture impossible : ${err.message}. Fichier ignoré sans bloquer l'extraction.`);
    text = '';
  }
  const detectedType = forcedType || detectType(file, text);
  const parsed = await parseByType(file, text, detectedType);
  return { sourceId: fingerprint.slice(0, 16), type: detectedType, name: file.name, lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : '', size: file.size, rows: parsed.rows?.length || parsed.pages?.length || 0, sheets: parsed.workbook?.sheets?.length || 0, status: parsed.errors?.length ? 'warning' : 'ok', warnings: parsed.warnings || [], errors: parsed.errors || [], fingerprint, parsed };
}
function shouldReadAsText(name, mime = '', forcedType = '') { return Boolean(forcedType) || /\.(json|csv|txt|html?|xls|xlsx)$/i.test(name) || mime.includes('json') || mime.includes('text'); }
function extensionOf(name = '') { return (String(name).match(/\.([^.]+)$/)?.[1] || '').toLowerCase(); }
function getBinarySupport(name = '') { const ext = extensionOf(name); if (!ext) return 'unknown'; if (['json','csv','txt','html','htm','xls','xlsx'].includes(ext)) return 'supported'; if (['pdf','doc','docx','odt','ods','png','jpg','jpeg','gif','webp','zip','7z','rar','ppt','pptx'].includes(ext)) return 'unsupported'; return 'unknown'; }
function skippedBinarySource(file, fingerprint, message) { return { sourceId: fingerprint.slice(0, 16), type: 'unsupported_binary', name: file.name, lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : '', size: file.size, rows: 0, sheets: 0, status: 'skipped', warnings: [message], errors: [], fingerprint, parsed: { rows: [], pages: [], warnings: [message], skipped: true } }; }
export function detectType(file, text = '') {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.studio.json')) return 'studio_workspace';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return lower.includes('recensement') || lower.includes('suivi') ? 'recensement_excel' : 'demande_modification_excel';
  if (lower.endsWith('.csv')) return lower.includes('rana') ? 'bi_rana' : lower.includes('session') || lower.includes('sofia') ? 'plan_sessions_sofia' : 'demande_modification_excel';
  try { const obj = parseJsonPossiblyFenced(text); if (obj.type === 'create_pages') return 'legacy_create_pages'; if (obj.type === 'update_drupal_pages') return 'legacy_update_payload'; if (obj.type === 'bulk_drupal_theme_public_update') return 'legacy_taxonomy_payload'; if (obj.type === 'drupal_sofia_mapping' || obj.mappingVersion) return 'legacy_mapping_drupal_sofia'; if (obj.schemaVersion === '2.0.0' && obj.workspaceId) return 'studio_workspace'; if (obj.schemaVersion === '2.0.0' && obj.jobId) return 'legacy_update_payload'; if (obj.reportId || obj.items?.some?.(x => x.nodeId && x.status)) return 'update_report'; if (obj.plan?.courses || Array.isArray(obj) || obj.parcours || obj.intentions || obj.items) return 'json_ovp'; } catch {}
  if (/\bovp\b|intentions?|parcours/i.test(text.slice(0, 1000))) return 'json_ovp';
  return 'unknown';
}
async function parseByType(file, text, type) {
  try {
    if (type.includes('json') || type.startsWith('legacy') || type.endsWith('report') || type === 'studio_workspace') return parseJsonSource(text, type);
    if (/\.csv$/i.test(file.name)) return parseTabular(text, type, ';');
    if (/\.html?$|\.xls$/i.test(file.name)) return parseHtmlTable(text, type);
    if (/\.xlsx$/i.test(file.name)) return parseXlsxDiagnostic(file, type);
    return { rows: [], pages: [], warnings: ['Type non reconnu : correction manuelle possible.'] };
  } catch (err) { return { rows: [], pages: [], errors: [err.message] }; }
}
function parseJsonSource(text, type) {
  const obj = parseJsonPossiblyFenced(text);
  if (type === 'studio_workspace') return { workspace: obj, pages: obj.pages || [] };
  if (type === 'legacy_create_pages') return { raw: obj, pages: (obj.items || []).map(item => makePage({ title: item.title, sourceTitle: item.title, exportId: item.ficheFormation || item.exportId, themes: [item.theme, ...(item.thematics || [])], audiences: item.publics, departments: item.departmentCodes, accessibility: item.accessibility, body: item.html || item.content, provenance: { legacy: { source: 'create_pages' } } })) };
  if (type === 'legacy_update_payload' || type === 'legacy_taxonomy_payload') return { raw: obj, rows: obj.targets || obj.items || [], pages: (obj.targets || []).map(t => makePage({ nodeId: t.nodeId, drupalUrl: t.pageUrl || t.drupalUrl, title: t.title, themes: t.expectedBefore?.theme, audiences: t.expectedBefore?.metiersPublics })) };
  if (type === 'legacy_mapping_drupal_sofia') return { raw: obj, rows: obj.items || obj.mappings || [], pages: (obj.items || obj.mappings || []).map(i => makePage({ nodeId: i.nodeId, title: i.title, dispositifCode: i.dispositifCode, moduleCode: i.moduleCode, groupCode: i.groupCode, sourceOvp: i.sourceOvp })) };
  if (type === 'update_report' || type === 'creation_report') return { raw: obj, rows: obj.items || [], pages: (obj.items || []).map(i => makePage({ nodeId: i.nodeId, drupalUrl: i.drupalUrl || i.pageUrl, status: i.status, title: i.title })) };
  if (type === 'json_ovp') return { raw: obj, pages: pagesFromOvpJson(obj, { name: 'JSON OVP' }) };
  const items = Array.isArray(obj) ? obj : obj.items || obj.parcours || obj.intentions || [];
  return { raw: obj, pages: items.map((item, index) => makePage({ intentionOvpId: item.id || item.intentionId || item.identifiant || String(index + 1), exportId: item.exportId || item.ficheFormation, sourceOvp: item.source || item.sourceOvp || '', title: item.title || item.titre || item.libelle, themes: splitTags(item.theme || item.thematique), audiences: splitTags(item.publics || item.metiers), body: item.contenu || item.description || item.html, objective: item.objectif, departments: splitTags(item.department || item.departement || item.departments) })) };
}
export function parseTabular(text, type, delimiter = ';') {
  const lines = text.split(/\r?\n/).filter(Boolean); const headers = splitCsvLine(lines[0] || '', delimiter); const rows = lines.slice(1).map((line, idx) => Object.fromEntries(splitCsvLine(line, delimiter).map((v, i) => [headers[i] || `Colonne ${i + 1}`, v])));
  return { rows, pages: rows.map((r, i) => rowToPage(r, { sheetName: 'CSV', rowNumber: i + 2 })), diagnostics: diagnoseColumns(headers) };
}
function splitCsvLine(line, delimiter) { const out = []; let cell = '', q = false; for (let i = 0; i < line.length; i += 1) { const ch = line[i]; if (ch === '"' && line[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') q = !q; else if (ch === delimiter && !q) { out.push(cell); cell = ''; } else cell += ch; } out.push(cell); return out.map(x => x.trim()); }
function parseHtmlTable(text) { const table = [...text.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(row => [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())); const headers = table[0] || []; const rows = table.slice(1).map(r => Object.fromEntries(r.map((v, i) => [headers[i] || `Colonne ${i + 1}`, v]))); return { rows, pages: rows.map((r, i) => rowToPage(r, { sheetName: 'HTML', rowNumber: i + 2 })), diagnostics: diagnoseColumns(headers) }; }
async function parseXlsxDiagnostic(file, type) { return { workbook: { sheets: [{ name: 'Classeur XLSX', index: 1, rows: [], merges: [], headers: [], formulasPreserved: true, formatsPreserved: 'partiel' }] }, rows: [], pages: [], warnings: ['Lecture XLSX structurelle préparée : le parseur complet sera activé avec les fixtures du classeur réel absent du dépôt. Le fichier original ne sera jamais modifié.'], diagnostics: { recognized: [], unknown: [], note: 'Conservation ordre/onglets/en-têtes multi-lignes/cellules fusionnées prévue par adaptateur xlsx.' } }; }
function getValue(row, key) { const aliases = FIELD_ALIASES[key] || [key]; const found = Object.keys(row).find(k => aliases.some(a => normalizeColumnName(k) === normalizeColumnName(a))); return found ? row[found] : ''; }
function rowToPage(row, origin) { return makePage({ nodeId: getValue(row, 'nodeId'), drupalUrl: getValue(row, 'drupalUrl'), intentionOvpId: getValue(row, 'intentionOvpId'), exportId: getValue(row, 'exportId'), title: getValue(row, 'title'), dispositifCode: getValue(row, 'dispositifCode'), moduleCode: getValue(row, 'moduleCode'), groupCode: getValue(row, 'groupCode'), rne: getValue(row, 'rne'), departments: splitTags(getValue(row, 'department')), themes: splitTags(getValue(row, 'themes')), audiences: splitTags(getValue(row, 'audiences')), objective: getValue(row, 'objective'), body: getValue(row, 'body'), accessibility: getValue(row, 'accessibility'), setup: getValue(row, 'setup'), headcount: getValue(row, 'headcount'), totalDuration: getValue(row, 'totalDuration'), inPersonDuration: getValue(row, 'inPersonDuration'), remoteDuration: getValue(row, 'remoteDuration'), editorialPublic: getValue(row, 'editorialPublic'), prerequisites: getValue(row, 'prerequisites'), contact: getValue(row, 'contact'), excelOrigin: origin, provenance: { row: { source: origin.sheetName } } }); }
function diagnoseColumns(headers) { const recognized = [], unknown = []; for (const h of headers) { const key = Object.keys(FIELD_ALIASES).find(k => FIELD_ALIASES[k].some(a => normalizeColumnName(a) === normalizeColumnName(h))); (key ? recognized : unknown).push({ header: h, field: key || null }); } return { recognized, unknown }; }
export function allowedSourceTypes() { return SOURCE_TYPES; }
