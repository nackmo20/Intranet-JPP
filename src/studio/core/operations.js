import { CONTENT_OPERATIONS, EXPLICIT_DELETE_MARKERS, TAXONOMY_OPERATIONS } from './constants.js';
import { normalizeText, unique } from './utils.js';
export function isExplicitDelete(value) { return EXPLICIT_DELETE_MARKERS.includes(String(value || '').trim()); }
export function isBlankIgnore(value) { return value === undefined || value === null || String(value).trim() === ''; }
export function applyTaxonomyOperation(before = [], op = 'add', values = []) {
  const incoming = unique(Array.isArray(values) ? values : [values]);
  const current = unique(before);
  if (!TAXONOMY_OPERATIONS.includes(op)) throw new Error(`Opération taxonomique inconnue: ${op}`);
  if (op === 'add') return unique([...current, ...incoming]);
  if (op === 'remove') return current.filter(v => !incoming.some(i => normalizeText(i) === normalizeText(v)));
  if (op === 'replace') return incoming;
  if (op === 'clear') return [];
}
export function makeDiff({ field, currentValue, requestedValue, source = 'manual', target, confidence = 1, reason = '' }) {
  if (isBlankIgnore(requestedValue)) return null;
  const op = isExplicitDelete(requestedValue) ? 'delete' : 'replace';
  if (op === 'delete' && !isExplicitDelete(requestedValue)) throw new Error('Suppression non explicite');
  return { diffId: `${target?.canonicalId || 'target'}:${field}`, selected: true, field, currentValue: currentValue ?? '', requestedValue, futureValue: op === 'delete' ? '' : requestedValue, operation: op, source, confidence, targetId: target?.canonicalId || '', reason, warnings: [] };
}
export function makeTaxonomyDiff({ field, currentValues = [], requestedValues = [], operation = 'add', target, source = 'manual' }) {
  const incoming = unique(requestedValues);
  if (!incoming.length && operation !== 'clear') return null;
  const future = applyTaxonomyOperation(currentValues, operation, incoming);
  const warnings = [];
  if (operation === 'replace') warnings.push('Opération destructive : des valeurs existantes peuvent disparaître.');
  if (operation === 'clear') warnings.push('Confirmation renforcée requise : toutes les valeurs seront vidées.');
  return { diffId: `${target?.canonicalId || 'target'}:${field}`, selected: true, field, currentValue: currentValues, requestedValue: incoming, futureValue: future, operation, source, confidence: 1, targetId: target?.canonicalId || '', reason: 'Modification taxonomique explicite', warnings };
}
export function pruneEmptyOperations(operations) { return (operations || []).filter(op => op && op.op !== 'ignore' && (op.op === 'clear' || op.op === 'delete' || (Array.isArray(op.values) ? op.values.length : op.values !== undefined && op.values !== ''))); }
export function diffToOperation(diff) { return { field: diff.field, op: diff.operation, values: diff.operation === 'delete' ? undefined : diff.requestedValue, explicitDeleteMarker: diff.operation === 'delete' ? '__DELETE__' : undefined, provenance: { sourceType: diff.source, confidence: diff.confidence, fieldPath: diff.field } }; }
