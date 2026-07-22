import assert from 'node:assert/strict';
import { File } from 'node:buffer';
import { detectType, inspectFile, parseTabular } from '../src/studio/adapters/universal.js';
import { stripDepartmentPrefix, normalizeTitle } from '../src/studio/core/utils.js';
import { matchPages } from '../src/studio/core/matching.js';
import { makePage, createWorkspace } from '../src/studio/core/model.js';
import { applyTaxonomyOperation, makeDiff } from '../src/studio/core/operations.js';
import { buildJob } from '../src/studio/core/exportJob.js';
import { validateWorkspace, assertNoEmptyTargets } from '../src/studio/core/validation.js';
import { exportWorkspace, importWorkspace } from '../src/studio/core/workspace.js';
import { pagesFromOvpJson, buildSofiaWorkflow, buildEditorialWorkflow, buildTaxonomyWorkflow, EDITORIAL_FIELDS, SOFIA_FIELDS, TAXONOMY_FIELDS } from '../src/studio/core/workflows.js';

globalThis.crypto ??= (await import('node:crypto')).webcrypto;
globalThis.localStorage ??= { data: new Map(), getItem(k){return this.data.get(k)||null}, setItem(k,v){this.data.set(k,v)}, removeItem(k){this.data.delete(k)} };
const tests = []; function test(name, fn){ tests.push([name, fn]); }
const fieldsOf = job => job.targets.flatMap(t => t.operations.map(o => o.field));

test('imports: detect legacy create_pages JSON', () => { assert.equal(detectType({ name:'payload.json' }, JSON.stringify({ type:'create_pages', items:[] })), 'legacy_create_pages'); });
test('imports: CSV aliases feed canonical model with origin', () => { const parsed = parseTabular('Node ID;Titre;Département\n123;16 - Formation test;16', 'recensement_excel'); assert.equal(parsed.pages[0].nodeId, '123'); assert.equal(parsed.pages[0].excelOrigin.rowNumber, 2); });
test('excel: XLSX import gives no-loss diagnostic without touching original', async () => { const file = new File(['PK'], 'suivi.xlsx'); const source = await inspectFile(file); assert.equal(source.type, 'recensement_excel'); assert.equal(source.sheets, 1); assert.match(source.warnings.join(' '), /original ne sera jamais modifié|parseur complet/); });

test('unsupported binary: binary files are skipped without blocking extraction', async () => {
  const file = new File([new Uint8Array([0, 1, 2, 3])], 'notice.pdf', { type: 'application/pdf' });
  const source = await inspectFile(file);
  assert.equal(source.type, 'unsupported_binary');
  assert.equal(source.status, 'skipped');
  assert.equal(source.parsed.pages.length, 0);
  assert.match(source.warnings.join(' '), /sans bloquer l'extraction/);
});
test('titles: departmental prefixes are ignored only for title matching', () => { assert.equal(stripDepartmentPrefix('016 - Parcours Exemple'), 'Parcours Exemple'); assert.equal(normalizeTitle('79/86 – Parcours Exemple'), 'parcours exemple'); });
test('mappings: Node ID priority beats title', () => { const req = makePage({ nodeId:'42', title:'Autre' }); const inv = makePage({ nodeId:'42', title:'Cible' }); const [m] = matchPages([req], [inv]); assert.equal(m.method, 'nodeId'); assert.equal(m.status, 'matched'); });
test('diffs: blank cell means ignore', () => { assert.equal(makeDiff({ field:'contact', currentValue:'a', requestedValue:'', target:makePage() }), null); });
test('taxonomy: add preserves existing values', () => { assert.deepEqual(applyTaxonomyOperation(['A'], 'add', ['B']), ['A','B']); });
test('delete: explicit deletion markers are accepted', () => { for (const marker of ['__DELETE__','[DELETE]','SUPPRIMER']) assert.equal(makeDiff({ field:'body', currentValue:'x', requestedValue:marker, target:makePage() }).operation, 'delete'); });
test('removed rows: removed target is absent from job JSON', () => { const ws = createWorkspace(); const p = makePage({ title:'A', themes:['T'], audiences:['P'] }); ws.pages=[p]; ws.removedTargets[p.canonicalId]=true; assert.equal(buildJob(ws).targets.length,0); });
test('payloads: no empty target is exported', () => { const ws = createWorkspace(); const p = makePage({ title:'A', themes:['T'], audiences:['P'] }); ws.pages=[p]; const job=buildJob(ws); assert.ok(assertNoEmptyTargets(job)); });
test('workspace: export and import round-trip', () => { const ws = createWorkspace(); ws.name='Roundtrip'; assert.equal(importWorkspace(exportWorkspace(ws)).name, 'Roundtrip'); });
test('controls: creation without audience blocks export', () => { const ws = createWorkspace(); ws.pages=[makePage({ title:'A', themes:['T'] })]; assert.equal(validateWorkspace(ws).blocking,true); });

test('ovp plan courses import maps real OVP fields and filters individual applications', () => {
  const pages = pagesFromOvpJson({ plan:{ courses:[{ id:'C1', title:'Parcours A', presentiel:'3h', distanciel:'1h', dureeTotale:'4h', effectif:'20', typeCandidature:'collective', meta:{ objectif:'Obj', contenu:'Body', prerequis:'Pré', accessibilite:'Acc', contact:'Mail', publicConcerne:'Enseignants', miseEnPlace:'Modalités' } }, { id:'C2', title:'Indiv', typeCandidature:'individuelle' }] } }, { name:'ovp.json' });
  assert.equal(pages.length,1); assert.equal(pages[0].content.objective,'Obj'); assert.equal(pages[0].content.totalDuration,'4h');
});

test('sofia integration: inventory + Sofia updates only sessions and pre-registration fields', () => {
  const inv = [makePage({ nodeId:'101', title:'Formation', dispositifCode:'D1', moduleCode:'M1', groupCode:'G1', rne:'0160001A', themes:['T'], audiences:['P'] })];
  const { diffs } = buildSofiaWorkflow(inv, [{ 'Dispositif : code':'D1','Module : code':'M1','Groupe : identifiant':'G1','UAI':'0160001A','Début':'2026-09-01 09:00','Fin':'2026-09-01 12:00','Durée':'3h','Modalité':'Présentiel','Lieu':'Poitiers','Préinscriptions : Publication : lien préinscription':'https://sofia/pre','Préinscriptions : Préinscrits : nombre maximal':'20','Préinscriptions : Préinscrits : nombre total':'7' }]);
  const ws = createWorkspace(); ws.currentWorkflow='update_sofia'; ws.pages=inv; ws.diffs=diffs; const job=buildJob(ws); const fields=fieldsOf(job);
  assert.ok(['dates','times','locations','modalities','preRegistrationUrl','capacity','registered','remainingSeats'].every(f => fields.includes(f)));
  assert.ok(fields.every(f => SOFIA_FIELDS.includes(f))); assert.equal(job.targets[0].operations.find(o=>o.field==='remainingSeats').values,13);
});

test('editorial integration: inventory + requests creates only editorial diffs, ignores blanks, removed row absent', () => {
  const target = makePage({ nodeId:'201', title:'16 - Titre actuel', themes:['T'], audiences:['P'], objective:'Ancien', body:'Body', contact:'Ancien contact' });
  const req = makePage({ nodeId:'201', title:'Titre futur', objective:'Nouveau', body:'', contact:'SUPPRIMER' });
  const { diffs } = buildEditorialWorkflow([target], [req]); const ws = createWorkspace(); ws.currentWorkflow='update_content'; ws.pages=[target]; ws.diffs=diffs; ws.removedTargets[target.canonicalId]=true; const jobRemoved=buildJob(ws); assert.equal(jobRemoved.targets.length,0);
  delete ws.removedTargets[target.canonicalId]; const job=buildJob(ws); const fields=fieldsOf(job); assert.ok(fields.includes('drupalTitle')); assert.ok(fields.includes('objective')); assert.ok(fields.includes('contact')); assert.ok(!fields.includes('body')); assert.ok(fields.every(f => EDITORIAL_FIELDS.includes(f)));
});

test('taxonomy integration: select by Node ID, add theme and audience, export only requested taxonomy fields', () => {
  const inv = [makePage({ nodeId:'301', title:'Taxo', themes:['Ancienne'], audiences:['Racine > Ancien'] })];
  const diffs = buildTaxonomyWorkflow(inv, { nodeIds:['301'], themeOperation:'add', audienceOperation:'add', themes:['Nouvelle'], audiences:['Racine > Nouveau'] });
  const ws=createWorkspace(); ws.currentWorkflow='update_taxonomy'; ws.pages=inv; ws.diffs=diffs; const job=buildJob(ws); const fields=fieldsOf(job);
  assert.deepEqual(fields.sort(), ['audiences','themes']); assert.ok(fields.every(f => TAXONOMY_FIELDS.includes(f))); assert.deepEqual(job.targets[0].operations.find(o=>o.field==='themes').values, ['Nouvelle']);
});

test('non contamination: each update workflow exports only its allowed fields and requires Node ID', () => {
  const page = makePage({ nodeId:'401', title:'A', themes:['T'], audiences:['P'], dispositifCode:'D', moduleCode:'M', groupCode:'G' });
  const sofia = buildSofiaWorkflow([page], [{ 'Dispositif : code':'D','Module : code':'M','Groupe : identifiant':'G','Début':'d','Lieu':'l' }]).diffs;
  const editorial = buildEditorialWorkflow([page], [makePage({ nodeId:'401', title:'B', objective:'O' })]).diffs;
  const tax = buildTaxonomyWorkflow([page], { nodeIds:['401'], themes:['T2'], audiences:['P2'] });
  for (const [workflow,diffs,allowed] of [['update_sofia',sofia,SOFIA_FIELDS],['update_content',editorial,EDITORIAL_FIELDS],['update_taxonomy',tax,TAXONOMY_FIELDS]]) { const ws=createWorkspace(); ws.currentWorkflow=workflow; ws.pages=[page]; ws.diffs=diffs; const job=buildJob(ws); assert.ok(job.targets.every(t => t.nodeId)); assert.ok(fieldsOf(job).every(f => allowed.includes(f))); }
});

test('agent report import updates confirmed inventory only', () => {
  const ws=createWorkspace(); ws.reports=[{ jobId:'job-1', items:[{ canonicalId:'x', nodeId:'9', status:'success', before:{title:'A'}, after:{title:'B'}, operationsApplied:[{field:'drupalTitle'}], backup:{ok:true} }] }];
  assert.equal(ws.reports[0].items[0].status,'success'); assert.equal(ws.reports[0].items[0].after.title,'B');
});

let passed = 0; for (const [name, fn] of tests) { await fn(); console.log(`ok - ${name}`); passed += 1; } console.log(`${passed}/${tests.length} tests passed`);
