import { DEPARTMENT_PREFIX_RE } from './constants.js';
export const nowIso = () => new Date().toISOString();
export function uid(prefix = 'id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
export function removeAccents(value = '') { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
export function normalizeText(value = '') { return removeAccents(value).toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim(); }
export function normalizeColumnName(value = '') { return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim(); }
export function stripDepartmentPrefix(title = '') { return String(title).replace(DEPARTMENT_PREFIX_RE, '').trim(); }
export function normalizeTitle(title = '') { return normalizeText(stripDepartmentPrefix(title)).replace(/[^a-z0-9]+/g, ' ').trim(); }
export function splitTags(value) { if (Array.isArray(value)) return value.flatMap(splitTags); return String(value || '').split(/[;,|\n]+/).map(v => v.trim()).filter(Boolean); }
export function unique(values) { const list = Array.isArray(values) ? values : (values === undefined || values === null ? [] : [values]); return [...new Map(list.filter(v => v !== undefined && v !== null && String(v).trim() !== '').map(v => [normalizeText(v), String(v).trim()])).values()]; }
export function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
export async function sha256Hex(blobOrText) { const buf = typeof blobOrText === 'string' ? new TextEncoder().encode(blobOrText) : await blobOrText.arrayBuffer(); const hash = await crypto.subtle.digest('SHA-256', buf); return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join(''); }
export function downloadText(filename, text, type = 'application/json') { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function parseJsonPossiblyFenced(text) { const cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim(); try { return JSON.parse(cleaned); } catch { const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}'); if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)); throw new Error('JSON illisible : vérifiez le format ou le bloc Markdown copié.'); } }
export function chunked(items, worker, chunk = 200) { return new Promise((resolve, reject) => { let i = 0; const out = []; const step = () => { try { const end = Math.min(i + chunk, items.length); for (; i < end; i += 1) out.push(worker(items[i], i)); if (i < items.length) setTimeout(step, 0); else resolve(out); } catch (err) { reject(err); } }; step(); }); }
export function toCsv(rows) { return rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'); }
