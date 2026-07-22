import { makeDiff } from './operations.js';
export const CONTENT_FIELDS = ['drupalTitle','objective','body','accessibility','setup','headcount','totalDuration','inPersonDuration','remoteDuration','editorialPublic','prerequisites','contact','dates','location','link','departments'];
function valueOf(page, field) { if (field === 'drupalTitle') return page.drupalTitle; if (field === 'departments') return page.taxonomies?.departments?.join('; '); if (field === 'dates') return page.sessions?.flatMap(s => s.dates || []).join('; '); if (field === 'location') return page.sessions?.flatMap(s => s.lieux || []).join('; '); if (field === 'link') return page.sessions?.map(s => s.preRegistrationUrl).filter(Boolean).join('; '); return page.content?.[field] || page[field] || ''; }
export function buildDiffs(requests, inventory, matches) {
  const byId = new Map(inventory.map(p => [p.canonicalId, p])); const out = [];
  for (const req of requests) { const match = matches.find(m => m.requestId === req.canonicalId && m.status !== 'unmatched'); const target = byId.get(match?.targetId) || {}; for (const f of CONTENT_FIELDS) { const d = makeDiff({ field: f, currentValue: valueOf(target, f), requestedValue: valueOf(req, f), source: 'DEMANDE_MODIFICATION', confidence: match?.score || 0, target: req, reason: match?.reasons?.join('; ') || '' }); if (d && String(d.currentValue) !== String(d.futureValue)) out.push(d); } }
  return out;
}
