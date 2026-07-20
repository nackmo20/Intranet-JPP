(function(A){
  A.VERSION='2.0.0-step3';
  A.PHASES=['validateTarget','goToPage','openEdit','readBefore','createBackup','applyOperations','verifyAfter','save','captureResult','nextTarget'];
  A.SELECTORS={title:'input[name="title[0][value]"], #edit-title-0-value',save:'input[type="submit"][value*="Enregistrer"], button[type="submit"]',editLink:'a[href$="/edit"], a[href*="/edit?"]',adminContent:'/admin/content',nodeIdField:'input[name="nid"], input[name="id"]',bodyEditor:'.ck-editor__editable, textarea',mediaButton:'button[data-drupal-selector*="media"], input[value*="Média"], button:has-text("Médiathèque")',autocomplete:'.ui-autocomplete:visible li, [role="option"]',fancytree:'.fancytree-container'};
  function now(){return new Date().toISOString();}
  function uid(p='id'){return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;}
  function empty(v){return v==null||String(v).trim()==='';}
  function arr(v){return Array.isArray(v)?v:(empty(v)?[]:[v]);}
  function clone(o){return JSON.parse(JSON.stringify(o||{}));}
  function normalizeJob(job){const internal={schemaVersion:'2.0',jobId:job.jobId||uid('job'),name:job.name||job.batchId||'Job EAFC',workflow:job.workflow||'mixed',generatedAt:job.generatedAt||now(),sources:job.sources||[],safety:Object.assign({simulation:true,autoSave:false,confirmClicks:true,delayMs:650,maxAttempts:2},job.safety||job.settings||{}),targets:[],operations:[],warnings:[],errors:[],legacyType:job.type||''};
    if(job.schemaVersion==='2.0'){internal.workflow=job.workflow; internal.targets=arr(job.targets).map(t=>Object.assign({operations:[]},t)); internal.operations=arr(job.operations);}
    else if(job.type==='update_drupal_pages'&&job.version==='3.0'){internal.workflow='update_content'; arr(job.items).forEach(item=>arr(item.targets).forEach(t=>{const tid=t.nodeId||uid('target'); internal.targets.push({canonicalId:tid,nodeId:String(t.nodeId||''),url:t.pageUrl||'',operations:[]}); Object.entries(t.changes||{}).forEach(([field,c])=>internal.operations.push({operationId:uid('op'),targetId:tid,field,op:c.operation||'replace',value:c.value,expectedBefore:t.expectedBefore?.[field]}));}));}
    else if(job.type==='bulk_drupal_theme_public_update'){internal.workflow='update_taxonomy'; arr(job.targets).forEach(t=>{const tid=t.nodeId||uid('target'); internal.targets.push({canonicalId:tid,nodeId:String(t.nodeId||''),url:t.pageUrl||'',operations:[]}); Object.entries(t.changes||{}).forEach(([field,c])=>internal.operations.push({operationId:uid('op'),targetId:tid,field,op:c.operation||c.op||'add',value:c.values||c.value||c.terms,expectedBefore:t.expectedBefore?.[field],expectedAfter:t.expectedAfter?.[field]}));});}
    else if(job.type==='create_pages'||job.create_pages||job.pages){internal.workflow='create'; const pages=arr(job.pages||job.create_pages); pages.forEach(p=>{const tid=p.canonicalId||p.intentionId||uid('target'); internal.targets.push({canonicalId:tid,intentionId:p.intentionId||p.id||'',nodeId:'',url:'',title:p.title||p.titleDrupal||'',operations:[]}); ['title','chapo','content','thematics','publics','geography','dates','media'].forEach(f=>{if(!empty(p[f])) internal.operations.push({operationId:uid('op'),targetId:tid,field:f,op:'replace',value:p[f]});});});}
    else {internal.errors.push('Format de Job non reconnu.');}
    internal.targets.forEach(t=>t.operations=internal.operations.filter(o=>o.targetId===t.canonicalId||String(o.targetId)===String(t.nodeId)));
    if(!internal.targets.length) internal.errors.push('Aucune cible exploitable.'); if(internal.operations.some(o=>!o.field||!o.op)) internal.errors.push('Opération incomplète.'); return internal;}
  A.core={now,uid,empty,arr,clone,normalizeJob};
})(window.EAFCAgent=window.EAFCAgent||{});
