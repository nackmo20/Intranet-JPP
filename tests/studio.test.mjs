import assert from 'node:assert/strict';
import { File } from 'node:buffer';
import { readFileSync } from 'node:fs';
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
test('excel: invalid XLSX returns an explicit error, not simulated empty rows', async () => { const file = new File(['PK'], 'suivi.xlsx'); const source = await inspectFile(file); assert.equal(source.type, 'unknown'); assert.equal(source.status, 'warning'); assert.match(source.errors.join(' '), /workbook.xml|XLSX/); });


const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const pagesFromFixtureRows = (rows, sheet='fixture') => rows.map((r, i) => makePage({ nodeId:r['Node ID Drupal'], drupalUrl:r['Lien de la page'], title:r.Titre, departments:String(r['Départements']||'').split(/[;,|\n]+/).filter(Boolean), dispositifCode:r['Numéro de dispositif GAIA'], moduleCodes:String(r['Numéro de module GAIA']||'').split(/[;,|\n]+/).map(x=>x.trim()).filter(Boolean), sourceOvp:r['Source OVP'], excelOrigin:r.excelOrigin || { sheetName: sheet, rowNumber: i + 2 } }));

test('real OVP fixture: 10 courses, meta fields and numeric session counters', () => {
  const obj = fixture('ovp-plan-emi.sample.json');
  assert.equal(detectType({ name:'plan.ovp.json' }, JSON.stringify(obj)), 'json_ovp');
  const pages = pagesFromOvpJson(obj, { name:'ovp' });
  assert.equal(pages.length, 10);
  assert.equal(pages[0].content.objective, 'Objectif 1');
  assert.equal(pages[0].content.body, 'Contenu 1');
  assert.doesNotThrow(() => pagesFromOvpJson({ plan:{ courses:[{ id:'n', title:'Num', sessionsPresentiel:1, sessionsDistanciel:1, meta:{} }] } }));
});

test('real recensement fixture: T sheets, GAIA columns, origins and no departmental merge', () => {
  const rec = fixture('recensement-drupal.sample.json');
  const rows = rec.sheets.filter(s => /^T\d{1,2}_/.test(s.name)).flatMap(s => s.rows);
  const pages = pagesFromFixtureRows(rows, 'T1_test');
  assert.equal(pages.length, 3);
  assert.deepEqual(pages.map(p => p.nodeId), ['1001','1002','1003']);
  assert.equal(pages[0].trainingCodes.dispositifCode, '26A0130001');
  assert.deepEqual(pages[1].trainingCodes.moduleCodes, ['75001','75002']);
  assert.equal(pages[0].excelOrigin.sheetName, 'T1_test');
  assert.equal(pages[0].excelOrigin.rowNumber, 2);
  assert.notEqual(pages[0].canonicalId, pages[1].canonicalId);
});

test('GAIA module to Drupal Node ID uses exact code plus UAI department', () => {
  const pages = pagesFromFixtureRows(fixture('recensement-drupal.sample.json').sheets[2].rows.slice(0,2), 'T1_test');
  const sofia = fixture('sofia-plan-sessions.sample.json').sheets[0].rows.slice(0,2);
  const { matches } = buildSofiaWorkflow(pages, sofia);
  assert.equal(matches[0].nodeId, '1001');
  assert.equal(matches[1].nodeId, '1002');
});

test('bidépartemental page accepts Sofia lines from departments 16 and 17', () => {
  const page = pagesFromFixtureRows([fixture('recensement-drupal.sample.json').sheets[2].rows[2]], 'T1_test');
  const rows = fixture('sofia-plan-sessions.sample.json').sheets[0].rows.slice(0,2).map(r => ({ ...r, 'Module : code':'75003' }));
  const { matches } = buildSofiaWorkflow(page, rows);
  assert.deepEqual(matches.map(m => m.nodeId), ['1003','1003']);
});

test('fallback without GAIA proposes title matches with groups UAI and departments but requires validation', () => {
  const page = makePage({ nodeId:'2001', title:'16 - Parcours X', departments:['16'] });
  const row = { 'Dispositif : code':'D9','Dispositif : libellé':'Parcours X','Module : code':'M9','Module : libellé':'Parcours X','Groupe : identifiant':'G16','Session':'S1','Début':'2026','Fin':'2026','Modalité':'Distance','UAI':'0160106D','Lieu':'Angoulême' };
  const { matches } = buildSofiaWorkflow([page], [row]);
  assert.equal(matches[0].nodeId, '2001');
  assert.equal(matches[0].method, 'title_fallback_unvalidated');
  assert.ok(matches[0].reasons.join(' ').includes('valider manuellement'));
});

test('security blockers: unresolved or ambiguous Sofia mappings carry conflicts and no exportable Node ID', () => {
  const unresolved = buildSofiaWorkflow([], [{ 'Module : code':'75001','Début':'d' }]).matches[0];
  assert.equal(unresolved.nodeId, '');
  assert.ok(unresolved.conflicts.length);
  const p1 = makePage({ nodeId:'1', title:'16 - X', moduleCode:'75001', departments:['16'] });
  const p2 = makePage({ nodeId:'2', title:'16 - X bis', moduleCode:'75001', departments:['16'] });
  const amb = buildSofiaWorkflow([p1,p2], [{ 'Dispositif : code':'D','Module : code':'75001','UAI':'0160106D','Début':'d' }]).matches[0];
  assert.ok(amb.conflicts.join(' ').includes('Plusieurs pages possibles'));
});

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
  assert.equal(pages.length,2); assert.equal(pages[0].content.objective,'Obj'); assert.equal(pages[0].content.totalDuration,'4h');
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
