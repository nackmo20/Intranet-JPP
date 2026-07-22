import { MATCH_PRIORITY } from './constants.js';
import { normalizeText, normalizeTitle } from './utils.js';
function field(page, key) { if (key === 'moduleCode') return page.trainingCodes?.moduleCodes?.[0] || ''; if (key === 'groupCode') return page.trainingCodes?.groups?.[0] || ''; if (key === 'rne') return page.trainingCodes?.rne?.[0] || ''; if (key === 'department') return page.taxonomies?.departments?.[0] || ''; if (key === 'dispositifCode') return page.trainingCodes?.dispositifCode || ''; if (key === 'normalizedTitle') return normalizeTitle(page.drupalTitle || page.sourceTitle); return page[key] || ''; }
export function matchPages(requests = [], inventory = [], rejected = []) {
  const rejectedKeys = new Set(rejected.map(r => `${r.requestId}:${r.targetId}`));
  return requests.map(req => {
    const alternatives = inventory.map(inv => scorePair(req, inv)).filter(s => s.score > 0 && !rejectedKeys.has(`${req.canonicalId}:${s.target.canonicalId}`)).sort((a, b) => b.score - a.score);
    const best = alternatives[0] || null; const ambiguous = alternatives[1] && best && alternatives[1].score >= best.score - 0.05;
    return { requestId: req.canonicalId, targetId: best?.target.canonicalId || '', nodeId: best?.target.nodeId || '', score: best?.score || 0, method: best?.method || 'none', reasons: best?.reasons || [], alternatives: alternatives.slice(1, 4).map(a => ({ targetId: a.target.canonicalId, title: a.target.drupalTitle, score: a.score, method: a.method })), conflicts: ambiguous ? ['Correspondance ambiguë à valider manuellement.'] : [], dataUsed: best?.dataUsed || {}, status: best ? (ambiguous ? 'ambiguous' : 'matched') : 'unmatched', manualValidation: false };
  });
}
export function scorePair(a, b) {
  const reasons = [], dataUsed = {}; let score = 0, method = 'none';
  for (let i = 0; i < MATCH_PRIORITY.length; i += 1) { const key = MATCH_PRIORITY[i]; const av = field(a, key), bv = field(b, key); if (!av || !bv) continue; dataUsed[key] = { request: av, target: bv }; const equal = key === 'normalizedTitle' ? av === bv : normalizeText(av) === normalizeText(bv); if (equal) { const s = 1 - i * 0.07; if (s > score) { score = s; method = key; } reasons.push(`Égalité ${key}`); } }
  if (score === 0 && field(a, 'normalizedTitle') && field(b, 'normalizedTitle')) { const sim = similarity(field(a, 'normalizedTitle'), field(b, 'normalizedTitle')); if (sim > 0.72) { score = sim * 0.45; method = 'title_similarity_last_resort'; reasons.push('Similarité de titre en dernier recours'); } }
  return { target: b, score: Math.round(score * 100) / 100, method, reasons, dataUsed };
}
function similarity(a, b) { const aa = normalizeTitle(a), bb = normalizeTitle(b); if (!aa || !bb) return 0; const setA = new Set(aa.split(' ')), setB = new Set(bb.split(' ')); const inter = [...setA].filter(x => setB.has(x)).length; return inter / Math.max(setA.size, setB.size); }
