(function(EAFC){
  const SOURCE_KINDS=['OVP','EXCEL_INVENTORY','BI_RANA','PLAN_SESSIONS','SOFIA_FMO','MANUAL','DRUPAL_CURRENT','CREATE_REPORT','UPDATE_REPORT','DEFAULT','LEGACY'];
  const WORKFLOWS={create:'create',updateContent:'update_content',updateSofia:'update_sofia',updateTaxonomy:'update_taxonomy'};
  const DEPARTMENTS=['16','17','79','86'];
  const UPDATE_FIELDS=['title','objective','content','accessibility','implementation','capacity','durationTotal','durationPresentiel','durationDistanciel','editorialPublic','prerequisites','contact','dates','locations','links','departments'];
  function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;}
  function now(){return new Date().toISOString();}
  function provenance(sourceKind, sourceId='', field='', confidence=1, manualValidation=false){return {sourceKind,sourceId,field,confidence,manualValidation,at:now()};}
  function valueWithProvenance(value, sourceKind, sourceId, field, confidence=1){return {value, provenance: provenance(sourceKind,sourceId,field,confidence,false)};}
  function createCanonical(seed={}){
    const canonicalId=seed.canonicalId||uid('page');
    return Object.assign({canonicalId,intentionId:'',exportId:'',sourceOvp:'',titleSource:'',titleDrupal:'',nodeId:'',urlDrupal:'',excelOrigin:null,thematics:[],publics:[],fancytreePaths:[],geography:{academy:true,departments:[]},departments:[],dispositifCode:'',moduleCodes:[],groups:[],sessions:[],uai:[],rne:[],locations:[],modalities:[],objective:'',content:'',accessibility:'',implementation:'',capacity:null,durationTotal:null,durationPresentiel:null,durationDistanciel:null,editorialPublic:'',prerequisites:'',contact:'',dates:{},links:[],registered:null,remainingPlaces:null,status:'draft',history:[],provenance:{},confidence:0,manualValidation:false,errors:[],warnings:[],removed:false,operations:[],matches:[]}, seed, {canonicalId});
  }
  function addHistory(model, action, detail={}){model.history.push({id:uid('hist'),at:now(),action,detail}); return model;}
  function setField(model, field, value, sourceKind, sourceId='', confidence=1){model[field]=value; model.provenance[field]=provenance(sourceKind,sourceId,field,confidence,false); return model;}
  function mergeCanonical(target, patch){Object.keys(patch||{}).forEach(k=>{ if(k==='canonicalId')return; if(Array.isArray(patch[k])) target[k]=Array.from(new Set([...(target[k]||[]),...patch[k]])); else if(patch[k]&&typeof patch[k]==='object'&&!Array.isArray(patch[k])) target[k]=Object.assign({}, target[k]||{}, patch[k]); else if(patch[k]!==''&&patch[k]!=null) target[k]=patch[k]; }); return target;}
  EAFC.model={SOURCE_KINDS,WORKFLOWS,DEPARTMENTS,UPDATE_FIELDS,uid,now,provenance,valueWithProvenance,createCanonical,addHistory,setField,mergeCanonical};
})(window.EAFC=window.EAFC||{});
