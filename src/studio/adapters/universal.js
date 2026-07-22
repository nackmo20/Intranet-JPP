import { FIELD_ALIASES, SOURCE_TYPES } from '../core/constants.js';
import { makePage } from '../core/model.js';
import { normalizeColumnName, normalizeText, parseJsonPossiblyFenced, sha256Hex, splitTags, unique } from '../core/utils.js';
import { pagesFromOvpJson } from '../core/workflows.js';

export async function inspectFile(file, forcedType = '') {
  const fingerprint = await sha256Hex(file);
  const binarySupport = getBinarySupport(file.name);
  if (!forcedType && binarySupport === 'unsupported') return skippedBinarySource(file, fingerprint, `Fichier binaire non pris en charge (${extensionOf(file.name) || 'extension inconnue'}) : ignoré sans bloquer l'extraction.`);
  let text = '';
  try { if (shouldReadAsText(file.name, file.type, forcedType)) text = await file.text(); }
  catch (err) { if (!forcedType) return skippedBinarySource(file, fingerprint, `Lecture impossible : ${err.message}. Fichier ignoré sans bloquer l'extraction.`); }
  const preliminaryType = forcedType || detectType(file, text);
  const parsed = await parseByType(file, text, preliminaryType, forcedType);
  const detectedType = forcedType || parsed.detectedType || preliminaryType;
  return { sourceId: fingerprint.slice(0, 16), type: detectedType, name: file.name, lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : '', size: file.size, rows: parsed.rows?.length || parsed.pages?.length || 0, sheets: parsed.workbook?.sheets?.length || 0, status: parsed.errors?.length ? 'warning' : 'ok', warnings: parsed.warnings || [], errors: parsed.errors || [], fingerprint, parsed };
}
function shouldReadAsText(name, mime = '', forcedType = '') { return Boolean(forcedType && !/\.xlsx$/i.test(name)) || /\.(json|csv|txt|html?|xls)$/i.test(name) || mime.includes('json') || mime.includes('text'); }
function extensionOf(name = '') { return (String(name).match(/\.([^.]+)$/)?.[1] || '').toLowerCase(); }
function getBinarySupport(name = '') { const ext = extensionOf(name); if (!ext) return 'unknown'; if (['json','csv','txt','html','htm','xls','xlsx'].includes(ext)) return 'supported'; if (['pdf','doc','docx','odt','ods','png','jpg','jpeg','gif','webp','zip','7z','rar','ppt','pptx'].includes(ext)) return 'unsupported'; return 'unknown'; }
function skippedBinarySource(file, fingerprint, message) { return { sourceId: fingerprint.slice(0, 16), type: 'unsupported_binary', name: file.name, lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : '', size: file.size, rows: 0, sheets: 0, status: 'skipped', warnings: [message], errors: [], fingerprint, parsed: { rows: [], pages: [], warnings: [message], skipped: true } }; }
export function detectType(file, text = '') {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.studio.json')) return 'studio_workspace';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'unknown';
  if (lower.endsWith('.csv')) return lower.includes('rana') ? 'bi_rana' : lower.includes('session') || lower.includes('sofia') ? 'plan_sessions_sofia' : 'demande_modification_excel';
  try { const obj = parseJsonPossiblyFenced(text); if (obj?.plan && Array.isArray(obj.plan.courses)) return 'json_ovp'; if (obj.type === 'create_pages') return 'legacy_create_pages'; if (obj.type === 'update_drupal_pages') return 'legacy_update_payload'; if (obj.type === 'bulk_drupal_theme_public_update') return 'legacy_taxonomy_payload'; if (obj.type === 'drupal_sofia_mapping' || obj.mappingVersion) return 'legacy_mapping_drupal_sofia'; if (obj.schemaVersion === '2.0.0' && obj.workspaceId) return 'studio_workspace'; if (obj.schemaVersion === '2.0.0' && obj.jobId) return 'legacy_update_payload'; if (obj.reportId || obj.items?.some?.(x => x.nodeId && x.status)) return 'update_report'; if (Array.isArray(obj) || obj.parcours || obj.intentions || obj.items) return 'json_ovp'; } catch {}
  if (/\bovp\b|intentions?|parcours/i.test(text.slice(0, 1000))) return 'json_ovp';
  return 'unknown';
}
async function parseByType(file, text, type, forcedType = '') {
  try {
    if (type.includes('json') || type.startsWith('legacy') || type.endsWith('report') || type === 'studio_workspace') return parseJsonSource(text, type);
    if (/\.csv$/i.test(file.name)) return parseTabular(text, type, ';');
    if (/\.html?$|\.xls$/i.test(file.name)) return parseHtmlTable(text, type);
    if (/\.xlsx$/i.test(file.name)) return await parseXlsxDiagnostic(file, forcedType || '');
    return { rows: [], pages: [], warnings: ['Type non reconnu : correction manuelle possible.'] };
  } catch (err) { return { rows: [], pages: [], errors: [err.message] }; }
}
function parseJsonSource(text, type) { const obj = parseJsonPossiblyFenced(text); if (type === 'studio_workspace') return { workspace: obj, pages: obj.pages || [] }; if (type === 'legacy_create_pages') return { raw: obj, pages: (obj.items || []).map(item => makePage({ title: item.title, sourceTitle: item.title, exportId: item.ficheFormation || item.exportId, themes: [item.theme, ...(item.thematics || [])], audiences: item.publics, departments: item.departmentCodes, accessibility: item.accessibility, body: item.html || item.content, provenance: { legacy: { source: 'create_pages' } } })) }; if (type === 'legacy_update_payload' || type === 'legacy_taxonomy_payload') return { raw: obj, rows: obj.targets || obj.items || [], pages: (obj.targets || []).map(t => makePage({ nodeId: t.nodeId, drupalUrl: t.pageUrl || t.drupalUrl, title: t.title, themes: t.expectedBefore?.theme, audiences: t.expectedBefore?.metiersPublics })) }; if (type === 'legacy_mapping_drupal_sofia') return { raw: obj, rows: obj.items || obj.mappings || [], pages: (obj.items || obj.mappings || []).map(i => makePage({ nodeId: i.nodeId, title: i.title, dispositifCode: i.dispositifCode, moduleCode: i.moduleCode, groupCode: i.groupCode, sourceOvp: i.sourceOvp })) }; if (type === 'update_report' || type === 'creation_report') return { raw: obj, rows: obj.items || [], pages: (obj.items || []).map(i => makePage({ nodeId: i.nodeId, drupalUrl: i.drupalUrl || i.pageUrl, status: i.status, title: i.title })) }; if (type === 'json_ovp') return { raw: obj, rows: obj?.plan?.courses || [], pages: pagesFromOvpJson(obj, { name: 'JSON OVP' }) }; const items = Array.isArray(obj) ? obj : obj.items || obj.parcours || obj.intentions || []; return { raw: obj, pages: items.map((item, index) => makePage({ intentionOvpId: item.id || item.intentionId || item.identifiant || String(index + 1), exportId: item.exportId || item.ficheFormation, sourceOvp: item.source || item.sourceOvp || '', title: item.title || item.titre || item.libelle, themes: splitTags(item.theme || item.thematique), audiences: splitTags(item.publics || item.metiers), body: item.contenu || item.description || item.html, objective: item.objectif, departments: splitTags(item.department || item.departement || item.departments) })) }; }
export function parseTabular(text, type, delimiter = ';') { const lines = text.split(/\r?\n/).filter(Boolean); const headers = splitCsvLine(lines[0] || '', delimiter); const rows = lines.slice(1).map((line, idx) => Object.fromEntries(splitCsvLine(line, delimiter).map((v, i) => [headers[i] || `Colonne ${i + 1}`, v]))); return rowsToParsed(rows, type, { sheetName: 'CSV', startRow: 2, headers }); }
function splitCsvLine(line, delimiter) { const out = []; let cell = '', q = false; for (let i = 0; i < line.length; i += 1) { const ch = line[i]; if (ch === '"' && line[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') q = !q; else if (ch === delimiter && !q) { out.push(cell); cell = ''; } else cell += ch; } out.push(cell); return out.map(x => x.trim()); }
function parseHtmlTable(text, type) { const table = [...text.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(row => [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())); const headers = table[0] || []; const rows = table.slice(1).map(r => Object.fromEntries(r.map((v, i) => [headers[i] || `Colonne ${i + 1}`, v]))); return rowsToParsed(rows, type, { sheetName: 'HTML', startRow: 2, headers }); }

export async function parseXlsxDiagnostic(file, forcedType = '') {
  const workbook = await readXlsxWorkbook(file);
  const signatures = workbook.sheets.map(s => ({ sheet: s, type: detectTypeFromHeaders(s.headers, file.name) })).filter(x => x.type);
  const detectedType = forcedType || signatures[0]?.type || detectTypeFromName(file.name);
  const rows = [];
  for (const sheet of workbook.sheets) {
    if (!sheet.headers.length) continue;
    const sheetType = detectTypeFromHeaders(sheet.headers, file.name);
    if (detectedType === 'recensement_excel' && !(sheetType === 'recensement_excel' && /^T\d{1,2}_/i.test(sheet.name))) continue;
    if (detectedType !== 'recensement_excel' && sheetType !== detectedType) continue;
    for (const row of sheet.objects) rows.push({ ...row, excelOrigin: { sheetName: sheet.name, rowNumber: row.__rowNumber } });
  }
  const parsed = rowsToParsed(rows, detectedType, { sheetName: 'XLSX', startRow: 2, headers: signatures[0]?.sheet.headers || [] });
  parsed.workbook = workbook; parsed.detectedType = detectedType;
  parsed.warnings = rows.length ? [] : [`Aucune ligne exploitable trouvée pour le type ${detectedType || 'inconnu'} malgré ${workbook.sheets.length} feuille(s) lue(s).`];
  parsed.diagnostics = { ...(parsed.diagnostics || {}), workbookSheets: workbook.sheets.map(s => ({ name: s.name, index: s.index, rows: s.rowCount, headerRowNumber: s.headerRowNumber, headers: s.headers })), detectedType };
  return parsed;
}

async function readXlsxWorkbook(file) {
  const entries = await unzipEntries(new Uint8Array(await file.arrayBuffer())); const xml = p => new TextDecoder().decode(entries[p] || new Uint8Array());
  if (!entries['xl/workbook.xml']) throw new Error('Classeur XLSX illisible : xl/workbook.xml absent.');
  const rels = parseRels(xml('xl/_rels/workbook.xml.rels')); const shared = parseSharedStrings(xml('xl/sharedStrings.xml'));
  const workbookXml = xml('xl/workbook.xml'); const sheets = [...workbookXml.matchAll(/<sheet\b([^>]*)\/?>(?:<\/sheet>)?/g)].map((m, i) => ({ name: attr(m[1], 'name'), index: i + 1, rid: attr(m[1], 'r:id') || attr(m[1], 'id') }));
  for (const sheet of sheets) { const target = rels[sheet.rid] || `worksheets/sheet${sheet.index}.xml`; const path = `xl/${target.replace(/^\//,'').replace(/^xl\//,'')}`; Object.assign(sheet, parseSheetXml(xml(path), shared)); }
  return { sheets };
}
async function unzipEntries(bytes) { const out = {}; for (let p = 0; p < bytes.length;) { if (u32(bytes,p) !== 0x04034b50) break; const method = u16(bytes,p+8), csize = u32(bytes,p+18), nlen = u16(bytes,p+26), xlen = u16(bytes,p+28); const name = new TextDecoder().decode(bytes.slice(p+30,p+30+nlen)); const start = p+30+nlen+xlen; const comp = bytes.slice(start,start+csize); out[name] = method === 0 ? comp : await inflateRaw(comp); p = start + csize; } return out; }
async function inflateRaw(bytes) { const ds = new DecompressionStream('deflate-raw'); const stream = new Blob([bytes]).stream().pipeThrough(ds); return new Uint8Array(await new Response(stream).arrayBuffer()); }
const u16=(b,p)=>b[p]|(b[p+1]<<8); const u32=(b,p)=>u16(b,p)|(u16(b,p+2)<<16);
function parseRels(text) { return Object.fromEntries([...text.matchAll(/<Relationship\b([^>]*)\/>/g)].map(m => [attr(m[1], 'Id'), attr(m[1], 'Target')])); }
function parseSharedStrings(text) { return [...text.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => decodeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join(''))); }
function parseSheetXml(text, shared) { const rowsRaw = [...text.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)].map(m => ({ n: Number(attr(m[1], 'r')) || 0, cells: parseCells(m[2], shared) })); const merges = [...text.matchAll(/<mergeCell\b[^>]*ref="([^"]+)"/g)].map(m => m[1]); const header = findHeader(rowsRaw); const objects = rowsRaw.filter(r => r.n > header.rowNumber).map(r => ({ __rowNumber: r.n, ...Object.fromEntries(header.headers.map((h,i) => [h, normalizeCellForHeader(r.cells[i], h)])) })).filter(o => Object.values(o).some(v => v !== '' && v !== undefined)); return { rows: rowsRaw, rowCount: rowsRaw.length, merges, headers: header.headers, headerRowNumber: header.rowNumber, objects, formulasPreserved: true, formatsPreserved: 'partiel' }; }
function parseCells(xml, shared) { const values = []; for (const m of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) { const ref = attr(m[1], 'r'); const idx = colIndex(ref); const type = attr(m[1], 't'); const f = m[2].match(/<f[^>]*>([\s\S]*?)<\/f>/)?.[1]; let v = m[2].match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? ''; if (type === 's') v = shared[Number(v)] ?? ''; else if (type === 'inlineStr') v = [...m[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join(''); else v = decodeXml(v); values[idx] = f ? { formula: decodeXml(f), value: v } : v; } return values.map(v => v ?? ''); }
function findHeader(rows) { let best = rows[0] || { n: 1, cells: [] }, score = -1; for (const r of rows.slice(0, 20)) { const headers = r.cells.map(c => String(typeof c === 'object' ? c.value : c).trim()); const s = headers.filter(Boolean).length + (detectTypeFromHeaders(headers) ? 20 : 0); if (s > score) { score = s; best = r; } } return { rowNumber: best.n || 1, headers: best.cells.map(c => String(typeof c === 'object' ? c.value : c).trim()).filter(Boolean) }; }
function normalizeCellForHeader(v, h) { if (typeof v === 'object') return { formula: v.formula, value: v.value }; if (/date|début|debut|fin/i.test(h) && /^\d+(\.\d+)?$/.test(String(v))) return excelDate(Number(v)); return String(v ?? '').trim(); }
function excelDate(n) { const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000); return d.toISOString().replace('T',' ').slice(0,16); }
function colIndex(ref='') { let s = (ref.match(/[A-Z]+/i)?.[0] || 'A').toUpperCase(), n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; }
function attr(s, n) { return (s.match(new RegExp(`\\b${n}="([^"]*)"`)) || [])[1] || ''; }
function decodeXml(s='') { return String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'"); }
function detectTypeFromName(name='') { const lower=name.toLowerCase(); return lower.includes('recensement')||lower.includes('suivi') ? 'recensement_excel' : lower.includes('session')||lower.includes('formation export plan') ? 'plan_sessions_sofia' : 'demande_modification_excel'; }
function detectTypeFromHeaders(headers=[]) { const n = headers.map(normalizeColumnName); const has = (...cols) => cols.every(c => n.includes(normalizeColumnName(c))); if (has('Dispositif : code','Module : code','Groupe : identifiant','Session','Début','Fin','Modalité','UAI','Lieu')) return 'plan_sessions_sofia'; if (has('Node ID Drupal','Lien de la page','Titre')) return 'recensement_excel'; if (has('ID intention','Titre du parcours','Objectif général','Contenu')) return 'demande_modification_excel'; return ''; }
function rowsToParsed(rows, type, ctx) { return { rows, pages: rows.map((r, i) => rowToPage(r, r.excelOrigin || { sheetName: ctx.sheetName, rowNumber: ctx.startRow + i })), diagnostics: diagnoseColumns(ctx.headers) }; }
function getValue(row, key) { const aliases = FIELD_ALIASES[key] || [key]; const found = Object.keys(row).find(k => aliases.some(a => normalizeColumnName(k) === normalizeColumnName(a))); const v = found ? row[found] : ''; return typeof v === 'object' && v?.value !== undefined ? v.value : v; }
function rowToPage(row, origin) { const moduleCodes = splitCodes(getValue(row, 'moduleCode')); return makePage({ nodeId: String(getValue(row, 'nodeId') || ''), drupalUrl: getValue(row, 'drupalUrl'), intentionOvpId: getValue(row, 'intentionOvpId'), exportId: getValue(row, 'exportId'), title: getValue(row, 'title'), dispositifCode: String(getValue(row, 'dispositifCode') || ''), moduleCodes, groupCode: getValue(row, 'groupCode'), rne: getValue(row, 'rne'), departments: splitTags(getValue(row, 'department')), themes: splitTags(getValue(row, 'themes')), audiences: splitTags(getValue(row, 'audiences')), objective: getValue(row, 'objective'), body: getValue(row, 'body'), accessibility: getValue(row, 'accessibility'), setup: getValue(row, 'setup'), headcount: getValue(row, 'headcount'), totalDuration: getValue(row, 'totalDuration'), inPersonDuration: getValue(row, 'inPersonDuration'), remoteDuration: getValue(row, 'remoteDuration'), editorialPublic: getValue(row, 'editorialPublic'), prerequisites: getValue(row, 'prerequisites'), contact: getValue(row, 'contact'), excelOrigin: origin, provenance: { row: { source: origin.sheetName } } }); }
function splitCodes(value) { return unique(String(value || '').split(/[;,|\n]+/).map(v => v.trim()).filter(Boolean)); }
function diagnoseColumns(headers) { const recognized = [], unknown = []; for (const h of headers) { const key = Object.keys(FIELD_ALIASES).find(k => FIELD_ALIASES[k].some(a => normalizeColumnName(a) === normalizeColumnName(h))); (key ? recognized : unknown).push({ header: h, field: key || null }); } return { recognized, unknown }; }
export function allowedSourceTypes() { return SOURCE_TYPES; }
