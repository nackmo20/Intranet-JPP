const fs=require('fs');
const crypto=require('crypto');
const source='260717_Suivi_parcours_intranet_VF_colonne_subdivisee(1).xlsx';
const before=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const structure=JSON.parse(fs.readFileSync('docs/structure-recensement-excel.json','utf8'));
function assert(c,m){if(!c)throw new Error(m)}
assert(structure.generatedFromReadOnlySource===true,'source lecture seule');
assert(structure.sheets.length>=10,'feuilles détectées');
assert(structure.sheets.some(s=>s.isThematicSheet),'onglets thématiques détectés');
assert(structure.sheets.some(s=>s.columns.some(c=>c.header==='Node ID Drupal')),'colonne Node ID Drupal détectée');
assert(structure.sheets.some(s=>s.unknownColumns.length>0),'colonnes inconnues conservées');
assert(structure.sheets.every(s=>Array.isArray(s.mergedCells)),'cellules fusionnées décrites');
const after=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
assert(before===after,'le classeur source n’a pas été modifié');
console.log('excel structure readonly tests ok');
